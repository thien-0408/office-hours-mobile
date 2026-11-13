import { ApiError } from '../src/api/errors';
import type { Booking } from '../src/api/domainTypes';
import { vnDateToInstant } from '../src/api/time';
import {
  bookingActions,
  bookingErrorMessage,
  bookingSubtitle,
  googleCalendarUrl,
  isInLiveWindow,
  isValidMeetingUrl,
  meetingProvider,
  otherParty,
  sortBookingsForTab,
  tabStatuses,
} from '../src/features/booking/detail/bookingLogic';

const start = vnDateToInstant(2026, 11, 18, 14, 0);
const end = vnDateToInstant(2026, 11, 18, 14, 20);
const MIN = 60_000;

const base: Booking = {
  id: 'b1',
  slotId: 's1',
  lecturerId: 'l1',
  studentId: 'st1',
  lecturerName: 'TS. Khoa',
  studentName: 'Mai',
  department: null,
  topic: 'Đề cương',
  startAt: start.toISOString(),
  endAt: end.toISOString(),
  status: 'CONFIRMED',
  meetingUrl: null,
};
const withStatus = (status: Booking['status']): Booking => ({
  ...base,
  status,
});

test('tab to status mapping', () => {
  expect(tabStatuses('upcoming')).toEqual(['CONFIRMED']);
  expect(tabStatuses('pending')).toEqual(['PENDING']);
  expect(tabStatuses('past')).toEqual(['COMPLETED', 'NO_SHOW']);
  expect(tabStatuses('cancelled')).toEqual(['CANCELLED', 'DECLINED']);
});

test('sorting: soonest first for upcoming, latest first for past', () => {
  const a = { ...base, id: 'a', startAt: '2026-11-01T00:00:00Z' };
  const b = { ...base, id: 'b', startAt: '2026-11-02T00:00:00Z' };
  expect(sortBookingsForTab([b, a], 'upcoming').map(x => x.id)).toEqual([
    'a',
    'b',
  ]);
  expect(sortBookingsForTab([a, b], 'past').map(x => x.id)).toEqual([
    'b',
    'a',
  ]);
});

test('other party depends on role', () => {
  expect(otherParty(base, 'STUDENT')).toEqual({ id: 'l1', name: 'TS. Khoa' });
  expect(otherParty(base, 'LECTURER')).toEqual({ id: 'st1', name: 'Mai' });
});

test('subtitle uses VN time and place', () => {
  expect(bookingSubtitle(base)).toBe('Thứ Tư 18/11 · 14:00 · Trực tiếp');
  expect(bookingSubtitle({ ...base, meetingUrl: 'https://zoom.us/j/1' })).toBe(
    'Thứ Tư 18/11 · 14:00 · Online',
  );
  expect(bookingSubtitle(base, '306.B11')).toBe(
    'Thứ Tư 18/11 · 14:00 · 306.B11',
  );
});

describe('live window', () => {
  const s = start.getTime();
  const e = end.getTime();
  test('boundaries', () => {
    expect(isInLiveWindow(base, s - 16 * MIN)).toBe(false);
    expect(isInLiveWindow(base, s - 15 * MIN)).toBe(true);
    expect(isInLiveWindow(base, e + 15 * MIN)).toBe(true);
    expect(isInLiveWindow(base, e + 16 * MIN)).toBe(false);
  });
});

