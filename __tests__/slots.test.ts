import { ApiError, NetworkError } from '../src/api/errors';
import { vnDateToInstant } from '../src/api/time';
import type { BookableSlot } from '../src/api/domainTypes';
import {
  TOPIC_MAX_LENGTH,
  bookingErrorUi,
  dateBlock,
  dayKey,
  dayTimeShort,
  defaultDayKey,
  groupSlotsByDay,
  officeRoomText,
  rescheduleErrorUi,
  shortDayLabel,
  slotState,
  slotSummary,
  validateTopic,
  waitlistJoinErrorOutcome,
  weekInfo,
  weekOffsetBetween,
} from '../src/features/booking/slots/slotLogic';
import { tintIndexFor } from '../src/features/booking/slots/LecturerCover';

const slot = (over: Partial<BookableSlot> = {}): BookableSlot => ({
  id: 's1',
  lecturerId: 'l1',
  startAt: vnDateToInstant(2026, 11, 18, 14, 0).toISOString(),
  endAt: vnDateToInstant(2026, 11, 18, 14, 20).toISOString(),
  available: true,
  conflict: false,
  ...over,
});

const api = (status: number, error: string, details?: unknown) =>
  new ApiError({ status, error, message: 'x', details });

// Saturday 14/11/2026 10:00 VN
const NOW = vnDateToInstant(2026, 11, 14, 10, 0).getTime();

describe('weeks', () => {
  test('weekInfo of the current week (Mon 9 - Sun 15 Nov 2026 = W46)', () => {
    const w = weekInfo(NOW, 0);
    expect(w.week).toBe('2026-W46');
    expect(w.days).toHaveLength(7);
    expect(w.days[0].key).toBe('2026-11-09');
    expect(w.days[6].key).toBe('2026-11-15');
    expect(w.rangeLabel).toBe('09–15/11');
  });

  test('offset moves whole weeks', () => {
    const w = weekInfo(NOW, 1);
    expect(w.week).toBe('2026-W47');
    expect(w.weekNumber).toBe(47);
    expect(w.rangeLabel).toBe('16–22/11');
    expect(weekInfo(NOW, -1).week).toBe('2026-W45');
  });

  test('range across a month and year boundary', () => {
    const w = weekInfo(vnDateToInstant(2026, 12, 31, 12), 0);
    expect(w.week).toBe('2026-W53');
    expect(w.rangeLabel).toBe('28/12–03/01');
    expect(w.days[6].key).toBe('2027-01-03');
  });

  test('Sunday belongs to the week that started on Monday', () => {
    const sunday = vnDateToInstant(2026, 11, 15, 23, 30);
    expect(weekInfo(sunday, 0).days[0].key).toBe('2026-11-09');
  });

  test('weekOffsetBetween', () => {
    expect(weekOffsetBetween(NOW, vnDateToInstant(2026, 11, 19, 15))).toBe(1);
    expect(weekOffsetBetween(NOW, vnDateToInstant(2026, 11, 15, 15))).toBe(0);
    expect(weekOffsetBetween(NOW, vnDateToInstant(2026, 11, 1, 15))).toBe(-2);
  });

  test('shortDayLabel', () => {
    expect(shortDayLabel(1)).toBe('T2');
    expect(shortDayLabel(6)).toBe('T7');
    expect(shortDayLabel(7)).toBe('CN');
  });
});

describe('slot state', () => {
  test('available, full, conflict, current, past', () => {
    expect(slotState(slot())).toBe('available');
    expect(slotState(slot({ available: false }))).toBe('full');
    expect(slotState(slot({ conflict: true }))).toBe('conflict');
    // conflict wins over full
    expect(slotState(slot({ available: false, conflict: true }))).toBe(
      'conflict',
    );
    expect(slotState(slot(), { currentSlotId: 's1' })).toBe('current');
    const later = vnDateToInstant(2026, 11, 20).getTime();
    expect(slotState(slot(), { now: later })).toBe('past');
    expect(slotState(slot(), { now: NOW })).toBe('available');
  });
});

