// Time helpers for Asia/Ho_Chi_Minh display.
//
// Why a fixed +07:00 offset instead of Intl: Vietnam has had no DST since 1975, so UTC+7 is
// exact for every date we handle, and the arithmetic is identical on every device. Hermes'
// Intl.DateTimeFormat support for `timeZone` and the `vi` locale depends on the platform ICU
// build (Android vs iOS, release vs debug), and we could not verify it on device, so we avoid
// it entirely and use our own Vietnamese day names. API times are UTC ISO-8601 (CONVENTIONS).

export const VN_TZ = 'Asia/Ho_Chi_Minh';
export const VN_OFFSET_MINUTES = 7 * 60;
const VN_OFFSET_MS = VN_OFFSET_MINUTES * 60_000;

export type VnParts = {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  hour: number;
  minute: number;
  /** ISO day of week: 1 = Monday .. 7 = Sunday. */
  isoDayOfWeek: number;
};

/** Index 1..7 = Monday..Sunday. */
const DAY_NAMES = [
  '',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

function toMs(input: Date | string | number): number {
  const ms =
    input instanceof Date ? input.getTime() : new Date(input).getTime();
  if (Number.isNaN(ms)) {
    throw new RangeError(`Invalid date: ${String(input)}`);
  }
  return ms;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Wall-clock parts of an instant in Vietnam time. */
export function vnParts(input: Date | string | number): VnParts {
  const d = new Date(toMs(input) + VN_OFFSET_MS);
  const dow = d.getUTCDay(); // 0 = Sunday
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    isoDayOfWeek: dow === 0 ? 7 : dow,
  };
}

/** ISO day of week in Vietnam time: 1 = Monday .. 7 = Sunday. */
export function isoDayOfWeek(input: Date | string | number): number {
  return vnParts(input).isoDayOfWeek;
}

/** Vietnamese weekday name for an ISO day (1..7), e.g. 3 -> "Thứ Tư". */
export function dayName(isoDay: number): string {
  return DAY_NAMES[isoDay] ?? '';
}

/** "14:00" */
export function formatVnTime(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "18/11" */
export function formatVnDayMonth(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.day)}/${pad(p.month)}`;
}

/** "18/11/2026" */
export function formatVnDate(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

/** "Thứ Tư 18/11 · 14:00" */
export function formatVnDayTime(input: Date | string | number): string {
  const p = vnParts(input);
  return `${dayName(p.isoDayOfWeek)} ${pad(p.day)}/${pad(p.month)} · ${pad(
    p.hour,
  )}:${pad(p.minute)}`;
}

/** "14:00 - 14:30" */
export function formatVnTimeRange(
  start: Date | string | number,
  end: Date | string | number,
): string {
  return `${formatVnTime(start)} - ${formatVnTime(end)}`;
}

/**
 * Relative start label: "Bắt đầu sau 12 phút", "Bắt đầu sau 2 giờ 5 phút",
 * "Bắt đầu sau 3 ngày", "Sắp bắt đầu" (< 1 minute), "Đã bắt đầu" (in the past).
 */
export function formatStartsIn(
  start: Date | string | number,
  now: Date | string | number = Date.now(),
): string {
  const diffMin = Math.floor((toMs(start) - toMs(now)) / 60_000);
  if (diffMin < 0) {
    return 'Đã bắt đầu';
  }
  if (diffMin < 1) {
    return 'Sắp bắt đầu';
  }
  if (diffMin < 60) {
    return `Bắt đầu sau ${diffMin} phút`;
  }
  if (diffMin < 24 * 60) {
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m === 0 ? `Bắt đầu sau ${h} giờ` : `Bắt đầu sau ${h} giờ ${m} phút`;
  }
  return `Bắt đầu sau ${Math.floor(diffMin / (24 * 60))} ngày`;
}

/** Whole seconds until `target` (never negative); for offer countdowns. */
export function secondsUntil(
  target: Date | string | number,
  now: Date | string | number = Date.now(),
): number {
  return Math.max(0, Math.floor((toMs(target) - toMs(now)) / 1000));
}

/**
 * ISO 8601 week string "YYYY-Www" for the Vietnam-local calendar date of `input`
 * (the backend's `?week=` parameter). Week 1 contains the first Thursday; Monday starts the week.
 * 2026-12-31 -> "2026-W53", 2027-01-01 -> "2026-W53", 2027-01-04 -> "2027-W01".
 */
export function isoWeekString(input: Date | string | number): string {
  const p = vnParts(input);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  // Shift to the Thursday of this ISO week; its year is the ISO week-year.
  d.setUTCDate(d.getUTCDate() + 4 - p.isoDayOfWeek);
  const weekYear = d.getUTCFullYear();
  const jan1 = Date.UTC(weekYear, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / 86_400_000 + 1) / 7);
  return `${weekYear}-W${pad(week)}`;
}

/** Instant for a Vietnam wall-clock date/time (month 1..12). Useful for tests and range queries. */
export function vnDateToInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - VN_OFFSET_MS);
}
