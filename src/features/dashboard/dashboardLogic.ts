// Pure dashboard logic (no React): stats derivation, today's rows, labels, badge text.
import type {
  Booking,
  MyWaitlistEntry,
  SuggestedSlot,
} from '../../api/domainTypes';
import { dayName, formatVnTime, isoDayOfWeek } from '../../api/time';
import { sortByStart } from '../../api/bookingTime';

export type StudentStats = {
  /** Confirmed or completed bookings this week. */
  bookings: number;
  /** PENDING bookings this week. */
  pending: number;
  /** Waitlist entries still alive (WAITING or OFFERED). */
  waitlist: number;
};

/** `week` = the student's bookings of the Monday..Sunday range (all statuses). */
export function studentStats(
  week: Booking[],
  waitlist: MyWaitlistEntry[],
): StudentStats {
  return {
    bookings: week.filter(
      b => b.status === 'CONFIRMED' || b.status === 'COMPLETED',
    ).length,
    pending: week.filter(b => b.status === 'PENDING').length,
    waitlist: waitlist.filter(w => w.status === 'WAITING' || w.status === 'OFFERED')
      .length,
  };
}

export type LecturerTodayStats = {
  /** Sessions that are (or were) really happening today: confirmed, completed, no-show. */
  sessions: number;
  completed: number;
};

const HELD = new Set(['CONFIRMED', 'COMPLETED', 'NO_SHOW']);

/** `today` = the lecturer's bookings of today (all statuses). */
export function lecturerTodayStats(today: Booking[]): LecturerTodayStats {
  return {
    sessions: today.filter(b => HELD.has(b.status)).length,
    completed: today.filter(b => b.status === 'COMPLETED').length,
  };
}

/** Today's rows, earliest first. Pending/declined/cancelled live in other screens. */
export function todayRows(today: Booking[]): Booking[] {
  return sortByStart(today.filter(b => HELD.has(b.status)));
}

/** Pill of a today row: finished ones say so, upcoming ones show their start time. */
export function todayRowPill(b: Booking): { status: string; label: string } {
  switch (b.status) {
    case 'COMPLETED':
      return { status: 'COMPLETED', label: 'Xong' };
    case 'NO_SHOW':
      return { status: 'NO_SHOW', label: 'Vắng mặt' };
    default:
      return { status: b.status, label: formatVnTime(b.startAt) };
  }
}

/** "13:00 · Hỏi về điểm giữa kỳ" (topic is optional). */
export function todayRowSubtitle(b: Pick<Booking, 'startAt' | 'topic'>): string {
  const topic = b.topic?.trim();
  return topic ? `${formatVnTime(b.startAt)} · ${topic}` : formatVnTime(b.startAt);
}

/** "Thứ Năm · 09:30" under a suggestion card. */
export function suggestionWhen(
  slot: Pick<SuggestedSlot, 'startAt'> & { online?: boolean },
): string {
  const when = `${dayName(isoDayOfWeek(slot.startAt))} · ${formatVnTime(slot.startAt)}`;
  return slot.online ? `${when} · Online` : when;
}

/** Tab badge text: nothing for 0, "99+" above 99. */
export function badgeText(count: number | undefined): string | undefined {
  if (!count || count <= 0) {
    return undefined;
  }
  return count > 99 ? '99+' : String(count);
}

/** "Chào Bảo, tuần này bạn có" (falls back to no name). */
export function studentGreeting(given: string): string {
  return given ? `Chào ${given}, tuần này bạn có` : 'Tuần này bạn có';
}

export type Presence = 'AVAILABLE' | 'BUSY' | 'AWAY';

export const PRESENCE_OPTIONS: { value: Presence; label: string }[] = [
  { value: 'AVAILABLE', label: 'Có mặt' },
  { value: 'BUSY', label: 'Đang bận' },
  { value: 'AWAY', label: 'Vắng' },
];
