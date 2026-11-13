/**
 * @format
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  dayPeriod,
  dayRangeVn,
  givenName,
  isWithinJoinWindow,
  meetingStatusLabel,
  nextConfirmed,
  nextMeetingInWindow,
  nowCardSubtitle,
  periodTitle,
  vnDateString,
  weekRangeVn,
} from '../src/api/bookingTime';
import type { Booking, MyWaitlistEntry } from '../src/api/domainTypes';
import { vnDateToInstant } from '../src/api/time';
import {
  badgeText,
  lecturerTodayStats,
  studentGreeting,
  studentStats,
  suggestionWhen,
  todayRowPill,
  todayRowSubtitle,
  todayRows,
} from '../src/features/dashboard/dashboardLogic';
import {
  NOW_CARD_SPACE,
  NowCard,
  isNowCardVisible,
  setNowCardVisible,
  useFloatingSpace,
} from '../src/components/motion';

const MIN = 60_000;
// Wednesday 18/11/2026 14:00 VN.
const T = vnDateToInstant(2026, 11, 18, 14, 0).getTime();
const iso = (ms: number) => new Date(ms).toISOString();

function booking(over: Partial<Booking> & { startMin?: number } = {}): Booking {
  const { startMin = 0, ...rest } = over;
  const start = T + startMin * MIN;
  return {
    id: 'b1',
    slotId: 's1',
    lecturerId: 'l1',
    studentId: 'st1',
    lecturerName: 'TS. Khoa',
    studentName: 'Phạm Ngọc Mai',
    department: null,
    topic: 'Đề cương đồ án',
    startAt: iso(start),
    endAt: iso(start + 20 * MIN),
    status: 'CONFIRMED',
    meetingUrl: null,
    ...rest,
  };
}

describe('week and day ranges (Vietnam time)', () => {
  it('week of a Saturday runs Monday..Sunday', () => {
    const r = weekRangeVn(vnDateToInstant(2026, 11, 14, 10));
    expect(r.from).toBe('2026-11-09');
    expect(r.to).toBe('2026-11-15');
    expect(r.start.getTime()).toBe(vnDateToInstant(2026, 11, 9).getTime());
    expect(r.end.getTime()).toBe(vnDateToInstant(2026, 11, 16).getTime());
  });

  it('Monday 00:30 VN (still Sunday in UTC) belongs to the new week', () => {
    const monday = Date.parse('2026-11-15T17:30:00Z');
    expect(weekRangeVn(monday).from).toBe('2026-11-16');
    expect(vnDateString(monday)).toBe('2026-11-16');
    // one minute earlier is Sunday 23:59 VN, previous week
    expect(weekRangeVn(monday - 31 * MIN).from).toBe('2026-11-09');
  });

  it('week crossing a year boundary', () => {
    const r = weekRangeVn(vnDateToInstant(2027, 1, 1, 9)); // Friday
    expect(r.from).toBe('2026-12-28');
    expect(r.to).toBe('2027-01-03');
  });

  it('day range is one calendar day', () => {
    const r = dayRangeVn(T);
    expect(r.from).toBe('2026-11-18');
    expect(r.to).toBe('2026-11-18');
    expect(r.end.getTime() - r.start.getTime()).toBe(24 * 60 * MIN);
    expect(r.start.getTime()).toBe(vnDateToInstant(2026, 11, 18).getTime());
  });
});

describe('time of day', () => {
  const at = (h: number, m = 0) => vnDateToInstant(2026, 11, 18, h, m);
  it('picks sáng / chiều / tối by Vietnam hour', () => {
    expect(periodTitle(at(5))).toBe('Sáng nay');
    expect(periodTitle(at(11, 59))).toBe('Sáng nay');
    expect(periodTitle(at(12))).toBe('Chiều nay');
    expect(periodTitle(at(17, 59))).toBe('Chiều nay');
    expect(periodTitle(at(18))).toBe('Tối nay');
    expect(periodTitle(at(23, 30))).toBe('Tối nay');
    expect(dayPeriod(at(0))).toBe('morning');
  });

  it('uses VN time, not the device zone', () => {
    // 02:00 UTC = 09:00 VN
    expect(periodTitle(Date.parse('2026-11-18T02:00:00Z'))).toBe('Sáng nay');
    // 11:00 UTC = 18:00 VN
    expect(periodTitle(Date.parse('2026-11-18T11:00:00Z'))).toBe('Tối nay');
  });

  it('greets by given name', () => {
    expect(givenName('Nguyễn Văn Bảo')).toBe('Bảo');
    expect(givenName('  Bảo ')).toBe('Bảo');
    expect(givenName(undefined)).toBe('');
    expect(studentGreeting('Bảo')).toBe('Chào Bảo, tuần này bạn có');
    expect(studentGreeting('')).toBe('Tuần này bạn có');
  });
});

describe('stats', () => {
  const entry = (status: MyWaitlistEntry['status']): MyWaitlistEntry => ({
    id: status,
    slotId: 's',
    lecturerName: 'x',
    department: null,
    desiredSlotLabel: '',
    position: 1,
    status,
    offeredStartAt: null,
    offeredExpiresAt: null,
  });

  it('student: bookings, pending, live waitlist entries', () => {
    const week = [
      booking({ id: '1', status: 'CONFIRMED' }),
      booking({ id: '2', status: 'COMPLETED' }),
      booking({ id: '3', status: 'PENDING' }),
      booking({ id: '4', status: 'CANCELLED' }),
      booking({ id: '5', status: 'DECLINED' }),
    ];
    const waitlist = [
      entry('WAITING'),
      entry('OFFERED'),
      entry('EXPIRED'),
      entry('FULFILLED'),
    ];
    expect(studentStats(week, waitlist)).toEqual({
      bookings: 2,
      pending: 1,
      waitlist: 2,
    });
    expect(studentStats([], [])).toEqual({
      bookings: 0,
      pending: 0,
      waitlist: 0,
    });
  });

  it('lecturer: sessions held or scheduled today, completed', () => {
    const today = [
      booking({ id: '1', status: 'COMPLETED' }),
      booking({ id: '2', status: 'COMPLETED' }),
      booking({ id: '3', status: 'CONFIRMED' }),
      booking({ id: '4', status: 'NO_SHOW' }),
      booking({ id: '5', status: 'PENDING' }),
      booking({ id: '6', status: 'CANCELLED' }),
    ];
    expect(lecturerTodayStats(today)).toEqual({ sessions: 4, completed: 2 });
  });

  it('today rows hide pending/cancelled and sort by start', () => {
    const rows = todayRows([
      booking({ id: 'late', startMin: 60 }),
      booking({ id: 'pending', status: 'PENDING', startMin: 5 }),
      booking({ id: 'early', status: 'COMPLETED', startMin: -120 }),
      booking({ id: 'cancelled', status: 'CANCELLED' }),
    ]);
    expect(rows.map(r => r.id)).toEqual(['early', 'late']);
  });

  it('row pill and subtitle', () => {
    expect(todayRowPill(booking({ status: 'COMPLETED' }))).toEqual({
      status: 'COMPLETED',
      label: 'Xong',
    });
    expect(todayRowPill(booking())).toEqual({
      status: 'CONFIRMED',
      label: '14:00',
    });
    expect(todayRowSubtitle(booking())).toBe('14:00 · Đề cương đồ án');
    expect(todayRowSubtitle(booking({ topic: null }))).toBe('14:00');
  });

  it('suggestion label and badge text', () => {
    expect(suggestionWhen({ startAt: iso(T + 24 * 60 * MIN) })).toBe(
      'Thứ Năm · 14:00',
    );
    expect(badgeText(0)).toBeUndefined();
    expect(badgeText(undefined)).toBeUndefined();
    expect(badgeText(4)).toBe('4');
    expect(badgeText(100)).toBe('99+');
  });
});

describe('next meeting selection', () => {
  it('window is [start - 60 min, end]', () => {
    const b = booking({ startMin: 60 }); // starts 15:00, ends 15:20
    expect(nextMeetingInWindow([b], T - 1)).toBeNull(); // 61 min before
    expect(nextMeetingInWindow([b], T)).toBe(b); // exactly 60 min before
    expect(nextMeetingInWindow([b], T + 60 * MIN)).toBe(b); // at start
    expect(nextMeetingInWindow([b], T + 80 * MIN)).toBe(b); // at end
    expect(nextMeetingInWindow([b], T + 80 * MIN + 1)).toBeNull();
  });

  it('only CONFIRMED qualifies and the earliest start wins', () => {
    const pending = booking({ id: 'p', status: 'PENDING', startMin: 5 });
    const later = booking({ id: 'later', startMin: 30 });
    const sooner = booking({ id: 'sooner', startMin: 10 });
    expect(nextMeetingInWindow([pending, later, sooner], T)?.id).toBe(
      'sooner',
    );
    expect(nextMeetingInWindow([pending], T)).toBeNull();
    expect(nextMeetingInWindow([], T)).toBeNull();
  });

  it('dashboard next meeting skips ended and non-confirmed bookings', () => {
    const ended = booking({ id: 'ended', startMin: -60 });
    const tomorrow = booking({ id: 'tomorrow', startMin: 24 * 60 });
    const declined = booking({ id: 'd', status: 'DECLINED', startMin: 30 });
    expect(nextConfirmed([ended, tomorrow, declined], T)?.id).toBe('tomorrow');
    expect(nextConfirmed([ended], T)).toBeNull();
  });

  it('labels: starts in N minutes, then "Đang diễn ra"', () => {
    const b = booking({ startMin: 12 });
    expect(meetingStatusLabel(b, T)).toBe('Bắt đầu sau 12 phút');
    expect(nowCardSubtitle(b, '306.B11', T)).toBe(
      'Bắt đầu sau 12 phút · 306.B11',
    );
    expect(nowCardSubtitle(b, null, T)).toBe('Bắt đầu sau 12 phút');
    expect(
      nowCardSubtitle({ ...b, meetingUrl: 'https://zoom.us/j/1' }, '306.B11', T),
    ).toBe('Bắt đầu sau 12 phút · Online');
    expect(meetingStatusLabel(b, T + 12 * MIN)).toBe('Đang diễn ra');
    expect(nowCardSubtitle(b, '306.B11', T + 15 * MIN)).toBe(
      'Đang diễn ra · 306.B11',
    );
  });

  it('tap goes to LiveMeeting only within [start - 15, end + 15]', () => {
    const b = booking({ startMin: 30 }); // 14:30 - 14:50
    expect(isWithinJoinWindow(b, T + 14 * MIN)).toBe(false);
    expect(isWithinJoinWindow(b, T + 15 * MIN)).toBe(true);
    expect(isWithinJoinWindow(b, T + 65 * MIN)).toBe(true);
    expect(isWithinJoinWindow(b, T + 65 * MIN + 1)).toBe(false);
  });
});

describe('floating card', () => {
  const render = async (el: React.ReactElement) => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      r = ReactTestRenderer.create(el);
    });
    return r;
  };

  afterEach(() => setNowCardVisible(false));

  it('floating space follows the visible flag', async () => {
    let value = -1;
    function Probe() {
      value = useFloatingSpace();
      return null;
    }
    await render(<Probe />);
    expect(value).toBe(0);
    await act(() => {
      setNowCardVisible(true);
    });
    expect(isNowCardVisible()).toBe(true);
    expect(value).toBe(NOW_CARD_SPACE);
    await act(() => {
      setNowCardVisible(false);
    });
    expect(value).toBe(0);
  });

  it('renders name and subtitle; card and chat button fire separately', async () => {
    const onPress = jest.fn();
    const onChat = jest.fn();
    const r = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 360, height: 800 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <NowCard
          name="Phạm Ngọc Mai"
          subtitle="Bắt đầu sau 12 phút · 306.B11"
          avatarId="st1"
          onPress={onPress}
          onChat={onChat}
        />
      </SafeAreaProvider>,
    );
    const texts = r.root
      .findAll(n => typeof n.props.children === 'string')
      .map(n => n.props.children);
    expect(texts).toContain('Phạm Ngọc Mai');
    expect(texts).toContain('Bắt đầu sau 12 phút · 306.B11');
    const buttons = r.root.findAll(
      n => n.props.accessibilityRole === 'button' && !!n.props.onPress,
    );
    const chat = buttons.find(b => b.props.accessibilityLabel === 'Nhắn tin');
    await act(() => chat?.props.onPress());
    expect(onChat).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    const card = buttons.find(b => b.props.accessibilityLabel !== 'Nhắn tin');
    await act(() => card?.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
