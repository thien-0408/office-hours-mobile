import { StompManager } from '../src/realtime/stomp/StompManager';
import {
  jwtExpiryMs,
  needsRefresh,
  stompUrlFromApiBase,
} from '../src/realtime/stomp/url';
import { utf8Decode, utf8Encode } from '../src/realtime/stomp/textCodec';

declare const Buffer: any;

function jwt(expSeconds: number): string {
  const enc = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString('base64').replace(/[=]+$/, '');
  return `${enc({ alg: 'none' })}.${enc({ exp: expSeconds })}.sig`;
}
const nowSec = () => Math.floor(Date.now() / 1000);

class FakeSocket {
  static all: FakeSocket[] = [];
  readyState = 0;
  binaryType = 'arraybuffer';
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  constructor(public url: string) {
    FakeSocket.all.push(this);
  }
  send(data: string | Uint8Array) {
    this.sent.push(
      typeof data === 'string' ? data : Buffer.from(data).toString('utf8'),
    );
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  serverSend(frame: string) {
    this.onmessage?.({ data: frame + '\0' });
  }
  drop() {
    this.readyState = 3;
    this.onclose?.();
  }
  frames(command: string) {
    return this.sent.filter(f => f.startsWith(command + '\n'));
  }
}

const waitFor = async (cond: () => boolean, ms = 2000) => {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) {
      throw new Error('waitFor timed out');
    }
    await new Promise<void>(r => setTimeout(r, 5));
  }
};

function make(over: Partial<ConstructorParameters<typeof StompManager>[0]> = {}) {
  FakeSocket.all = [];
  return new StompManager({
    getUrl: () => 'ws://host/api/v1/ws',
    getAccessToken: async () => jwt(nowSec() + 3600),
    refreshAccessToken: async () => jwt(nowSec() + 7200),
    webSocketFactory: url => new FakeSocket(url) as never,
    heartbeatMs: 0,
    reconnectDelayMs: 10,
    maxReconnectDelayMs: 20,
    lingerMs: 5,
    ...over,
  });
}

async function connect(m: StompManager, idx = FakeSocket.all.length) {
  await waitFor(() => FakeSocket.all.length > idx);
  const sock = FakeSocket.all[idx];
  sock.open();
  await waitFor(() => sock.frames('CONNECT').length + sock.frames('STOMP').length > 0);
  sock.serverSend('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n');
  await waitFor(() => m.getState() === 'connected');
  return sock;
}

test('CONNECT carries the bearer token and the URL is the /ws endpoint', async () => {
  const token = jwt(nowSec() + 3600);
  const m = make({ getAccessToken: async () => token });
  const release = m.retain();
  const sock = await connect(m);
  expect(sock.url).toBe('ws://host/api/v1/ws');
  const connectFrame = sock.frames('CONNECT')[0] ?? sock.frames('STOMP')[0];
  expect(connectFrame).toContain(`Authorization:Bearer ${token}`);
  release();
});

test('an expired access token is refreshed before CONNECT', async () => {
  const fresh = jwt(nowSec() + 7200);
  const refresh = jest.fn(async () => fresh);
  const m = make({
    getAccessToken: async () => jwt(nowSec() - 10),
    refreshAccessToken: refresh,
  });
  const release = m.retain();
  const sock = await connect(m);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(sock.sent.join('')).toContain(`Bearer ${fresh}`);
  release();
});

test('subscriptions are replayed after a reconnect and messages keep flowing', async () => {
  const m = make();
  const release = m.retain();
  const got: string[] = [];
  m.subscribe('/topic/bookings/b1/messages', msg => got.push(msg.body));
  const first = await connect(m);
  expect(first.frames('SUBSCRIBE')).toHaveLength(1);
  expect(first.frames('SUBSCRIBE')[0]).toContain(
    'destination:/topic/bookings/b1/messages',
  );
  const subId = first
    .frames('SUBSCRIBE')[0]
    .split('\n')
    .find(l => l.startsWith('id:'))
    ?.slice(3);
  first.serverSend(
    `MESSAGE\nsubscription:${subId}\nmessage-id:1\ndestination:/topic/bookings/b1/messages\n\n{"a":1}`,
  );
  expect(got).toEqual(['{"a":1}']);
  expect(m.getConnectCount()).toBe(1);

  first.drop();
  await waitFor(() => m.getState() === 'reconnecting');
  const second = await connect(m);
  expect(second).not.toBe(first);
  expect(second.frames('SUBSCRIBE')).toHaveLength(1);
  expect(m.getConnectCount()).toBe(2);
  release();
});

test('publish sends a JSON frame only while connected', async () => {
  const m = make();
  expect(m.publish('/app/x', { a: 1 })).toBe(false);
  const release = m.retain();
  const sock = await connect(m);
  expect(m.publish('/app/bookings/b1/typing', { typing: true })).toBe(true);
  const frame = sock.frames('SEND')[0];
  expect(frame).toContain('destination:/app/bookings/b1/typing');
  expect(frame).toContain('{"typing":true}');
  release();
});

test('releasing the last consumer closes the socket after the linger', async () => {
  const m = make();
  const release = m.retain();
  await connect(m);
  release();
  await waitFor(() => m.getState() === 'idle');
});

test('background for longer than the grace drops the socket; foreground reconnects', async () => {
  let listener: (s: string) => void = () => {};
  const m = make({
    backgroundGraceMs: 10,
    appState: {
      addEventListener: (_t, l) => {
        listener = l;
        return { remove: () => {} };
      },
    },
  });
  m.retain();
  await connect(m);
  listener('background');
  await waitFor(() => m.getState() === 'idle');
  const before = FakeSocket.all.length;
  listener('active');
  await connect(m, before);
  expect(m.getConnectCount()).toBe(2);
});

test('url and jwt helpers', () => {
  expect(stompUrlFromApiBase('http://10.0.2.2:8080/api/v1/')).toBe(
    'ws://10.0.2.2:8080/api/v1/ws',
  );
  expect(stompUrlFromApiBase('https://x.vn/api/v1')).toBe(
    'wss://x.vn/api/v1/ws',
  );
  expect(jwtExpiryMs(jwt(100))).toBe(100_000);
  expect(jwtExpiryMs('garbage')).toBeNull();
  expect(needsRefresh(null, 0)).toBe(true);
  expect(needsRefresh(jwt(1000), 990_000)).toBe(true); // inside the 30 s skew
  expect(needsRefresh(jwt(1000), 900_000)).toBe(false);
  expect(needsRefresh('opaque', 0)).toBe(false);
});

test('utf-8 fallback codec round-trips Vietnamese and emoji', () => {
  const s = 'Em chào thầy ạ, đề cương 😀';
  expect(utf8Decode(utf8Encode(s))).toBe(s);
  expect(Buffer.from(utf8Encode(s)).toString('utf8')).toBe(s);
});
