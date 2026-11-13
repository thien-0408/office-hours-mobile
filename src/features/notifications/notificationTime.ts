import { formatVnDayMonth, vnParts } from '../../api/time';

const SHORT_DAYS = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Relative time label for notifications matching mockup 02-chung.html:
 * - < 1 min: "Vừa xong"
 * - < 60 min: "X ph" (e.g. "5 ph", "40 ph")
 * - Same day (< 24h): "X giờ"
 * - Within last 7 days: Short day of week "T2", "T3", ..., "CN"
 * - Older: "dd/MM" (e.g. "18/11")
 */
export function formatNotificationRelativeTime(
  dateInput: Date | string | number,
  nowInput: Date | string | number = Date.now(),
): string {
  const dateMs =
    dateInput instanceof Date
      ? dateInput.getTime()
      : typeof dateInput === 'number'
      ? dateInput
      : new Date(dateInput).getTime();

  const nowMs =
    nowInput instanceof Date
      ? nowInput.getTime()
      : typeof nowInput === 'number'
      ? nowInput
      : new Date(nowInput).getTime();

  if (Number.isNaN(dateMs) || Number.isNaN(nowMs)) {
    return '';
  }

  const diffMs = nowMs - dateMs;
  if (diffMs < 0) {
    return 'Vừa xong';
  }

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return 'Vừa xong';
  }
  if (diffMin < 60) {
    return `${diffMin} ph`;
  }

  const targetParts = vnParts(dateMs);
  const nowParts = vnParts(nowMs);

  const isSameDay =
    targetParts.year === nowParts.year &&
    targetParts.month === nowParts.month &&
    targetParts.day === nowParts.day;

  if (isSameDay) {
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} giờ`;
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60_000));
  if (diffDays < 7) {
    return SHORT_DAYS[targetParts.isoDayOfWeek] || formatVnDayMonth(dateMs);
  }

  return formatVnDayMonth(dateMs);
}
