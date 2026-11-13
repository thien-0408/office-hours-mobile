import {
  Client,
  ReconnectionTimeMode,
  type IMessage,
  type IStompSocket,
  type StompSubscription,
} from '@stomp/stompjs';
import { installTextCodecIfMissing } from './textCodec';
import { needsRefresh } from './url';

installTextCodecIfMissing();

/** idle: nobody needs the socket. reconnecting: was connected (or failed once), retrying. */
export type StompState = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export type AppStateLike = {
  addEventListener(
    type: 'change',
    listener: (next: string) => void,
  ): { remove: () => void };
};

export type StompManagerDeps = {
  /** ws(s)://.../api/v1/ws, read on every connect attempt (base URL can change at runtime). */
  getUrl: () => string;
  getAccessToken: () => Promise<string | null>;
  /** Single-flight refresh from src/api/client. Resolves with the new access token. */
  refreshAccessToken: () => Promise<string>;
  appState?: AppStateLike;
  /** Test seam: a fake WebSocket. Defaults to the global WebSocket on the URL. */
  webSocketFactory?: (url: string) => IStompSocket;
  now?: () => number;
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  heartbeatMs?: number;
  /** How long the socket survives in the background / with no consumer. */
  backgroundGraceMs?: number;
  lingerMs?: number;
  connectionTimeoutMs?: number;
};

type Entry = {
  destination: string;
  onMessage: (message: IMessage) => void;
  sub: StompSubscription | null;
};

/**
 * One app-wide STOMP connection (CONVENTIONS: chat goes over STOMP to /ws).
 * Consumers `retain()` it while they need it; subscriptions registered through `subscribe`
 * are replayed on every (re)connect. Auth: `Authorization: Bearer <access>` in CONNECT,
 * refreshed first when the access token is (nearly) expired or the last attempt was rejected.
 */
export class StompManager {
  private client: Client | null = null;
  private state: StompState = 'idle';
  private retainCount = 0;
  private everConnected = false;
  private forceRefresh = false;
  private entries = new Map<number, Entry>();
  private nextId = 1;
  private stateListeners = new Set<() => void>();
  private connectListeners = new Set<() => void>();
  private connectCount = 0;
  private appStateSub: { remove: () => void } | null = null;
  private backgroundTimer: ReturnType<typeof setTimeout> | null = null;
  private lingerTimer: ReturnType<typeof setTimeout> | null = null;
  private inBackground = false;

  constructor(private readonly deps: StompManagerDeps) {}

  // ---- state (useSyncExternalStore friendly) ----
  getState = (): StompState => this.state;
  /** Increments on every successful CONNECTED. */
  getConnectCount = (): number => this.connectCount;

  onStateChange = (listener: () => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  };

  /** Fires after each CONNECTED, once subscriptions were replayed. */
  onConnected = (listener: () => void): (() => void) => {
    this.connectListeners.add(listener);
    return () => {
      this.connectListeners.delete(listener);
    };
  };

  private setState(next: StompState) {
    if (this.state !== next) {
      this.state = next;
      this.stateListeners.forEach(l => l());
    }
  }

