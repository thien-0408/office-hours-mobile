// Pure rules for when live location may be shared (MOBILE-PLAN section 4:
// both opted in, app open, inside the booking window). No React imports.
import { MEETING_JOIN_AFTER_MIN } from '../../api/bookingTime';
import type { Booking } from '../../api/domainTypes';
import { formatVnTime } from '../../api/time';
import { locationLabel } from '../../campus/geo';
import {
  OUTSIDE_BUILDING,
  type LiveLocationPayload,
  type PeerLocation,
} from './types';

const MIN = 60_000;

/** Sharing is allowed from startAt to endAt + 15 min (same as the RTDB rules). */
export const SHARE_AFTER_END_MIN = MEETING_JOIN_AFTER_MIN;
/** A peer silent for longer than this is "mất tín hiệu". */
export const STALE_AFTER_MS = 30_000;

type Times = Pick<Booking, 'startAt' | 'endAt'>;

export function sharingWindow(booking: Times): { start: number; end: number } {
  return {
    start: Date.parse(booking.startAt),
    end: Date.parse(booking.endAt) + SHARE_AFTER_END_MIN * MIN,
  };
}

export function isInSharingWindow(booking: Times, now: number): boolean {
  const w = sharingWindow(booking);
  return now >= w.start && now <= w.end;
}

/** "Chia sẻ vị trí mở từ 14:00 đến 14:45". */
export function sharingWindowText(booking: Times): string {
  const w = sharingWindow(booking);
  return `Chia sẻ vị trí mở từ ${formatVnTime(w.start)} đến ${formatVnTime(
    w.end,
  )}`;
}

export type GateReason = 'no-consent' | 'outside-window' | 'off';

export type GateResult =
  | { allowed: true; reason: null }
  | { allowed: false; reason: GateReason };

/**
 * consent granted AND inside the window AND the user's toggle on.
 * (App foreground is enforced by useCampusLocation.)
 */
export function sharingGate(input: {
  consentGranted: boolean;
  booking: Times | null | undefined;
  now: number;
  userEnabled: boolean;
}): GateResult {
  if (!input.consentGranted) {
    return { allowed: false, reason: 'no-consent' };
  }
  if (!input.booking || !isInSharingWindow(input.booking, input.now)) {
    return { allowed: false, reason: 'outside-window' };
  }
  if (!input.userEnabled) {
    return { allowed: false, reason: 'off' };
  }
  return { allowed: true, reason: null };
}

// ---- peer display -------------------------------------------------------

export function isStale(
  peer: Pick<PeerLocation, 'updatedAt'>,
  now: number,
): boolean {
  return now - peer.updatedAt > STALE_AFTER_MS;
}

/** "cập nhật 5s trước" or "mất tín hiệu". */
export function freshnessText(
  peer: Pick<PeerLocation, 'updatedAt'>,
  now: number,
): string {
  if (isStale(peer, now)) {
    return 'mất tín hiệu';
  }
  return `cập nhật ${Math.max(
    0,
    Math.round((now - peer.updatedAt) / 1000),
  )}s trước`;
}

export type RoomTargetLike = {
  blockCode: string | null;
  floor: number | null;
  label: string;
};

/** Inside the destination block, on the destination floor. */
export function isAtRoom(
  where: { building: string; floor?: number | null },
  target: RoomTargetLike | null | undefined,
): boolean {
  return (
    !!target &&
    target.blockCode != null &&
    target.floor != null &&
    !!target.label &&
    where.building === target.blockCode &&
    where.floor === target.floor
  );
}

/** STYLE-MOCHY 8.10 label: "tại phòng 306.B11" / "B11 · tầng 2 (ước lượng)". */
export function peerLocationText(
  where: {
    building: string;
    floor?: number | null;
    floorSource?: LiveLocationPayload['floorSource'] | null;
  },
  target: RoomTargetLike | null | undefined,
): string {
  if (target && isAtRoom(where, target)) {
    return locationLabel(where.building, where.floor, 'room', target.label);
  }
  return locationLabel(
    where.building === OUTSIDE_BUILDING ? null : where.building,
    where.floor,
    where.floorSource,
  );
}