describe('grouping and default day', () => {
  const wed10 = slot({
    id: 'a',
    startAt: vnDateToInstant(2026, 11, 18, 10).toISOString(),
  });
  const wed9 = slot({
    id: 'b',
    startAt: vnDateToInstant(2026, 11, 18, 9).toISOString(),
  });
  const thuFull = slot({
    id: 'c',
    available: false,
    startAt: vnDateToInstant(2026, 11, 19, 9).toISOString(),
  });

  test('groups by Vietnam day and sorts by start', () => {
    const g = groupSlotsByDay([wed10, wed9, thuFull]);
    expect(Object.keys(g).sort()).toEqual(['2026-11-18', '2026-11-19']);
    expect(g['2026-11-18'].map(s => s.id)).toEqual(['b', 'a']);
  });

  test('a late-evening UTC slot lands on the right VN day', () => {
    // 20:00 UTC on 17/11 is 03:00 on 18/11 in Vietnam
    const s = slot({ startAt: '2026-11-17T20:00:00Z' });
    expect(dayKey(s.startAt)).toBe('2026-11-18');
  });

  test('defaultDayKey: first day with an open slot', () => {
    const week = weekInfo(NOW, 1);
    const byDay = groupSlotsByDay([thuFull, wed10]);
    expect(defaultDayKey(week, byDay, NOW)).toBe('2026-11-18');
  });

  test('defaultDayKey: falls back to first day with any slot, then Monday', () => {
    const week = weekInfo(NOW, 1);
    expect(defaultDayKey(week, groupSlotsByDay([thuFull]), NOW)).toBe(
      '2026-11-19',
    );
    expect(defaultDayKey(week, {}, NOW)).toBe('2026-11-16');
  });

  test('defaultDayKey: current week skips days before today', () => {
    const week = weekInfo(NOW, 0);
    const monday = slot({
      id: 'm',
      startAt: vnDateToInstant(2026, 11, 9, 9).toISOString(),
    });
    const sunday = slot({
      id: 'u',
      startAt: vnDateToInstant(2026, 11, 15, 9).toISOString(),
    });
    expect(defaultDayKey(week, groupSlotsByDay([monday, sunday]), NOW)).toBe(
      '2026-11-15',
    );
    expect(defaultDayKey(week, {}, NOW)).toBe('2026-11-14');
  });
});

describe('text', () => {
  const room = {
    id: 'r',
    buildingCode: 'B11',
    floor: 3,
    name: 'Phòng họp',
    code: '306.B11',
  };
  test('room labels', () => {
    expect(officeRoomText(room)).toBe('Phòng 306.B11');
    expect(officeRoomText({ ...room, code: null })).toBe('Phòng Phòng họp');
    expect(officeRoomText(null)).toBe('Chưa có phòng làm việc');
  });

  test('slotSummary and short labels', () => {
    const start = slot().startAt;
    expect(slotSummary(start, room)).toBe('Thứ Tư 18/11 · 14:00 · 306.B11');
    expect(slotSummary(start, null)).toBe('Thứ Tư 18/11 · 14:00');
    expect(dayTimeShort(start)).toBe('Thứ Tư 14:00');
  });

  test('dateBlock', () => {
    const s = slot();
    expect(dateBlock(s.startAt, s.endAt)).toEqual({
      day: '18',
      caption: 'Thứ Tư, tháng 11',
      range: '14:00 – 14:20',
    });
  });

  test('validateTopic', () => {
    expect(validateTopic('   ')).not.toBeNull();
    expect(validateTopic('Đề cương')).toBeNull();
    expect(validateTopic('x'.repeat(TOPIC_MAX_LENGTH))).toBeNull();
    expect(validateTopic('x'.repeat(TOPIC_MAX_LENGTH + 1))).not.toBeNull();
  });

  test('tintIndexFor is stable and in range', () => {
    expect(tintIndexFor('abc')).toBe(tintIndexFor('abc'));
    for (const id of ['', 'a', 'dev-lecturer-1', 'x'.repeat(50)]) {
      const i = tintIndexFor(id);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(4);
    }
  });
});

