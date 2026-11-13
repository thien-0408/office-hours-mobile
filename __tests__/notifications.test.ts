import { formatNotificationRelativeTime } from '../src/features/notifications/notificationTime';
import { resolveTarget } from '../src/navigation/roleConfig';

describe('formatNotificationRelativeTime', () => {
  const baseNow = new Date('2026-11-18T14:00:00+07:00').getTime();

  it('formats < 1 minute as "Vừa xong"', () => {
    const time = baseNow - 30 * 1000;
    expect(formatNotificationRelativeTime(time, baseNow)).toBe('Vừa xong');
  });

  it('formats future date as "Vừa xong"', () => {
    const time = baseNow + 10 * 1000;
    expect(formatNotificationRelativeTime(time, baseNow)).toBe('Vừa xong');
  });

  it('formats minutes as "X ph" under 60 minutes', () => {
    expect(formatNotificationRelativeTime(baseNow - 5 * 60_000, baseNow)).toBe('5 ph');
    expect(formatNotificationRelativeTime(baseNow - 40 * 60_000, baseNow)).toBe('40 ph');
  });

  it('formats same-day earlier hours as "X giờ"', () => {
    expect(formatNotificationRelativeTime(baseNow - 2 * 60 * 60_000, baseNow)).toBe('2 giờ');
  });

  it('formats within last 7 days as short day of week', () => {
    // 2026-11-18 is Wednesday (Thứ Tư).
    // 2 days earlier is Monday (Thứ Hai) 2026-11-16
    const monday = new Date('2026-11-16T10:00:00+07:00').getTime();
    expect(formatNotificationRelativeTime(monday, baseNow)).toBe('T2');

    // 3 days earlier is Sunday 2026-11-15
    const sunday = new Date('2026-11-15T10:00:00+07:00').getTime();
    expect(formatNotificationRelativeTime(sunday, baseNow)).toBe('CN');
  });

  it('formats older than 7 days as dd/MM', () => {
    const older = new Date('2026-11-01T10:00:00+07:00').getTime();
    expect(formatNotificationRelativeTime(older, baseNow)).toBe('01/11');
  });

  it('handles invalid input gracefully', () => {
    expect(formatNotificationRelativeTime('invalid-date', baseNow)).toBe('');
  });
});

describe('notification navigation resolution', () => {
  it('allows student to reach BookingDetail and Waitlist', () => {
    expect(resolveTarget('STUDENT', 'BookingDetail')).toBeTruthy();
    expect(resolveTarget('STUDENT', 'Waitlist')).toBeTruthy();
  });

  it('allows lecturer to reach BookingDetail but not Waitlist', () => {
    expect(resolveTarget('LECTURER', 'BookingDetail')).toBeTruthy();
    expect(resolveTarget('LECTURER', 'Waitlist')).toBeNull();
  });

  it('admin cannot reach student BookingDetail or Waitlist directly', () => {
    expect(resolveTarget('ADMIN', 'BookingDetail')).toBeNull();
    expect(resolveTarget('ADMIN', 'Waitlist')).toBeNull();
  });
});
