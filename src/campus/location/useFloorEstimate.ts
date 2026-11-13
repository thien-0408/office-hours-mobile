import { useCallback, useEffect, useRef, useState } from 'react';
import { Barometer } from 'expo-sensors';
import { campus } from '../campusData';
import {
  createFloorEstimator,
  type FloorEstimate,
  type FloorSource,
} from '../geo';

export type UseFloorEstimateResult = {
  floor: number | null;
  source: FloorSource;
  /** Whether the device has a barometer; false -> UI shows "Tầng ?" until the user picks. */
  barometer: boolean | null;
  /** Manual choice; held until the user leaves the block. null clears it. */
  setManualFloor: (floor: number | null) => void;
};

const NONE: FloorEstimate = { floor: null, source: null };

export function clampFloor(floor: number, floors: number): number {
  return Math.max(1, Math.min(Math.max(1, floors), Math.round(floor)));
}

/**
 * Floor of the user inside `blockCode`, from the barometer (relative to the
 * pressure when the block was entered) with a manual override.
 * Without a barometer the result is {floor: null, source: null} until the user
 * picks a floor by hand.
 */
export function useFloorEstimate(
  blockCode: string | null,
  options: { enabled?: boolean } = {},
): UseFloorEstimateResult {
  const enabled = options.enabled ?? true;
  const [barometer, setBarometer] = useState<boolean | null>(null);
  const [baro, setBaro] = useState<FloorEstimate>(NONE);
  const [manual, setManual] = useState<number | null>(null);
  const floorsRef = useRef(1);

  const floors = blockCode
    ? campus.blocks.find(b => b.code === blockCode)?.floors ?? 1
    : 1;
  floorsRef.current = floors;

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      return undefined;
    }
    Barometer.isAvailableAsync()
      .then(ok => {
        if (!cancelled) {
          setBarometer(ok);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBarometer(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Entering/leaving a block resets the baseline and any manual choice.
  useEffect(() => {
    setManual(null);
    setBaro(NONE);
  }, [blockCode]);

  useEffect(() => {
    if (!enabled || !barometer || !blockCode) {
      return undefined;
    }
    const estimator = createFloorEstimator();
    let entered = false;
    Barometer.setUpdateInterval(1000);
    const sub = Barometer.addListener(({ pressure }) => {
      const now = Date.now();
      let next: FloorEstimate;
      if (!entered) {
        // The first reading inside the block is the floor-1 baseline.
        next = estimator.onEnterBlock(pressure, floorsRef.current);
        entered = true;
      } else {
        next = estimator.onPressure(pressure, now);
      }
      setBaro(prev =>
        prev.floor === next.floor && prev.source === next.source ? prev : next,
      );
    });
    return () => {
      sub.remove();
      estimator.onExitBlock();
    };
  }, [enabled, barometer, blockCode]);

  const setManualFloor = useCallback((value: number | null) => {
    setManual(value == null ? null : clampFloor(value, floorsRef.current));
  }, []);

  if (!blockCode) {
    return { ...NONE, barometer, setManualFloor };
  }
  if (manual != null) {
    return { floor: manual, source: 'manual', barometer, setManualFloor };
  }
  return { ...(barometer ? baro : NONE), barometer, setManualFloor };
}