describe('bookingErrorUi', () => {
  test('409 slot race maps to slotTaken with waitlistAvailable', () => {
    for (const code of ['BOOKING_SLOT_UNAVAILABLE', 'BOOKING_SLOT_TAKEN']) {
      const ui = bookingErrorUi(api(409, code, { waitlistAvailable: true }));
      expect(ui.kind).toBe('slotTaken');
      expect(ui.waitlistAvailable).toBe(true);
    }
    expect(
      bookingErrorUi(api(409, 'BOOKING_SLOT_TAKEN', { waitlistAvailable: false }))
        .waitlistAvailable,
    ).toBe(false);
    expect(bookingErrorUi(api(409, 'BOOKING_SLOT_TAKEN')).waitlistAvailable).toBe(
      false,
    );
  });

  test('already requested carries the booking id when present', () => {
    expect(
      bookingErrorUi(api(409, 'BOOKING_ALREADY_REQUESTED', { bookingId: 'b9' })),
    ).toMatchObject({ kind: 'alreadyRequested', bookingId: 'b9' });
    expect(
      bookingErrorUi(api(409, 'BOOKING_ALREADY_REQUESTED')).bookingId,
    ).toBeUndefined();
  });

  test('422 conflict explains the type', () => {
    const sched = bookingErrorUi(
      api(422, 'BOOKING_STUDENT_CONFLICT', { conflictType: 'SCHEDULE' }),
    );
    const book = bookingErrorUi(
      api(422, 'BOOKING_STUDENT_CONFLICT', { conflictType: 'BOOKING' }),
    );
    expect(sched.kind).toBe('studentConflict');
    expect(sched.message).toMatch(/lịch học/);
    expect(book.message).toMatch(/lịch hẹn/);
  });

  test('network, unknown and 404', () => {
    expect(bookingErrorUi(new NetworkError('x')).kind).toBe('network');
    expect(bookingErrorUi(new Error('boom')).kind).toBe('generic');
    expect(bookingErrorUi(api(500, 'INTERNAL')).kind).toBe('generic');
    expect(bookingErrorUi(api(404, 'SLOT_NOT_FOUND')).kind).toBe('notFound');
    expect(bookingErrorUi(api(409, 'BOOKING_SEMESTER_UNAVAILABLE')).kind).toBe(
      'semester',
    );
  });
});

describe('rescheduleErrorUi', () => {
  test('notice passed uses noticeHours', () => {
    const ui = rescheduleErrorUi(
      api(409, 'CANCELLATION_NOTICE_PASSED', { noticeHours: 24 }),
    );
    expect(ui.kind).toBe('noticePassed');
    expect(ui.message).toContain('24');
  });

  test('other reschedule failures', () => {
    expect(
      rescheduleErrorUi(api(422, 'BOOKING_RESCHEDULE_SLOT_INVALID')).kind,
    ).toBe('slotInvalid');
    expect(
      rescheduleErrorUi(api(409, 'BOOKING_TRANSITION_NOT_ALLOWED')).kind,
    ).toBe('notAllowed');
    expect(rescheduleErrorUi(api(409, 'BOOKING_SLOT_TAKEN')).kind).toBe(
      'slotTaken',
    );
    expect(rescheduleErrorUi(api(422, 'BOOKING_STUDENT_CONFLICT')).kind).toBe(
      'studentConflict',
    );
    expect(rescheduleErrorUi(new NetworkError('x')).kind).toBe('network');
  });
});

describe('waitlistJoinErrorOutcome', () => {
  test('maps waitlist errors', () => {
    expect(
      waitlistJoinErrorOutcome(api(409, 'WAITLIST_ALREADY_JOINED')).kind,
    ).toBe('alreadyJoined');
    expect(
      waitlistJoinErrorOutcome(api(409, 'WAITLIST_NOT_NEEDED')).kind,
    ).toBe('notNeeded');
    expect(
      waitlistJoinErrorOutcome(api(409, 'WAITLIST_ALREADY_FULFILLED')).kind,
    ).toBe('error');
    expect(waitlistJoinErrorOutcome(new NetworkError('x')).kind).toBe('error');
  });
});
