// Live location payload and transport contract for screen 22 (LiveMeeting).
// Shapes follow SCREENS-FIREBASE section 2.7 (rules validate these exact keys).
// Path: /bookingLive/{bookingId}/{uid} on the Realtime Database.

/** building value for a fix outside every block (rules reject an empty string). */
export const OUTSIDE_BUILDING = 'OUTSIDE';

/** 'room' = the floor is known from a real room, not a guess. */
export type LiveFloorSource = 'baro' | 'manual' | 'room';

export type LiveLocationPayload = {
  /** Block code ("B11"), 1-16 chars, required. OUTSIDE_BUILDING when outside every block. */
  building: string;
  /** Rules: number within +-1000. */
  x: number;
  z: number;
  /** Rules: 0..200. */
  acc: number;
  /** Integer -2..20. Key omitted when unknown ("Tầng ?"); no other children allowed. */
  floor?: number;
  floorSource?: LiveFloorSource;
  /** Epoch milliseconds (client clock; the transport may swap in the server timestamp). */
  updatedAt: number;
};

export type PeerLocation = LiveLocationPayload;

/** uid -> last location. The subscription may include the caller's own uid. */
export type PeerLocations = Record<string, PeerLocation>;

export interface LiveLocationTransport {
  /** Writes the caller's own location. */
  publish(bookingId: string, payload: LiveLocationPayload): void;
  /** Calls `cb` with every participant's location now and on each change. Returns unsubscribe. */
  subscribe(bookingId: string, cb: (peers: PeerLocations) => void): () => void;
  /** Deletes the caller's own location. */
  remove(bookingId: string): void;
}
