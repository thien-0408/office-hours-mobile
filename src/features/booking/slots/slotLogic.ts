// Pure logic for the slot picker, booking and reschedule screens (no React, easy to test).

import { ApiError, NetworkError } from '../../../api/errors';
import {
  ERR,
  conflictTypeOf,
  noticeHoursOf,
  waitlistAvailableOf,
} from '../../../api/errorCodes';
import type { BookableSlot, CampusRoom } from '../../../api/domainTypes';
import {
  dayName,
  formatVnDayMonth,
  formatVnDayTime,
  formatVnTime,
  isoWeekString,
  vnDateToInstant,
  vnParts,
} from '../../../api/time';

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Backend column `bookings.topic` is varchar(255); the DTO itself has no @Size. */
export const TOPIC_MAX_LENGTH = 255;

// ---- weeks ----

export type WeekDay = {
  /** Vietnam-local date "YYYY-MM-DD". */
  key: string;
  isoDay: number;
  day: number;
  month: number;
  /** Midnight (VN) of the day. */
  start: Date;
};

export type WeekInfo = {
  /** "YYYY-Www", the backend `?week=` value. */
  week: string;
  weekNumber: number;
  /** Monday..Sunday. */
  days: WeekDay[];
  /** "16–22/11" or "28/12–03/01" across a month boundary. */
  rangeLabel: string;
};

export function dayKey(input: Date | string | number): string {
  const p = vnParts(input);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Week containing `now`, shifted by `offset` whole weeks. */
export function weekInfo(now: Date | number, offset = 0): WeekInfo {
  const anchor = new Date(new Date(now).getTime() + offset * 7 * DAY_MS);
  const p = vnParts(anchor);
  const monday = vnDateToInstant(p.year, p.month, p.day - (p.isoDayOfWeek - 1));
  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(monday.getTime() + i * DAY_MS);
    const dp = vnParts(start);
    return {
      key: dayKey(start),
      isoDay: dp.isoDayOfWeek,
      day: dp.day,
      month: dp.month,
      start,
    };
  });
  const week = isoWeekString(monday);
  const first = days[0];
  const last = days[6];
  const rangeLabel =
    first.month === last.month
      ? `${pad(first.day)}–${pad(last.day)}/${pad(last.month)}`
      : `${formatVnDayMonth(first.start)}–${formatVnDayMonth(last.start)}`;
  return {
    week,
    weekNumber: Number(week.slice(-2)),
    days,
    rangeLabel,
  };
}

/** Whole ISO weeks from the week of `now` to the week of `target` (negative = past). */
export function weekOffsetBetween(
  now: Date | number,
  target: Date | string | number,
): number {
  const a = weekInfo(now, 0).days[0].start.getTime();
  const b = weekInfo(new Date(target).getTime(), 0).days[0].start.getTime();
  return Math.round((b - a) / (7 * DAY_MS));
}

/** "T2".."T7", "CN". */
export function shortDayLabel(isoDay: number): string {
  return isoDay === 7 ? 'CN' : `T${isoDay + 1}`;
}

// ---- slot state ----

export type SlotState = 'available' | 'full' | 'conflict' | 'current' | 'past';

export function slotState(
  slot: BookableSlot,
  opts: { now?: number; currentSlotId?: string } = {},
): SlotState {
  if (opts.currentSlotId && slot.id === opts.currentSlotId) {
    return 'current';
  }
  if (slot.conflict) {
    return 'conflict';
  }
  if (opts.now !== undefined && new Date(slot.endAt).getTime() <= opts.now) {
    return 'past';
  }
  return slot.available ? 'available' : 'full';
}

export function groupSlotsByDay(
  slots: readonly BookableSlot[],
): Record<string, BookableSlot[]> {
  const out: Record<string, BookableSlot[]> = {};
  for (const s of slots) {
    (out[dayKey(s.startAt)] ??= []).push(s);
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => a.startAt.localeCompare(b.startAt));
  }
  return out;
}

/**
 * Day to open first: the first day (today onwards when today is in the week) that has a
 * bookable slot, else the first with any slot, else today / Monday.
 */
export function defaultDayKey(
  week: WeekInfo,
  byDay: Record<string, BookableSlot[]>,
  now: number,
): string {
  const today = dayKey(now);
  const todayInWeek = week.days.some(d => d.key === today);
  const hasOpen = (k: string) =>
    (byDay[k] ?? []).some(s => s.available && !s.conflict);
  const candidates = week.days
    .map(d => d.key)
    .filter(k => !todayInWeek || k >= today);
  return (
    candidates.find(hasOpen) ??
    candidates.find(k => (byDay[k]?.length ?? 0) > 0) ??
    (todayInWeek ? today : week.days[0].key)
  );
}

// ---- text ----

