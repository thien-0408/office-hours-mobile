const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    delete store[k];
  }),
}));

import { ApiError } from '../src/api/errors';
import { resetTokenCache, setTokens } from '../src/api/tokenStore';
import {
  listLecturers,
  getLecturerSlots,
  getSuggestedSlots,
} from '../src/api/lecturers';
import {
  cancelBooking,
  createBooking,
  declineBooking,
  listBookings,
  rescheduleBooking,
  updateBookingMeetingUrl,
} from '../src/api/bookings';
import {
  acceptWaitlistOffer,
  joinWaitlist,
  leaveWaitlist,
} from '../src/api/waitlist';
import {
  listNotifications,
  markAllNotificationsRead,
} from '../src/api/notifications';
import {
  batchRowErrors,
  importMySchedule,
  listAllScheduleImports,
} from '../src/api/schedule';
import {
  listAvailabilityRules,
  updateAvailabilityRule,
} from '../src/api/availability';
import { listCampusRooms } from '../src/api/campus';
import { getChatHistory, markChatRead } from '../src/api/chat';
import { listUsers, updateUser } from '../src/api/admin';
import { getFirebaseToken } from '../src/api/realtime';
import {
  ERR,
  conflictTypeOf,
  noticeHoursOf,
  waitlistAvailableOf,
} from '../src/api/errorCodes';
import { pageInfiniteOptions, flattenPages } from '../src/api/hooks/pagination';
import { queryKeys } from '../src/api/hooks/queryKeys';
import {
  formatStartsIn,
  formatVnDayTime,
  formatVnTime,
  isoDayOfWeek,
  isoWeekString,
  vnDateToInstant,
} from '../src/api/time';

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
let respond: () => Response;

function jsonRes(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  return respond();
});

const BASE = 'http://localhost:8080/api/v1';
const last = () => calls[calls.length - 1];
const bodyOf = (c: Call) => JSON.parse(c.init.body as string);

beforeEach(async () => {
  Object.keys(store).forEach(k => delete store[k]);
  resetTokenCache();
  calls = [];
  fetchMock.mockClear();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  respond = () => jsonRes(200, {});
  await setTokens({ accessToken: 'A1', refreshToken: 'R1' });
});

describe('lecturers', () => {
  it('builds list query with filters and pagination, dropping undefined', async () => {
    await listLecturers({
      q: 'an',
      department: 'CS',
      dayOfWeek: 7,
      availableOnly: true,
      page: 2,
      size: 20,
      sort: undefined,
    });
    expect(last().url).toBe(
      `${BASE}/lecturers?q=an&department=CS&dayOfWeek=7&availableOnly=true&page=2&size=20`,
    );
    expect(last().init.method).toBe('GET');
  });

  it('slots use week param; suggested slots pass category and limit', async () => {
    await getLecturerSlots('L1', { week: '2026-W47' });
    expect(last().url).toBe(`${BASE}/lecturers/L1/slots?week=2026-W47`);
    await getSuggestedSlots({ category: 'MATH', limit: 6 });
    expect(last().url).toBe(
      `${BASE}/users/me/suggested-slots?category=MATH&limit=6`,
    );
  });
});

describe('bookings', () => {
  it('creates with slotId/topic and lists by status', async () => {
    await createBooking({ slotId: 's1', topic: 'Capstone' });
    expect(last().url).toBe(`${BASE}/bookings`);
    expect(last().init.method).toBe('POST');
    expect(bodyOf(last())).toEqual({ slotId: 's1', topic: 'Capstone' });

    await listBookings({ status: 'PENDING', page: 0, size: 20 });
    expect(last().url).toBe(`${BASE}/bookings?status=PENDING&page=0&size=20`);
  });

  it('cancel has no body; reschedule, decline and patch send the right bodies', async () => {
    await cancelBooking('b1');
    expect(last().url).toBe(`${BASE}/bookings/b1/cancel`);
    expect(last().init.body).toBeUndefined();

    await rescheduleBooking('b1', 's2');
    expect(bodyOf(last())).toEqual({ newSlotId: 's2' });

    await declineBooking('b1', 'busy');
    expect(bodyOf(last())).toEqual({ reason: 'busy' });
    await declineBooking('b1');
    expect(last().init.body).toBeUndefined();

    await updateBookingMeetingUrl('b1', null);
    expect(last().init.method).toBe('PATCH');
    expect(bodyOf(last())).toEqual({ meetingUrl: null });
  });

  it('surfaces 409 details for the UI', async () => {
    respond = () =>
      jsonRes(409, {
        status: 409,
        error: 'BOOKING_SLOT_TAKEN',
        message: 'x',
        details: { waitlistAvailable: true },
      });
    const err = (await createBooking({ slotId: 's' }).catch(
      e => e,
    )) as ApiError;
    expect(err.is(409, ERR.BOOKING_SLOT_TAKEN)).toBe(true);
    expect(waitlistAvailableOf(err.details)).toBe(true);

    expect(noticeHoursOf({ noticeHours: 24 })).toBe(24);
    expect(conflictTypeOf({ conflictType: 'SCHEDULE' })).toBe('SCHEDULE');
    expect(conflictTypeOf({ conflictType: 'x' })).toBeUndefined();
  });
});

