import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Booking } from '../../api/domainTypes';
import { useLocationConsent } from '../../campus/consent';
import type { LocationFix } from '../../campus/geo';
import { useCampusLocation } from '../../campus/location/useCampusLocation';
import { useFloorEstimate } from '../../campus/location/useFloorEstimate';
import { sharingGate, type GateResult } from './gating';
import { createLivePublisher } from './publisher';
import { getLiveLocationTransport } from './transport';
import type { LiveFloorSource, PeerLocations } from './types';

export type UseLiveLocationSharingOptions = {
  /** My uid (booking.studentId or lecturerId); filtered out of `peers`. */
  myUid: string | null;
  /** The in-screen "Chia sẻ vị trí" switch. */
  userEnabled: boolean;
  /** Current time; re-evaluates the window. Pass a ticking value (useNow). */
  now: number;
};

export type UseLiveLocationSharingResult = {
  gate: GateResult;
  /** My filtered fix (null while off or still waiting). */
  fix: LocationFix | null;
  floor: number | null;
  floorSource: LiveFloorSource | null;
  locationStatus: ReturnType<typeof useCampusLocation>['status'];
  /** The other participants' locations; empty unless I am sharing too (mutual opt-in). */
  peers: PeerLocations;
};

/**
 * Publishes my location to the booking's live channel and subscribes to the
 * other side. Everything stops (and my location is removed) when consent is
 * lost, the window closes, the toggle goes off, the app backgrounds, or the
 * screen unmounts.
 */
export function useLiveLocationSharing(
  booking: Pick<Booking, 'id' | 'startAt' | 'endAt'> | null | undefined,
  { myUid, userEnabled, now }: UseLiveLocationSharingOptions,
): UseLiveLocationSharingResult {
  const consentGranted = useLocationConsent().status === 'granted';
  const gate = sharingGate({ consentGranted, booking, now, userEnabled });
  // MOBILE-PLAN §4: only while the app is open. Leaving the foreground must
  // also remove my last location, not just pause the GPS watcher.
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', next =>
      setForeground(next === 'active'),
    );
    return () => sub?.remove();
  }, []);
  const allowed = gate.allowed && foreground;
  const bookingId = booking?.id ?? null;

  const publisherRef = useRef<ReturnType<typeof createLivePublisher> | null>(
    null,
  );
  const floorRef = useRef<{
    floor: number | null;
    source: LiveFloorSource | null;
  }>({ floor: null, source: null });

  const loc = useCampusLocation({
    enabled: allowed,
    onFix: fix => {
      publisherRef.current?.push(
        fix,
        floorRef.current.floor,
        floorRef.current.source,
        Date.now(),
      );
    },
  });
  const floorEst = useFloorEstimate(loc.fix?.block ?? null, {
    enabled: allowed,
  });
  floorRef.current = { floor: floorEst.floor, source: floorEst.source };

  const [allPeers, setAllPeers] = useState<PeerLocations>({});

  // Publisher lifetime = "allowed" for this booking. Cleanup removes my location.
  useEffect(() => {
    if (!allowed || !bookingId) {
      return undefined;
    }
    const transport = getLiveLocationTransport();
    const publisher = createLivePublisher(transport, bookingId);
    publisherRef.current = publisher;
    const unsubscribe = transport.subscribe(bookingId, setAllPeers);
    return () => {
      unsubscribe();
      publisher.stop();
      if (publisherRef.current === publisher) {
        publisherRef.current = null;
      }
      setAllPeers({});
    };
  }, [allowed, bookingId]);

  const peers: PeerLocations = {};
  if (allowed) {
    for (const [uid, p] of Object.entries(allPeers)) {
      if (uid !== myUid) {
        peers[uid] = p;
      }
    }
  }

  return {
    gate,
    fix: allowed ? loc.fix : null,
    floor: floorEst.floor,
    floorSource: floorEst.source,
    locationStatus: loc.status,
    peers,
  };
}