/** "306.B11" from the campus room (code preferred, else its name). */
export function roomLabel(room: CampusRoom | null | undefined): string | null {
  if (!room) {
    return null;
  }
  const label = (room.code ?? '').trim() || room.name.trim();
  return label || null;
}

/** "Phòng 306.B11" or "Chưa có phòng làm việc". */
export function officeRoomText(room: CampusRoom | null | undefined): string {
  const label = roomLabel(room);
  return label ? `Phòng ${label}` : 'Chưa có phòng làm việc';
}

/** "Thứ Tư 18/11 · 14:00 · 306.B11" */
export function slotSummary(
  startAt: string,
  room: CampusRoom | null | undefined,
): string {
  const label = roomLabel(room);
  return label
    ? `${formatVnDayTime(startAt)} · ${label}`
    : formatVnDayTime(startAt);
}

/**
 * Meeting mode line for a slot: "Online (Google Meet, Zoom…)" when the slot has a
 * link, "Trực tiếp tại 306.B11" otherwise. `online` undefined = not known yet.
 */
export function meetingModeText(
  online: boolean | undefined,
  roomText: string | null,
): string {
  if (online === true) {
    return 'Online qua link họp (Meet, Zoom…)';
  }
  if (online === false) {
    return roomText ? `Trực tiếp tại ${roomText}` : 'Trực tiếp';
  }
  return roomText ? `Phòng ${roomText}` : ' ';
}

/** Short tag for slot chips / cards. */
export function meetingModeTag(online: boolean): string {
  return online ? 'Online' : 'Tại phòng';
}

/** "Thứ Sáu 14:20", for the reschedule button. */
export function dayTimeShort(startAt: string): string {
  return `${dayName(vnParts(startAt).isoDayOfWeek)} ${formatVnTime(startAt)}`;
}

/** Big date block: "19" + "Thứ Năm, tháng 11" + "09:40 – 10:00". */
export function dateBlock(startAt: string, endAt: string) {
  const p = vnParts(startAt);
  return {
    day: String(p.day),
    caption: `${dayName(p.isoDayOfWeek)}, tháng ${p.month}`,
    range: `${formatVnTime(startAt)} – ${formatVnTime(endAt)}`,
  };
}

// ---- topic ----

export function validateTopic(raw: string): string | null {
  const t = raw.trim();
  if (t.length === 0) {
    return 'Hãy cho giảng viên biết bạn muốn trao đổi gì.';
  }
  if (t.length > TOPIC_MAX_LENGTH) {
    return `Tối đa ${TOPIC_MAX_LENGTH} ký tự.`;
  }
  return null;
}

// ---- error -> UI state ----

export type ActionErrorUi = {
  kind:
    | 'slotTaken'
    | 'alreadyRequested'
    | 'studentConflict'
    | 'noticePassed'
    | 'slotInvalid'
    | 'notAllowed'
    | 'semester'
    | 'notFound'
    | 'network'
    | 'generic';
  title: string;
  message: string;
  /** slotTaken: backend says the waitlist is open for this slot. */
  waitlistAvailable?: boolean;
  /** alreadyRequested: id of the existing booking when the backend sends it. */
  bookingId?: string;
};

export const ERROR_COPY = {
  network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  generic: 'Có lỗi xảy ra. Thử lại sau.',
} as const;

function str(details: unknown, key: string): string | undefined {
  if (typeof details === 'object' && details !== null) {
    const v = (details as Record<string, unknown>)[key];
    return typeof v === 'string' && v ? v : undefined;
  }
  return undefined;
}

/** The backend does not send it today; accept the likely names for the existing booking id. */
export function existingBookingIdOf(details: unknown): string | undefined {
  return str(details, 'bookingId') ?? str(details, 'existingBookingId');
}

function fallbackUi(e: unknown): ActionErrorUi {
  if (e instanceof NetworkError) {
    return {
      kind: 'network',
      title: 'Mất kết nối',
      message: ERROR_COPY.network,
    };
  }
  return {
    kind: 'generic',
    title: 'Có lỗi xảy ra',
    message: ERROR_COPY.generic,
  };
}

function conflictMessage(details: unknown): string {
  return conflictTypeOf(details) === 'SCHEDULE'
    ? 'Giờ này trùng với lịch học hoặc lịch bận của bạn. Hãy chọn giờ khác.'
    : 'Giờ này trùng với một lịch hẹn khác của bạn. Hãy chọn giờ khác.';
}