describe('waitlist', () => {
  it('join / accept / leave paths', async () => {
    await joinWaitlist('s1');
    expect(last().url).toBe(`${BASE}/slots/s1/waitlist`);
    expect(last().init.method).toBe('POST');
    await acceptWaitlistOffer('w1');
    expect(last().url).toBe(`${BASE}/waitlist/w1/accept`);
    respond = () => jsonRes(204);
    await leaveWaitlist('w1');
    expect(last().init.method).toBe('DELETE');
    expect(last().url).toBe(`${BASE}/waitlist/w1`);
  });
});

describe('notifications', () => {
  it('passes unreadOnly and page; read-all is POST', async () => {
    await listNotifications({ unreadOnly: true, page: 1, size: 20 });
    expect(last().url).toBe(
      `${BASE}/notifications?unreadOnly=true&page=1&size=20`,
    );
    respond = () => jsonRes(204);
    await markAllNotificationsRead();
    expect(last().url).toBe(`${BASE}/notifications/read-all`);
    expect(last().init.method).toBe('POST');
  });
});

describe('schedule', () => {
  it('posts the batch payload as-is', async () => {
    const payload = {
      semesterId: 'sem',
      mode: 'REPLACE' as const,
      sourceFiles: ['a.pdf'],
      rows: [
        {
          day: 'Thứ 2',
          date: null,
          startTime: '07:30',
          endTime: '09:30',
          subjectCode: '',
          subjectName: 'X',
          group: 'A',
          room: 'R1',
          lecturerName: '',
        },
      ],
    };
    await importMySchedule(payload);
    expect(last().url).toBe(`${BASE}/users/me/schedule-entries/batch`);
    expect(bodyOf(last())).toEqual(payload);
  });

  it('extracts rowIndex errors from 422 SCHEDULE_BATCH_INVALID', async () => {
    respond = () =>
      jsonRes(422, {
        status: 422,
        error: 'SCHEDULE_BATCH_INVALID',
        message: 'x',
        details: {
          errors: [
            {
              rowIndex: 3,
              field: 'endTime',
              message: 'Must be after startTime',
            },
            { field: 'mode', message: 'Must be REPLACE or MERGE' },
          ],
        },
      });
    const err = await importMySchedule({
      semesterId: 's',
      mode: 'MERGE',
      sourceFiles: [],
      rows: [],
    }).catch(e => e);
    expect(batchRowErrors(err)).toEqual([
      { rowIndex: 3, field: 'endTime', message: 'Must be after startTime' },
      {
        rowIndex: undefined,
        field: 'mode',
        message: 'Must be REPLACE or MERGE',
      },
    ]);
    expect(batchRowErrors(new Error('x'))).toEqual([]);
  });

  it('admin import history is paginated', async () => {
    await listAllScheduleImports({ page: 1, size: 10 });
    expect(last().url).toBe(`${BASE}/schedule-imports?page=1&size=10`);
  });
});

describe('availability, campus, chat, admin, realtime', () => {
  it('availability rules query and partial patch', async () => {
    await listAvailabilityRules('L1', 'sem1');
    expect(last().url).toBe(
      `${BASE}/lecturers/L1/availability-rules?semesterId=sem1`,
    );
    await listAvailabilityRules('L1');
    expect(last().url).toBe(`${BASE}/lecturers/L1/availability-rules`);
    await updateAvailabilityRule('r1', { meetingUrl: null });
    expect(last().url).toBe(`${BASE}/availability-rules/r1`);
    expect(bodyOf(last())).toEqual({ meetingUrl: null });
  });

  it('campus rooms optional building filter', async () => {
    await listCampusRooms();
    expect(last().url).toBe(`${BASE}/campus/rooms`);
    await listCampusRooms('B1');
    expect(last().url).toBe(`${BASE}/campus/rooms?buildingCode=B1`);
  });

  it('chat history cursors and mark read', async () => {
    await getChatHistory('b1', { before: 120, limit: 50 });
    expect(last().url).toBe(`${BASE}/bookings/b1/messages?before=120&limit=50`);
    await getChatHistory('b1', { after: 7 });
    expect(last().url).toBe(`${BASE}/bookings/b1/messages?after=7`);
    respond = () => jsonRes(204);
    await markChatRead('b1', 42);
    expect(last().url).toBe(`${BASE}/bookings/b1/messages/read`);
    expect(bodyOf(last())).toEqual({ upToId: 42 });
  });

  it('admin users filter + patch; firebase token', async () => {
    await listUsers({ role: 'LECTURER', department: 'CS', page: 0 });
    expect(last().url).toBe(`${BASE}/users?role=LECTURER&department=CS&page=0`);
    await updateUser('u1', { department: null });
    expect(last().init.method).toBe('PATCH');
    expect(bodyOf(last())).toEqual({ department: null });

    respond = () => jsonRes(200, { firebaseToken: 'tok' });
    await expect(getFirebaseToken()).resolves.toEqual({ firebaseToken: 'tok' });
    expect(last().url).toBe(`${BASE}/realtime/firebase-token`);
    expect(last().init.method).toBe('POST');
  });
});

