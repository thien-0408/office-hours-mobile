// Pure booking-time helpers shared by the dashboard and the floating "next meeting" card.
// All calendar maths is Vietnam time (see time.ts). No React imports.
import type { Booking } from './domainTypes';
import { formatStartsIn, vnDateToInstant, vnParts } from './time';

const MIN = 60_000;
const DAY_MS = 24 * 60 * MIN;
const pad = (n: number) => String(n).padStart(2, '0');

/** The card appears this long before the meeting starts. */
export const NOW_CARD_LEAD_MIN = 60;
/** LiveMeeting opens within [start - 15, end + 15]; same window as BookingDetail's action. */
export const MEETING_JOIN_BEFORE_MIN = 15;
export const MEETING_JOIN_AFTER_MIN = 15;

export type VnRange = {
  /** Inclusive Vietnam dates "YYYY-MM-DD" (what GET /bookings `from` / `to` take). */
  from: string;
  to: string;
  /** Instants: [start, end). */
  start: Date;
  end: Date;
};

/** "2026-11-14" (Vietnam calendar date of an instant). */
export function vnDateString(input: Date | string | number): string {
  const p = vnParts(input);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Vietnam calendar day containing `now`. */
export function dayRangeVn(now: Date | number = Date.now()): VnRange {
  const p = vnParts(now);
  const start = vnDateToInstant(p.year, p.month, p.day);
  const date = vnDateString(now);
  return {
    from: date,
    to: date,
    start,
    end: new Date(start.getTime() + DAY_MS),
  };
}

/** Monday..Sunday (Vietnam time) containing `now`. */
export function weekRangeVn(now: Date | number = Date.now()): VnRange {
  const p = vnParts(now);
  const monday = vnDateToInstant(p.year, p.month, p.day - (p.isoDayOfWeek - 1));
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  return {
    from: vnDateString(monday),
    to: vnDateString(sunday),
    start: monday,
    end: new Date(monday.getTime() + 7 * DAY_MS),
  };
}

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

/** Sáng < 12:00, chiều 12:00-17:59, tối từ 18:00 (Vietnam time). */
export function dayPeriod(now: Date | number = Date.now()): DayPeriod {
  const { hour } = vnParts(now);
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

const PERIOD_WORD: Record<DayPeriod, string> = {
  morning: 'Sáng',
  afternoon: 'Chiều',
  evening: 'Tối',
};

/** "Chiều nay" ... for the lecturer title ("Chiều nay của bạn"). */
export function periodTitle(now: Date | number = Date.now()): string {
  return `${PERIOD_WORD[dayPeriod(now)]} nay`;
}

/** Given name of a Vietnamese full name ("Nguyễn Văn Bảo" -> "Bảo"). */
export function givenName(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

const startMs = (b: Pick<Booking, 'startAt'>) => Date.parse(b.startAt);
const endMs = (b: Pick<Booking, 'endAt'>) => Date.parse(b.endAt);

/** Soonest first. Does not mutate. */
export function sortByStart<T extends Pick<Booking, 'startAt'>>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => startMs(a) - startMs(b));
}

/** First CONFIRMED booking that has not ended yet (the dashboard "next meeting"). */
export function nextConfirmed(
  bookings: Booking[],
  now: number = Date.now(),
): Booking | null {
  const open = bookings.filter(b => b.status === 'CONFIRMED' && endMs(b) > now);
  return sortByStart(open)[0] ?? null;
}

/**
 * The floating card's booking: CONFIRMED and now within [start - 60 min, end]; the earliest
 * start wins when two overlap.
 */
export function nextMeetingInWindow(
  bookings: Booking[],
  now: number = Date.now(),
): Booking | null {
  const open = bookings.filter(
    b =>
      b.status === 'CONFIRMED' &&
      now >= startMs(b) - NOW_CARD_LEAD_MIN * MIN &&
      now <= endMs(b),
  );
  return sortByStart(open)[0] ?? null;
}

/** Within [start - 15 min, end + 15 min]: tapping the card opens LiveMeeting instead of detail. */
export function isWithinJoinWindow(
  booking: Pick<Booking, 'startAt' | 'endAt'>,
  now: number = Date.now(),
): boolean {
  return (
    now >= startMs(booking) - MEETING_JOIN_BEFORE_MIN * MIN &&
    now <= endMs(booking) + MEETING_JOIN_AFTER_MIN * MIN
  );
}

/** "Đang diễn ra" once started, else "Bắt đầu sau 12 phút" (formatStartsIn). */
export function meetingStatusLabel(
  booking: Pick<Booking, 'startAt' | 'endAt'>,
  now: number = Date.now(),
): string {
  return now >= startMs(booking)
    ? 'Đang diễn ra'
    : formatStartsIn(booking.startAt, now);
}

/** "Bắt đầu sau 12 phút · 306.B11". The booking DTO has no room, so callers pass one if known. */
export function nowCardSubtitle(
  booking: Pick<Booking, 'startAt' | 'endAt' | 'meetingUrl'>,
  room: string | null | undefined,
  now: number = Date.now(),
): string {
  const where = booking.meetingUrl ? 'Online' : room || null;
  const status = meetingStatusLabel(booking, now);
  return where ? `${status} · ${where}` : status;
}
