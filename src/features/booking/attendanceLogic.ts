import type { Booking } from '../../api/domainTypes';
import type { UserRole } from '../../api/types';

/**
 * Pure helper determining whether the lecturer attendance confirmation
 * actions ("Đã gặp" / "Vắng mặt") can be shown.
 *
 * Requirements:
 * 1. Role is LECTURER.
 * 2. Booking status is CONFIRMED.
 * 3. Current time is at or past the slot's startAt (nowMs >= startAt).
 */
export function canConfirmAttendance(
  booking: Pick<Booking, 'status' | 'startAt'> | null | undefined,
  role: UserRole | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!booking || role !== 'LECTURER' || booking.status !== 'CONFIRMED') {
    return false;
  }
  if (!booking.startAt) {
    return false;
  }
  const start = Date.parse(booking.startAt);
  if (Number.isNaN(start)) {
    return false;
  }
  return nowMs >= start;
}
