import { ApiError, NetworkError } from '../../api/errors';
import { ERR } from '../../api/errorCodes';
import { ERROR_TEXT, fieldErrorMap } from '../../api/errorText';
import type {
  AvailabilityException,
  AvailabilityRule,
} from '../../api/domainTypes';

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

export function dayOfWeekName(dayOfWeek: number, short = false): string {
  const arr = short ? SHORT_DAY_NAMES : FULL_DAY_NAMES;
  return arr[dayOfWeek] ?? '';
}

/** Parse "HH:mm" to minutes since midnight (0..1439). */
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

/** Calculate the number of slots in a time window given slot length in minutes. */
export function calculateSlotsCount(
  startTime: string,
  endTime: string,
  slotLengthMinutes: number,
): number {
  if (!slotLengthMinutes || slotLengthMinutes <= 0) {
    return 0;
  }
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }
  const duration = end - start;
  return Math.floor(duration / slotLengthMinutes);
}

/** Check if duration between startTime and endTime is evenly divisible by slotLengthMinutes. */
export function isDurationDivisible(
  startTime: string,
  endTime: string,
  slotLengthMinutes: number,
): boolean {
  if (!slotLengthMinutes || slotLengthMinutes <= 0) {
    return false;
  }
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return false;
  }
  return (end - start) % slotLengthMinutes === 0;
}

/** Calculate total slots across multiple days. */
export function calculateTotalSlots(
  daysCount: number,
  startTime: string,
  endTime: string,
  slotLengthMinutes: number,
): number {
  if (daysCount <= 0) {
    return 0;
  }
  return daysCount * calculateSlotsCount(startTime, endTime, slotLengthMinutes);
}

export type DayRulesGroup = {
  dayOfWeek: number;
  dayLabel: string;
  rules: AvailabilityRule[];
};

/** Group availability rules by day of week (1..7), sorted by day then start time. */
export function groupRulesByDay(rules: AvailabilityRule[]): DayRulesGroup[] {
  const map = new Map<number, AvailabilityRule[]>();

  for (const rule of rules) {
    const list = map.get(rule.dayOfWeek) ?? [];
    list.push(rule);
    map.set(rule.dayOfWeek, list);
  }

  // Sort groups by day of week 1..7
  const sortedDays = Array.from(map.keys()).sort((a, b) => a - b);

  return sortedDays.map(dayOfWeek => {
    const dayRules = (map.get(dayOfWeek) ?? []).sort((a, b) => {
      const aStart = parseTimeToMinutes(a.startTime);
      const bStart = parseTimeToMinutes(b.startTime);
      if (aStart !== bStart) {
        return aStart - bStart;
      }
      return parseTimeToMinutes(a.endTime) - parseTimeToMinutes(b.endTime);
    });

    return {
      dayOfWeek,
      dayLabel: dayOfWeekName(dayOfWeek),
      rules: dayRules,
    };
  });
}

/** Format display label for an availability rule. */
export function formatRuleLabel(rule: AvailabilityRule): {
  timeRange: string;
  subtitle: string;
  slotCount: number;
  isOnline: boolean;
} {
  const timeRange = `${rule.startTime} – ${rule.endTime}`;
  const isOnline = Boolean(rule.meetingUrl && rule.meetingUrl.trim().length > 0);
  const subtitle = `Slot ${rule.slotLengthMinutes} phút · ${
    isOnline ? 'Online' : 'Trực tiếp'
  }`;
  const slotCount = calculateSlotsCount(
    rule.startTime,
    rule.endTime,
    rule.slotLengthMinutes,
  );

  return {
    timeRange,
    subtitle,
    slotCount,
    isOnline,
  };
}

/** Format display label for an exception. */
export function formatExceptionSummary(ex: AvailabilityException): {
  title: string;
  subtitle: string;
  isBlock: boolean;
} {
  const isBlock = ex.type === 'BLOCK';
  // Parse YYYY-MM-DD
  const parts = ex.date.split('-');
  const dateStr =
    parts.length === 3 ? `${parts[2]}/${parts[1]}` : ex.date;

  const prefix = isBlock ? 'Nghỉ' : 'Thêm';
  const timePart =
    ex.startTime && ex.endTime ? `, ${ex.startTime} – ${ex.endTime}` : '';
  const title = `${prefix} · ${dateStr}${timePart}`;

  let subtitle = ex.reason ?? '';
  if (!subtitle && ex.meetingUrl) {
    subtitle = 'Online';
  } else if (!subtitle && isBlock) {
    subtitle = 'Nghỉ cả ngày';
  }

  return {
    title,
    subtitle,
    isBlock,
  };
}

