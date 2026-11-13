import {
  shouldPublish,
  type LocationFix,
  type PublishPoint,
} from '../../campus/geo';
import {
  OUTSIDE_BUILDING,
  type LiveFloorSource,
  type LiveLocationPayload,
  type LiveLocationTransport,
} from './types';

export function buildPayload(
  fix: LocationFix,
  floor: number | null,
  floorSource: LiveFloorSource | null,
  updatedAt: number,
): LiveLocationPayload {
  const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
  const payload: LiveLocationPayload = {
    building: fix.block ?? OUTSIDE_BUILDING,
    x: clamp(fix.x, 1000),
    z: clamp(fix.z, 1000),
    acc: Math.max(0, Math.min(200, fix.acc)),
    updatedAt,
  };
  if (floor != null) {
    payload.floor = Math.max(-2, Math.min(20, Math.round(floor)));
    if (floorSource) {
      payload.floorSource = floorSource;
    }
  }
  return payload;
}

/**
 * Throttled writer for one booking: publishes the first fix, then only when
 * geo.shouldPublish says so (>= 5 s, >= 5 m, or block changed).
 */
export function createLivePublisher(
  transport: LiveLocationTransport,
  bookingId: string,
) {
  let last: PublishPoint | null = null;
  let active = true;
  return {
    /** Returns true when a write happened. */
    push(
      fix: LocationFix,
      floor: number | null,
      floorSource: LiveFloorSource | null,
      now: number,
    ): boolean {
      if (!active) {
        return false;
      }
      const next: PublishPoint = {
        x: fix.x,
        z: fix.z,
        block: fix.block,
        timestamp: now,
      };
      if (!shouldPublish(last, next, now)) {
        return false;
      }
      last = next;
      transport.publish(bookingId, buildPayload(fix, floor, floorSource, now));
      return true;
    },
    /** Deletes my location and refuses further writes. */
    stop() {
      if (!active) {
        return;
      }
      active = false;
      last = null;
      transport.remove(bookingId);
    },
  };
}