  // ---- lifecycle ----
  /** Declare that something needs the connection. Returns the matching release. */
  retain = (): (() => void) => {
    this.retainCount += 1;
    this.clearLinger();
    this.ensureAppStateListener();
    if (!this.inBackground) {
      this.activate();
    }
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.retainCount = Math.max(0, this.retainCount - 1);
      if (this.retainCount === 0) {
        this.scheduleLinger();
      }
    };
  };

  private scheduleLinger() {
    this.clearLinger();
    this.lingerTimer = setTimeout(() => {
      this.lingerTimer = null;
      if (this.retainCount === 0) {
        this.shutdown();
      }
    }, this.deps.lingerMs ?? 10_000);
  }

  private clearLinger() {
    if (this.lingerTimer) {
      clearTimeout(this.lingerTimer);
      this.lingerTimer = null;
    }
  }

  private ensureAppStateListener() {
    if (this.appStateSub || !this.deps.appState) {
      return;
    }
    this.appStateSub = this.deps.appState.addEventListener('change', next =>
      this.handleAppState(next),
    );
  }

  /** Foreground: reconnect right away. Background: keep the socket a while, then drop it. */
  handleAppState(next: string) {
    if (next === 'active') {
      this.inBackground = false;
      if (this.backgroundTimer) {
        clearTimeout(this.backgroundTimer);
        this.backgroundTimer = null;
      }
      if (this.retainCount > 0) {
        this.activate();
      }
    } else if (next === 'background') {
      this.inBackground = true;
      if (!this.backgroundTimer) {
        this.backgroundTimer = setTimeout(() => {
          this.backgroundTimer = null;
          this.pause();
        }, this.deps.backgroundGraceMs ?? 60_000);
      }
    }
  }

  private shutdown() {
    this.pause();
    this.appStateSub?.remove();
    this.appStateSub = null;
  }

  /** Drop the socket but keep registered subscriptions for the next activate(). */
  private pause() {
    const c = this.client;
    this.client = null;
    this.entries.forEach(e => {
      e.sub = null;
    });
    if (c) {
      c.deactivate().catch(() => {});
    }
    this.setState('idle');
  }

  private activate() {
    if (this.client) {
      // An existing client reconnects by itself; after a long outage nudge it.
      if (this.state === 'idle' && !this.client.active) {
        this.client.activate();
      }
      return;
    }
    this.client = this.buildClient();
    this.setState(this.everConnected ? 'reconnecting' : 'connecting');
    this.client.activate();
  }

  private buildClient(): Client {
    const deps = this.deps;
    const client = new Client({
      // Frames go out as binary: RN's text frames break on the STOMP NUL terminator.
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: deps.reconnectDelayMs ?? 1000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      maxReconnectDelay: deps.maxReconnectDelayMs ?? 30_000,
      heartbeatIncoming: deps.heartbeatMs ?? 10_000,
      heartbeatOutgoing: deps.heartbeatMs ?? 10_000,
      connectionTimeout: deps.connectionTimeoutMs ?? 10_000,
    });
    client.webSocketFactory = () => {
      const url = deps.getUrl();
      return deps.webSocketFactory
        ? deps.webSocketFactory(url)
        : (new WebSocket(url) as unknown as IStompSocket);
    };
    client.beforeConnect = async () => {
      client.connectHeaders = {
        Authorization: `Bearer ${await this.freshToken()}`,
      };
    };
    client.onConnect = () => {
      this.everConnected = true;
      this.forceRefresh = false;
      this.connectCount += 1;
      this.replaySubscriptions(client);
      this.setState('connected');
      this.connectListeners.forEach(l => l());
    };
    // The server answers a rejected frame (bad/expired token) with ERROR and closes.
    client.onStompError = () => {
      this.forceRefresh = true;
    };
    client.onWebSocketClose = () => {
      this.entries.forEach(e => {
        e.sub = null;
      });
      if (this.client === client && this.retainCount > 0) {
        this.setState('reconnecting');
      }
    };
    return client;
  }

  private async freshToken(): Promise<string> {
    const now = (this.deps.now ?? Date.now)();
    let token = await this.deps.getAccessToken();
    if (this.forceRefresh || needsRefresh(token, now)) {
      try {
        token = await this.deps.refreshAccessToken();
      } catch {
        // Offline or session gone: try the old token, the server decides and we retry.
      }
    }
    return token ?? '';
  }

  // ---- subscriptions ----
  /** Registers a destination; replayed after every reconnect. Returns unsubscribe. */
  subscribe = (
    destination: string,
    onMessage: (message: IMessage) => void,
  ): (() => void) => {
    const id = this.nextId++;
    const entry: Entry = { destination, onMessage, sub: null };
    this.entries.set(id, entry);
    if (this.client?.connected) {
      this.attach(this.client, entry);
    }
    return () => {
      this.entries.delete(id);
      try {
        entry.sub?.unsubscribe();
      } catch {
        // socket already gone
      }
      entry.sub = null;
    };
  };

  private attach(client: Client, entry: Entry) {
    entry.sub = client.subscribe(entry.destination, msg => entry.onMessage(msg));
  }

  private replaySubscriptions(client: Client) {
    this.entries.forEach(e => this.attach(client, e));
  }

  /** Sends a JSON body; false when not connected (caller decides: fail or queue). */
  publish = (destination: string, body: unknown): boolean => {
    const c = this.client;
    if (!c || !c.connected) {
      return false;
    }
    try {
      c.publish({ destination, body: JSON.stringify(body) });
      return true;
    } catch {
      return false;
    }
  };
}