describe('bookingActions', () => {
  const before = start.getTime() - 60 * MIN;
  const during = start.getTime() + 5 * MIN;
  const after = end.getTime() + 60 * MIN;

  test('student, confirmed, before start', () => {
    const a = bookingActions(base, 'STUDENT', before);
    expect(a.cancel && a.reschedule && a.chat).toBe(true);
    expect(a.approve || a.decline || a.editLink || a.record).toBe(false);
    expect(a.liveMeeting).toBe(false);
  });
  test('student cannot cancel once started; live window opens', () => {
    const a = bookingActions(base, 'STUDENT', during);
    expect(a.cancel).toBe(false);
    expect(a.liveMeeting).toBe(true);
  });
  test('student pending: cancel but no chat', () => {
    const a = bookingActions(withStatus('PENDING'), 'STUDENT', before);
    expect(a.cancel).toBe(true);
    expect(a.chat).toBe(false);
  });
  test('lecturer pending: approve/decline, no record', () => {
    const a = bookingActions(withStatus('PENDING'), 'LECTURER', before);
    expect(a.approve && a.decline && a.editLink).toBe(true);
    expect(a.record).toBe(false);
  });
  test('lecturer record only after start', () => {
    expect(bookingActions(base, 'LECTURER', before).record).toBe(false);
    expect(bookingActions(base, 'LECTURER', during).record).toBe(true);
    expect(bookingActions(withStatus('COMPLETED'), 'LECTURER', after).record).toBe(
      true,
    );
    expect(bookingActions(base, 'LECTURER', after).editLink).toBe(false);
  });
  test('finished booking: chat yes, live no', () => {
    const a = bookingActions(withStatus('COMPLETED'), 'STUDENT', during);
    expect(a.chat).toBe(true);
    expect(a.liveMeeting).toBe(false);
  });
  test('cancelled/declined: nothing', () => {
    for (const s of ['CANCELLED', 'DECLINED'] as const) {
      const a = bookingActions(withStatus(s), 'LECTURER', before);
      expect(Object.values(a).some(Boolean)).toBe(false);
    }
  });
  test('admin is read only; no role gets nothing', () => {
    const a = bookingActions(base, 'ADMIN', before);
    expect(a.cancel || a.approve || a.record).toBe(false);
    expect(
      Object.values(bookingActions(base, null, before)).some(Boolean),
    ).toBe(false);
  });
});

test('meeting provider from URL', () => {
  expect(meetingProvider('https://us02web.zoom.us/j/123')).toBe('zoom');
  expect(meetingProvider('https://zoom.us/j/123')).toBe('zoom');
  expect(meetingProvider('https://meet.google.com/abc-defg-hij')).toBe('meet');
  expect(meetingProvider('https://teams.microsoft.com/l/meetup-join/x')).toBe(
    'teams',
  );
  expect(meetingProvider('https://example.com/room')).toBe('other');
  expect(meetingProvider('https://notzoom.us.evil.com/x')).toBe('other');
  expect(meetingProvider('https://evilzoom.us/x')).toBe('other');
  expect(meetingProvider(null)).toBeNull();
  expect(meetingProvider('not a url')).toBeNull();
});

test('meeting URL validation', () => {
  expect(isValidMeetingUrl('https://meet.google.com/abc')).toBe(true);
  expect(isValidMeetingUrl('')).toBe(true);
  expect(isValidMeetingUrl('http://meet.google.com/abc')).toBe(false);
  expect(isValidMeetingUrl('https://localhost')).toBe(false);
  expect(isValidMeetingUrl('meet.google.com')).toBe(false);
  expect(isValidMeetingUrl('https://a b.com')).toBe(false);
});

test('google calendar URL', () => {
  const url = googleCalendarUrl({
    ...base,
    meetingUrl: 'https://meet.google.com/abc',
  });
  expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(
    true,
  );
  expect(url).toContain('action=TEMPLATE');
  // 14:00 +07 = 07:00Z
  expect(url).toContain(
    `dates=${encodeURIComponent('20261118T070000Z/20261118T072000Z')}`,
  );
  expect(url).toContain('location=https%3A%2F%2Fmeet.google.com%2Fabc');
  expect(url).toContain(encodeURIComponent('Office hour: Đề cương'));
  expect(googleCalendarUrl({ ...base, topic: null })).toContain(
    encodeURIComponent('Office hour với TS. Khoa'),
  );
  expect(googleCalendarUrl(base)).not.toContain('location=');
});

describe('error messages', () => {
  const err = (status: number, error: string, details?: unknown) =>
    new ApiError({ status, error, message: 'x', details });
  test('cancellation notice uses noticeHours', () => {
    expect(
      bookingErrorMessage(err(409, 'CANCELLATION_NOTICE_PASSED', { noticeHours: 24 })),
    ).toContain('24 giờ');
    expect(bookingErrorMessage(err(409, 'CANCELLATION_NOTICE_PASSED'))).toContain(
      'quá hạn',
    );
  });
  test('slot conflicts are distinct', () => {
    const a = bookingErrorMessage(err(409, 'SLOT_ALREADY_CONFIRMED'));
    const b = bookingErrorMessage(err(409, 'SLOT_HELD_FOR_WAITLIST'));
    expect(a).not.toBe(b);
    expect(b).toContain('hàng đợi');
  });
  test('unknown error falls back', () => {
    expect(bookingErrorMessage(new Error('boom'))).toContain('thử lại');
  });
});