/** POST /bookings failure -> what the booking sheet should show. */
export function bookingErrorUi(e: unknown): ActionErrorUi {
  if (!(e instanceof ApiError)) {
    return fallbackUi(e);
  }
  if (
    e.is(409, ERR.BOOKING_SLOT_UNAVAILABLE) ||
    e.is(409, ERR.BOOKING_SLOT_TAKEN)
  ) {
    return {
      kind: 'slotTaken',
      title: 'Có người vừa đặt slot này.',
      message:
        'Vào hàng đợi để được mời ngay khi slot trống, hoặc chọn giờ khác.',
      waitlistAvailable: waitlistAvailableOf(e.details),
    };
  }
  if (e.is(409, ERR.BOOKING_ALREADY_REQUESTED)) {
    return {
      kind: 'alreadyRequested',
      title: 'Bạn đã đặt slot này',
      message: 'Bạn đã có một yêu cầu đang xử lý cho slot này.',
      bookingId: existingBookingIdOf(e.details),
    };
  }
  if (e.is(422, ERR.BOOKING_STUDENT_CONFLICT)) {
    return {
      kind: 'studentConflict',
      title: 'Trùng lịch',
      message: conflictMessage(e.details),
    };
  }
  if (e.is(409, ERR.BOOKING_SEMESTER_UNAVAILABLE)) {
    return {
      kind: 'semester',
      title: 'Chưa mở đặt lịch',
      message: 'Ngày này chưa thuộc học kỳ nào nên chưa đặt được.',
    };
  }
  if (e.status === 404) {
    return {
      kind: 'notFound',
      title: 'Slot không còn',
      message: 'Slot này không còn tồn tại. Hãy chọn giờ khác.',
    };
  }
  return fallbackUi(e);
}

/** POST /bookings/{id}/reschedule failure. */
export function rescheduleErrorUi(e: unknown): ActionErrorUi {
  if (!(e instanceof ApiError)) {
    return fallbackUi(e);
  }
  if (e.is(409, ERR.CANCELLATION_NOTICE_PASSED)) {
    const h = noticeHoursOf(e.details) ?? 24;
    return {
      kind: 'noticePassed',
      title: 'Đã quá hạn đổi giờ',
      message: `Chỉ đổi giờ được trước giờ hẹn ${h} giờ. Hãy nhắn giảng viên qua chat.`,
    };
  }
  if (e.is(422, ERR.BOOKING_RESCHEDULE_SLOT_INVALID)) {
    return {
      kind: 'slotInvalid',
      title: 'Không đổi được sang giờ này',
      message:
        'Giờ mới phải thuộc cùng giảng viên và còn trống. Hãy chọn giờ khác.',
    };
  }
  if (e.is(409, ERR.BOOKING_TRANSITION_NOT_ALLOWED)) {
    return {
      kind: 'notAllowed',
      title: 'Không đổi giờ được',
      message: 'Lịch hẹn này không còn ở trạng thái cho phép đổi giờ.',
    };
  }
  if (
    e.is(409, ERR.BOOKING_SLOT_UNAVAILABLE) ||
    e.is(409, ERR.BOOKING_SLOT_TAKEN)
  ) {
    return {
      kind: 'slotTaken',
      title: 'Giờ này vừa có người đặt',
      message: 'Hãy chọn giờ khác.',
      waitlistAvailable: waitlistAvailableOf(e.details),
    };
  }
  if (e.is(409, ERR.BOOKING_ALREADY_REQUESTED)) {
    return {
      kind: 'alreadyRequested',
      title: 'Bạn đã đặt giờ này',
      message: 'Bạn đã có yêu cầu cho giờ này rồi.',
      bookingId: existingBookingIdOf(e.details),
    };
  }
  if (e.is(422, ERR.BOOKING_STUDENT_CONFLICT)) {
    return {
      kind: 'studentConflict',
      title: 'Trùng lịch',
      message: conflictMessage(e.details),
    };
  }
  if (e.status === 404) {
    return {
      kind: 'notFound',
      title: 'Không tìm thấy',
      message: 'Lịch hẹn hoặc slot không còn tồn tại.',
    };
  }
  return fallbackUi(e);
}

export type WaitlistJoinOutcome =
  | { kind: 'alreadyJoined' }
  | { kind: 'notNeeded'; message: string }
  | { kind: 'error'; message: string };

/** POST /slots/{id}/waitlist failure. ALREADY_JOINED counts as success for the UI. */
export function waitlistJoinErrorOutcome(e: unknown): WaitlistJoinOutcome {
  if (e instanceof ApiError) {
    if (e.is(409, ERR.WAITLIST_ALREADY_JOINED)) {
      return { kind: 'alreadyJoined' };
    }
    if (e.is(409, ERR.WAITLIST_NOT_NEEDED)) {
      return {
        kind: 'notNeeded',
        message: 'Slot này đã trống lại. Bạn có thể đặt lịch ngay.',
      };
    }
    if (e.is(409, ERR.WAITLIST_ALREADY_FULFILLED)) {
      return { kind: 'error', message: 'Bạn đã có lịch hẹn cho slot này.' };
    }
    if (e.is(422, ERR.BOOKING_STUDENT_CONFLICT)) {
      return { kind: 'error', message: conflictMessage(e.details) };
    }
  }
  return {
    kind: 'error',
    message:
      e instanceof NetworkError ? ERROR_COPY.network : ERROR_COPY.generic,
  };
}
