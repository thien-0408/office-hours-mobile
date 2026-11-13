import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import {
  createLocationFilter,
  type FilterState,
  type LocationFix,
  type LocationReading,
} from '../geo';

export type LocationStatus = 'off' | 'waiting' | 'ok' | 'denied' | 'error';

export type UseCampusLocationOptions = {
  /**
   * Consent granted AND screen focused. The hook adds the OS permission check
   * and the app-foreground check on top. Nothing is watched while false.
   */
  enabled: boolean;
  /**
   * Called with every accepted fix (after filtering). Firebase publishing
   * (a later task) hangs off this and gates it with geo.shouldPublish().
   */
  onFix?: (fix: LocationFix, reading: LocationReading) => void;
  /** Overrides, mainly for tests. */
  intervalMs?: number;
};

export type UseCampusLocationResult = {
  fix: LocationFix | null;
  status: LocationStatus;
  /** Last raw reading, accepted or not (accuracy display, debugging). */
  lastReading: LocationReading | null;
};

const WATCH_INTERVAL_MS = 2000;

/** Foreground-only: no background location, no network writes. */
export function useCampusLocation({
  enabled,
  onFix,
  intervalMs = WATCH_INTERVAL_MS,
}: UseCampusLocationOptions): UseCampusLocationResult {
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [status, setStatus] = useState<LocationStatus>('off');
  const [lastReading, setLastReading] = useState<LocationReading | null>(null);
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive',
  );

  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => {
        setForeground(next === 'active');
      },
    );
    return () => sub?.remove();
  }, []);

  const active = enabled && foreground;

  useEffect(() => {
    if (!active) {
      setStatus('off');
      return undefined;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    const filter = createLocationFilter();
    let state: FilterState = filter.getInitialState();
    let hasFix = false;

    setStatus('waiting');

    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (cancelled) {
          return;
        }
        if (!perm.granted) {
          setStatus('denied');
          return;
        }
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: intervalMs,
            distanceInterval: 0,
          },
          pos => {
            if (cancelled) {
              return;
            }
            const reading: LocationReading = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? Number.POSITIVE_INFINITY,
              timestamp: pos.timestamp,
            };
            setLastReading(reading);
            const result = filter.step(state, reading);
            state = result.state;
            if (result.fix) {
              hasFix = true;
              setFix(result.fix);
              setStatus('ok');
              onFixRef.current?.(result.fix, reading);
            } else if (!hasFix) {
              setStatus('waiting');
            }
          },
        );
        if (cancelled) {
          sub.remove();
          return;
        }
        subscription = sub;
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      subscription = null;
    };
  }, [active, intervalMs]);

  // A stale dot must not survive after the user stops sharing.
  useEffect(() => {
    if (!enabled) {
      setFix(null);
      setLastReading(null);
    }
  }, [enabled]);

  return { fix, status, lastReading };
}
