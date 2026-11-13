import { createStubTransport } from './stubTransport';
import type { LiveLocationTransport } from './types';

// TODO(MO-14): add createRtdbTransport() (src/realtime/location/rtdbTransport.ts) on
// @react-native-firebase/database: publish = ref(`/bookingLive/${id}/${uid}`).set(payload),
// subscribe = ref(`/bookingLive/${id}`).on('value', ...), and in publish also arm
// ref(...).onDisconnect().remove(); remove = ref(...).remove() + cancel onDisconnect.
// Then call setLiveLocationTransport(createRtdbTransport()) once Firebase auth is signed in.
let current: LiveLocationTransport = createStubTransport();

/** Module-level so screens and hooks need no provider; swap it once at app start. */
export function getLiveLocationTransport(): LiveLocationTransport {
  return current;
}

export function setLiveLocationTransport(next: LiveLocationTransport): void {
  current = next;
}
