import { ApiError, NetworkError } from '../../api/errors';
import { ERR } from '../../api/errorCodes';
import { ERROR_TEXT, fieldErrorMap } from '../../api/errorText';
import type { ScheduleBlock } from '../../api/domainTypes';
import { vnParts } from '../../api/time';

export type WeekDayItem = {
  dayOfWeek: number; // 1 = Monday .. 7 = Sunday
  shortLabel: string; // T2..CN
  fullLabel: string; // Thứ Hai..Chủ Nhật
  dateNumber: number; // 1..31
  dateStr: string; // "18/11"
  isToday: boolean;
};

const SHORT_DAY_NAMES = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FULL_DAY_NAMES = [
  '',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

/** Return day name from ISO day (1..7). */
export function dayOfWeekToName(dayOfWeek: number, short = false): string {
  const arr = short ? SHORT_DAY_NAMES : FULL_DAY_NAMES;
  return arr[dayOfWeek] ?? '';
}

/** Parse "HH:mm" to minutes since midnight (0..1439). Returns NaN if invalid. */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return NaN;
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) {
    return NaN;
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return NaN;
  }
  return hours * 60 + minutes;
}

/** Format minutes since midnight to "HH:mm". */
export function formatMinutesToTime(totalMinutes: number): string {
  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return '00:00';
  }
  const normalized = Math.min(1439, Math.max(0, Math.floor(totalMinutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Validate whether time is in valid "HH:mm" format. */
export function isTimeValid(timeStr: string): boolean {
  return !Number.isNaN(parseTimeToMinutes(timeStr));
}

/** Check if start and end are valid "HH:mm" and start < end. */
export function isTimeRangeValid(startTime: string, endTime: string): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
}

/** Check if two time intervals overlap (strictly before/after). */
export function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);
  if (Number.isNaN(sA) || Number.isNaN(eA) || Number.isNaN(sB) || Number.isNaN(eB)) {
    return false;
  }
  return sA < eB && sB < eA;
}

/** Sort schedule blocks by dayOfWeek (1..7), then startTime, then endTime. */
export function sortScheduleBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    const aStart = parseTimeToMinutes(a.startTime);
    const bStart = parseTimeToMinutes(b.startTime);
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    const aEnd = parseTimeToMinutes(a.endTime);
    const bEnd = parseTimeToMinutes(b.endTime);
    return aEnd - bEnd;
  });
}

/** Filter schedule blocks by day of week (1..7), sorted by time. */
export function filterBlocksByDay(
  blocks: ScheduleBlock[],
  dayOfWeek: number,
): ScheduleBlock[] {
  return sortScheduleBlocks(blocks.filter(b => b.dayOfWeek === dayOfWeek));
}

/**
 * Returns the 7 days of the week (Monday through Sunday) for the given instant,
 * calculated in Asia/Ho_Chi_Minh (+07:00).
 */
export function getWeekDays(
  referenceDate: Date | string | number = Date.now(),
): WeekDayItem[] {
  const refParts = vnParts(referenceDate);
  const refMs =
    referenceDate instanceof Date
      ? referenceDate.getTime()
      : typeof referenceDate === 'number'
      ? referenceDate
      : new Date(referenceDate).getTime();

  // Find Monday's date offset in days from referenceDate
  const currentIsoDay = refParts.isoDayOfWeek; // 1 = Monday .. 7 = Sunday
  const daysFromMonday = currentIsoDay - 1;

  const result: WeekDayItem[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < 7; i++) {
    const offsetDays = i - daysFromMonday;
    const targetMs = refMs + offsetDays * oneDayMs;
    const p = vnParts(targetMs);
    const isToday =
      p.year === refParts.year &&
      p.month === refParts.month &&
      p.day === refParts.day;

    result.push({
      dayOfWeek: i + 1,
      shortLabel: SHORT_DAY_NAMES[i + 1],
      fullLabel: FULL_DAY_NAMES[i + 1],
      dateNumber: p.day,
      dateStr: `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}`,
      isToday,
    });
  }

  return result;
}

/** Format source name into user-friendly Vietnamese text. */
export function formatScheduleSource(source?: string | null): string {
  if (!source) {
    return 'Lịch bận';
  }
  const s = source.toUpperCase();
  if (s === 'MANUAL') {
    return 'Nhập tay';
  }
  if (s === 'IMPORTED') {
    return 'Đã quét';
  }
  return source;
}

/** Validate input for adding a schedule entry. */
export function validateScheduleEntryInput(input: {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'Vui lòng nhập tiêu đề môn học hoặc lịch bận.';
  } else if (input.title.trim().length > 200) {
    errors.title = 'Tiêu đề không được vượt quá 200 ký tự.';
  }

  if (input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    errors.dayOfWeek = 'Thứ trong tuần không hợp lệ.';
  }

  if (!isTimeValid(input.startTime)) {
    errors.startTime = 'Giờ bắt đầu chưa đúng định dạng (HH:mm).';
  }

  if (!isTimeValid(input.endTime)) {
    errors.endTime = 'Giờ kết thúc chưa đúng định dạng (HH:mm).';
  } else if (
    isTimeValid(input.startTime) &&
    !isTimeRangeValid(input.startTime, input.endTime)
  ) {
    errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
  }

  if (input.room && input.room.length > 100) {
    errors.room = 'Tên phòng không được vượt quá 100 ký tự.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/** Translate API error to Vietnamese user-friendly message. */
export function scheduleErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.is(409, ERR.SCHEDULE_ENTRY_DUPLICATE)) {
      return 'Lịch bận này đã tồn tại trong học kỳ.';
    }
    if (error.is(422, ERR.SCHEDULE_ENTRY_INVALID)) {
      return 'Khung giờ không hợp lệ: giờ kết thúc phải sau giờ bắt đầu.';
    }
    if (error.is(404, ERR.SCHEDULE_ENTRY_NOT_FOUND)) {
      return 'Không tìm thấy mục lịch bận hoặc mục này đã bị xóa.';
    }
    if (error.is(413, ERR.SCHEDULE_BATCH_TOO_LARGE)) {
      return 'Dữ liệu quá lớn (tối đa 2.000 dòng).';
    }
    if (error.is(422, ERR.SCHEDULE_TARGET_INVALID)) {
      return 'Tài khoản không hợp lệ để thao tác lịch.';
    }
    if (error.status === 400) {
      const fieldErrors = fieldErrorMap(error);
      const firstField = Object.values(fieldErrors)[0];
      if (firstField) {
        return firstField;
      }
      return 'Thông tin lịch bận chưa hợp lệ.';
    }
  }

  if (error instanceof NetworkError) {
    return ERROR_TEXT.network;
  }

  return ERROR_TEXT.generic;
}