/** Validate input for creating rules (23b). */
export function validateRuleInput(input: {
  days: number[];
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  isOnline?: boolean;
  meetingUrl?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.days || input.days.length === 0) {
    errors.days = 'Vui lòng chọn ít nhất một thứ trong tuần.';
  }

  const startMin = parseTimeToMinutes(input.startTime);
  const endMin = parseTimeToMinutes(input.endTime);

  if (Number.isNaN(startMin)) {
    errors.startTime = 'Giờ bắt đầu chưa đúng định dạng (HH:mm).';
  }

  if (Number.isNaN(endMin)) {
    errors.endTime = 'Giờ kết thúc chưa đúng định dạng (HH:mm).';
  } else if (!Number.isNaN(startMin) && endMin <= startMin) {
    errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
  } else if (!Number.isNaN(startMin)) {
    const duration = endMin - startMin;
    if (input.slotLengthMinutes > 0 && duration < input.slotLengthMinutes) {
      errors.slotLengthMinutes = `Khung giờ (${duration} phút) phải lớn hơn hoặc bằng độ dài slot (${input.slotLengthMinutes} phút).`;
    }
  }

  if (!input.slotLengthMinutes || input.slotLengthMinutes <= 0) {
    errors.slotLengthMinutes = 'Vui lòng chọn độ dài slot.';
  }

  if (input.isOnline) {
    const url = input.meetingUrl?.trim() ?? '';
    if (!url) {
      errors.meetingUrl = 'Vui lòng nhập link phòng họp online.';
    } else if (!url.startsWith('https://')) {
      errors.meetingUrl = 'Link họp phải bắt đầu bằng https://.';
    } else if (url.length > 500) {
      errors.meetingUrl = 'Link họp không được vượt quá 500 ký tự.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/** Validate input for creating an exception. */
export function validateExceptionInput(input: {
  date: string;
  type: 'BLOCK' | 'ADD';
  startTime?: string;
  endTime?: string;
  reason?: string;
  meetingUrl?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = 'Ngày chưa đúng định dạng (YYYY-MM-DD).';
  }

  if (!input.type || (input.type !== 'BLOCK' && input.type !== 'ADD')) {
    errors.type = 'Loại ngoại lệ không hợp lệ.';
  }

  if (input.startTime || input.endTime || input.type === 'ADD') {
    const startMin = parseTimeToMinutes(input.startTime ?? '');
    const endMin = parseTimeToMinutes(input.endTime ?? '');

    if (Number.isNaN(startMin)) {
      errors.startTime = 'Giờ bắt đầu chưa hợp lệ (HH:mm).';
    }
    if (Number.isNaN(endMin)) {
      errors.endTime = 'Giờ kết thúc chưa hợp lệ (HH:mm).';
    } else if (!Number.isNaN(startMin) && endMin <= startMin) {
      errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
    }
  }

  if (input.reason && input.reason.length > 255) {
    errors.reason = 'Lý do không được vượt quá 255 ký tự.';
  }

  if (input.type === 'ADD' && input.meetingUrl) {
    const url = input.meetingUrl.trim();
    if (!url.startsWith('https://')) {
      errors.meetingUrl = 'Link họp phải bắt đầu bằng https://.';
    } else if (url.length > 500) {
      errors.meetingUrl = 'Link họp không được vượt quá 500 ký tự.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/** Translate API error for availability. */
export function availabilityErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.is(409, ERR.AVAILABILITY_RULE_OVERLAP)) {
      return 'Khung giờ bị trùng lặp với lịch rảnh khác đã có.';
    }
    if (error.is(409, ERR.AVAILABILITY_ADD_CONFLICT)) {
      return 'Ngoại lệ thêm giờ bị trùng hoặc không tạo được slot.';
    }
    if (error.is(404, ERR.AVAILABILITY_RULE_NOT_FOUND)) {
      return 'Không tìm thấy khung giờ hoặc khung giờ đã bị xóa.';
    }
    if (error.is(404, ERR.AVAILABILITY_EXCEPTION_NOT_FOUND)) {
      return 'Không tìm thấy ngoại lệ hoặc ngoại lệ đã bị xóa.';
    }
    if (error.is(404, ERR.ACTIVE_SEMESTER_NOT_FOUND)) {
      return 'Không tìm thấy học kỳ đang hoạt động.';
    }
    if (error.status === 400) {
      const fieldErrors = fieldErrorMap(error);
      const firstField = Object.values(fieldErrors)[0];
      if (firstField) {
        return firstField;
      }
      return 'Thông tin lịch rảnh chưa hợp lệ.';
    }
  }

  if (error instanceof NetworkError) {
    return ERROR_TEXT.network;
  }

  return ERROR_TEXT.generic;
}
