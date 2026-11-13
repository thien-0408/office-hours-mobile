import {
  formatCountdownMmSs,
  getCountdownState,
  isWaitlistOfferExpired,
  waitlistStatusLabel,
} from '../src/features/waitlist/countdown';

describe('formatCountdownMmSs', () => {
  it('formats whole seconds to mm:ss', () => {
    expect(formatCountdownMmSs(0)).toBe('00:00');
    expect(formatCountdownMmSs(5)).toBe('00:05');
    expect(formatCountdownMmSs(65)).toBe('01:05');
    expect(formatCountdownMmSs(581)).toBe('09:41');
    expect(formatCountdownMmSs(3600)).toBe('60:00');
  });

  it('clamps negative or invalid values to 00:00', () => {
    expect(formatCountdownMmSs(-10)).toBe('00:00');
    expect(formatCountdownMmSs(NaN)).toBe('00:00');
    expect(formatCountdownMmSs(Infinity)).toBe('00:00');
  });
});

describe('isWaitlistOfferExpired', () => {
  const baseNow = new Date('2026-11-19T09:30:00Z').getTime();

  it('returns true when expiresAt is null or undefined', () => {
    expect(isWaitlistOfferExpired(null, baseNow)).toBe(true);
    expect(isWaitlistOfferExpired(undefined, baseNow)).toBe(true);
  });

  it('returns true when time is past or equal', () => {
    expect(isWaitlistOfferExpired(baseNow - 1000, baseNow)).toBe(true);
    expect(isWaitlistOfferExpired(baseNow, baseNow)).toBe(true);
  });

  it('returns false when time is in the future', () => {
    expect(isWaitlistOfferExpired(baseNow + 5000, baseNow)).toBe(false);
  });

  it('handles invalid date string as expired', () => {
    expect(isWaitlistOfferExpired('invalid-date', baseNow)).toBe(true);
  });
});

describe('getCountdownState', () => {
  const baseNow = 1_000_000;

  it('returns expired state for past or missing expiration', () => {
    expect(getCountdownState(null, baseNow)).toEqual({
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    });
    expect(getCountdownState(baseNow - 10_000, baseNow)).toEqual({
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    });
    expect(getCountdownState(baseNow, baseNow)).toEqual({
      secondsRemaining: 0,
      isExpired: true,
      formatted: '00:00',
    });
  });

  it('calculates remaining seconds and formatted string for future target', () => {
    const future = baseNow + 125 * 1000; // 125 seconds = 02:05
    const state = getCountdownState(future, baseNow);
    expect(state.secondsRemaining).toBe(125);
    expect(state.isExpired).toBe(false);
    expect(state.formatted).toBe('02:05');
  });

  it('handles ISO strings and Date objects', () => {
    const now = new Date('2026-11-19T10:00:00.000Z');
    const futureIso = '2026-11-19T10:05:30.000Z'; // 330 seconds = 05:30
    const state = getCountdownState(futureIso, now);
    expect(state.secondsRemaining).toBe(330);
    expect(state.isExpired).toBe(false);
    expect(state.formatted).toBe('05:30');
  });
});

describe('waitlistStatusLabel', () => {
  it('maps waitlist statuses to Vietnamese labels', () => {
    expect(waitlistStatusLabel('OFFERED')).toBe('Có slot');
    expect(waitlistStatusLabel('WAITING')).toBe('Đang chờ');
    expect(waitlistStatusLabel('FULFILLED')).toBe('Đã nhận');
    expect(waitlistStatusLabel('EXPIRED')).toBe('Hết hạn');
    expect(waitlistStatusLabel('CANCELLED')).toBe('Đã hủy');
  });

  it('falls back to raw status if unknown', () => {
    expect(waitlistStatusLabel('CUSTOM_STATUS')).toBe('CUSTOM_STATUS');
  });
});