describe('pagination helpers and keys', () => {
  const page = (p: number, total: number) => ({
    content: [p],
    totalElements: total * 1,
    totalPages: total,
    page: p,
    size: 1,
  });

  it('next page param is page+1 until the last page', () => {
    const { getNextPageParam, initialPageParam } = pageInfiniteOptions;
    expect(initialPageParam).toBe(0);
    expect(getNextPageParam(page(0, 3))).toBe(1);
    expect(getNextPageParam(page(2, 3))).toBeUndefined();
    expect(getNextPageParam(page(0, 0))).toBeUndefined();
  });

  it('flattens pages', () => {
    expect(
      flattenPages({
        pages: [page(0, 2), page(1, 2)],
        pageParams: [0, 1],
      }),
    ).toEqual([0, 1]);
    expect(flattenPages(undefined)).toEqual([]);
  });

  it('query keys embed filters', () => {
    expect(queryKeys.bookings.list({ status: 'PENDING' })).toEqual([
      'bookings',
      'list',
      { status: 'PENDING' },
    ]);
  });
});

describe('time (Asia/Ho_Chi_Minh, fixed +07:00)', () => {
  it('formats across midnight UTC', () => {
    // 17:30Z on 17/11 is already 00:30 on Wed 18/11 in Vietnam.
    expect(formatVnDayTime('2026-11-17T17:30:00Z')).toBe(
      'Thứ Tư 18/11 · 00:30',
    );
    // 16:59Z is still 23:59 on Tue 17/11.
    expect(formatVnDayTime('2026-11-17T16:59:00Z')).toBe(
      'Thứ Ba 17/11 · 23:59',
    );
    expect(formatVnTime('2026-11-18T07:00:00Z')).toBe('14:00');
    expect(formatVnDayTime('2026-11-18T07:00:00Z')).toBe(
      'Thứ Tư 18/11 · 14:00',
    );
  });

  it('relative start labels', () => {
    const now = '2026-11-18T06:00:00Z';
    expect(formatStartsIn('2026-11-18T06:12:30Z', now)).toBe(
      'Bắt đầu sau 12 phút',
    );
    expect(formatStartsIn('2026-11-18T08:05:00Z', now)).toBe(
      'Bắt đầu sau 2 giờ 5 phút',
    );
    expect(formatStartsIn('2026-11-18T08:00:00Z', now)).toBe(
      'Bắt đầu sau 2 giờ',
    );
    expect(formatStartsIn('2026-11-21T06:00:00Z', now)).toBe(
      'Bắt đầu sau 3 ngày',
    );
    expect(formatStartsIn('2026-11-18T06:00:20Z', now)).toBe('Sắp bắt đầu');
    expect(formatStartsIn('2026-11-18T05:00:00Z', now)).toBe('Đã bắt đầu');
  });

  it('ISO day of week: Sunday is 7, Monday is 1, using the VN date', () => {
    expect(isoDayOfWeek('2026-11-15T03:00:00Z')).toBe(7); // Sunday
    expect(isoDayOfWeek('2026-11-16T03:00:00Z')).toBe(1); // Monday
    // Sunday 23:00Z is already Monday 06:00 in Vietnam.
    expect(isoDayOfWeek('2026-11-15T23:00:00Z')).toBe(1);
  });

  it('ISO week string at the year boundary', () => {
    expect(isoWeekString(vnDateToInstant(2026, 12, 31, 12))).toBe('2026-W53');
    expect(isoWeekString(vnDateToInstant(2027, 1, 1, 12))).toBe('2026-W53');
    expect(isoWeekString(vnDateToInstant(2027, 1, 3, 12))).toBe('2026-W53'); // Sunday
    expect(isoWeekString(vnDateToInstant(2027, 1, 4, 12))).toBe('2027-W01');
    expect(isoWeekString(vnDateToInstant(2026, 11, 18, 14))).toBe('2026-W47');
    // 2025-12-29 (Mon) starts 2026-W01.
    expect(isoWeekString(vnDateToInstant(2025, 12, 29, 0, 5))).toBe('2026-W01');
    // 2026-12-31T18:00Z is already 2027-01-01 01:00 in VN: still W53.
    expect(isoWeekString('2026-12-31T18:00:00Z')).toBe('2026-W53');
  });

  it('rejects invalid dates', () => {
    expect(() => formatVnTime('nope')).toThrow(RangeError);
  });
});
