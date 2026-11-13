import type {
  LiveLocationPayload,
  LiveLocationTransport,
  PeerLocations,
} from './types';

export type StubTransport = LiveLocationTransport & {
  /** Test/dev helper: write another participant's location. */
  setPeer(bookingId: string, uid: string, payload: LiveLocationPayload): void;
  /** Test/dev helper: delete another participant's location. */
  removePeer(bookingId: string, uid: string): void;
  /** Snapshot of everything stored for a booking. */
  get(bookingId: string): PeerLocations;
  /** Calls recorded for assertions. */
  calls: {
    publish: Array<{ bookingId: string; payload: LiveLocationPayload }>;
    remove: string[];
  };
};

/** In-memory transport: used until the RTDB one exists (MO-14), and in tests. */
export function createStubTransport(
  options: { uid?: string } = {},
): StubTransport {
  const uid = options.uid ?? 'me';
  const data = new Map<string, PeerLocations>();
  const listeners = new Map<string, Set<(p: PeerLocations) => void>>();
  const calls: StubTransport['calls'] = { publish: [], remove: [] };

  const snapshot = (bookingId: string): PeerLocations => ({
    ...(data.get(bookingId) ?? {}),
  });
  const emit = (bookingId: string) => {
    const snap = snapshot(bookingId);
    listeners.get(bookingId)?.forEach(cb => cb({ ...snap }));
  };
  const write = (
    bookingId: string,
    who: string,
    payload: LiveLocationPayload | null,
  ) => {
    const next = snapshot(bookingId);
    if (payload) {
      next[who] = { ...payload };
    } else {
      delete next[who];
    }
    data.set(bookingId, next);
    emit(bookingId);
  };

  return {
    publish(bookingId, payload) {
      calls.publish.push({ bookingId, payload });
      write(bookingId, uid, payload);
    },
    subscribe(bookingId, cb) {
      let set = listeners.get(bookingId);
      if (!set) {
        set = new Set();
        listeners.set(bookingId, set);
      }
      set.add(cb);
      cb(snapshot(bookingId));
      return () => {
        set?.delete(cb);
      };
    },
    remove(bookingId) {
      calls.remove.push(bookingId);
      write(bookingId, uid, null);
    },
    setPeer: (bookingId, who, payload) => write(bookingId, who, payload),
    removePeer: (bookingId, who) => write(bookingId, who, null),
    get: snapshot,
    calls,
  };
}
