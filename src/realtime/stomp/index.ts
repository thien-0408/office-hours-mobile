import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { getApiBaseUrl } from '../../api/config';
import { refreshAccessToken } from '../../api/client';
import { getAccessToken } from '../../api/tokenStore';
import { StompManager, type StompState } from './StompManager';
import { stompUrlFromApiBase } from './url';

export { StompManager } from './StompManager';
export type { StompState, StompManagerDeps } from './StompManager';
export { stompUrlFromApiBase, jwtExpiryMs, needsRefresh } from './url';

let manager: StompManager | null = null;

/** The app-wide STOMP client (created on first use). */
export function getStompManager(): StompManager {
  if (!manager) {
    manager = new StompManager({
      getUrl: () => stompUrlFromApiBase(getApiBaseUrl()),
      getAccessToken,
      refreshAccessToken,
      appState: AppState,
    });
  }
  return manager;
}

/** Keeps the connection open while the calling component is mounted; returns its state. */
export function useStompState(): StompState {
  const m = getStompManager();
  useEffect(() => m.retain(), [m]);
  return useSyncExternalStore(m.onStateChange, m.getState, m.getState);
}

/** Re-renders on each CONNECTED, so effects can refetch what was missed. */
export function useStompConnectCount(): number {
  const m = getStompManager();
  return useSyncExternalStore(m.onConnected, m.getConnectCount, m.getConnectCount);
}

/**
 * Subscribes to a destination for the lifetime of the component and across reconnects.
 * `handler` gets the parsed JSON body (frames that are not JSON are ignored). Pass null to pause.
 */
export function useStompSubscription<T = unknown>(
  destination: string | null,
  handler: (body: T) => void,
): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!destination) {
      return undefined;
    }
    const m = getStompManager();
    const release = m.retain();
    const off = m.subscribe(destination, msg => {
      let parsed: T;
      try {
        parsed = JSON.parse(msg.body) as T;
      } catch {
        return;
      }
      ref.current(parsed);
    });
    return () => {
      off();
      release();
    };
  }, [destination]);
}

/** Publish a JSON body; false when the socket is not connected. */
export function stompPublish(destination: string, body: unknown): boolean {
  return getStompManager().publish(destination, body);
}
