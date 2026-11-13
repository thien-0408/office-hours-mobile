import type { WaitlistStatus } from '../../api/domainTypes';

export type CountdownState = {
  secondsRemaining: number;
  isExpired: boolean;
  formatted: string; // "mm:ss"
};

/**
 * Format total seconds into "mm:ss".
 * Clamps negative values to "00:00".
 */
export function formatCountdownMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Check if a waitlist offer target expiration instant has passed.
 */
export function isWaitlistOfferExpired(
  expiresAt: Date | string | number | null | undefined,
  now: Date | string | number = Date.now(),
): boolean {
  if (!expiresAt) {
    return true;
  }
  const targetMs =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === 'number'
      ? expiresAt
      : new Date(expiresAt).getTime();

  const nowMs =
    now instanceof Date
      ? now.getTime()
      : typeof now === 'number'
      ? now
      : new Date(now).getTime();

  if (Number.isNaN(targetMs) || Number.isNaN(nowMs)) {
    return true;
  }

  return targetMs <= nowMs;
}

/**
 * Compute countdown state from expiration instant and reference now.
 */
export function getCountdownState(
  expiresAt: Date | string | number | null | undefined,
  now: Date | string | number = Date.now(),
): CountdownState {
  if (!expiresAt) {
    return {
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    };
  }

  const targetMs =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === 'number'
      ? expiresAt
      : new Date(expiresAt).getTime();

  const nowMs =
    now instanceof Date
      ? now.getTime()
      : typeof now === 'number'
      ? now
      : new Date(now).getTime();

  if (Number.isNaN(targetMs) || Number.isNaN(nowMs)) {
    return {
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    };
  }

  const diffSec = Math.floor((targetMs - nowMs) / 1000);
  if (diffSec <= 0) {
    return {
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    };
  }

  return {
    secondsRemaining: diffSec,
    isExpired: false,
    formatted: formatCountdownMmSs(diffSec),
  };
}

/**
 * Human-readable Vietnamese label for each waitlist status.
 */
export function waitlistStatusLabel(status: WaitlistStatus | string): string {
  switch (status) {
    case 'OFFERED':
      return 'Có slot';
    case 'WAITING':
      return 'Đang chờ';
    case 'FULFILLED':
      return 'Đã nhận';
    case 'EXPIRED':
      return 'Hết hạn';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status;
  }
}
