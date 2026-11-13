// Pure booking logic (no React): list tabs, per-role actions, meeting provider, calendar URL,
// error messages. Kept free of RN imports so it is unit-testable.
import { ApiError } from '../../../api/errors';
import { ERR, noticeHoursOf } from '../../../api/errorCodes';
import type {
  Booking,
  BookingStatus,
  BookingTimelineType,
} from '../../../api/domainTypes';
import type { UserRole } from '../../../api/types';
import { formatVnDayTime } from '../../../api/time';
import { isWithinJoinWindow } from '../../../api/bookingTime';

// ---- list tabs (screen 13) ----
export type BookingTab = 'upcoming' | 'pending' | 'past' | 'cancelled';

export const BOOKING_TABS: { value: BookingTab; label: string }[] = [
  { value: 'upcoming', label: 'Sắp tới' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'past', label: 'Đã qua' },
  { value: 'cancelled', label: 'Đã hủy' },
];

/**
 * GET /bookings takes a single `status`, so tabs that cover two statuses issue two queries
 * and merge them client-side.
 */
export function tabStatuses(tab: BookingTab): BookingStatus[] {
  switch (tab) {
    case 'upcoming':
      return ['CONFIRMED'];
    case 'pending':
      return ['PENDING'];
    case 'past':
      return ['COMPLETED', 'NO_SHOW'];
    case 'cancelled':
      return ['CANCELLED', 'DECLINED'];
  }
}

/** Upcoming/pending: soonest first. Past/cancelled: latest first. */
export function sortBookingsForTab(
  items: Booking[],
  tab: BookingTab,
): Booking[] {
  const dir = tab === 'upcoming' || tab === 'pending' ? 1 : -1;
  return [...items].sort(
    (a, b) => dir * (Date.parse(a.startAt) - Date.parse(b.startAt)),
  );
}

// ---- labels ----
export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Xác nhận',
  DECLINED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  NO_SHOW: 'Vắng mặt',
};

export const TIMELINE_LABEL: Record<BookingTimelineType, string> = {
  CREATED: 'Đã gửi yêu cầu',
  CONFIRMED: 'Đã xác nhận',
  DECLINED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  RESCHEDULED: 'Đã đổi giờ',
  COMPLETED: 'Đã hoàn thành',
  NO_SHOW: 'Vắng mặt',
};

/** The other party of a booking, from the viewer's role. Admin sees the lecturer. */
export function otherParty(
  booking: Booking,
  role: UserRole | null,
): { id: string; name: string } {
  return role === 'LECTURER'
    ? { id: booking.studentId, name: booking.studentName }
    : { id: booking.lecturerId, name: booking.lecturerName };
}

/** "Thứ Tư 18/11 · 14:00 · Online". The DTO has no room, so in-person says "Trực tiếp". */
export function bookingSubtitle(
  booking: Booking,
  room?: string | null,
): string {
  const where = booking.meetingUrl ? 'Online' : room ? room : 'Trực tiếp';
  return `${formatVnDayTime(booking.startAt)} · ${where}`;
}

// ---- action availability (screen 14) ----
// Single source for the live-meeting window lives in src/api/bookingTime.ts.
export {
  MEETING_JOIN_BEFORE_MIN as LIVE_WINDOW_BEFORE_MIN,
  MEETING_JOIN_AFTER_MIN as LIVE_WINDOW_AFTER_MIN,
  isWithinJoinWindow as isInLiveWindow,
} from '../../../api/bookingTime';

export type BookingActions = {
  cancel: boolean;
  reschedule: boolean;
  approve: boolean;
  decline: boolean;
  editLink: boolean;
  record: boolean;
  chat: boolean;
  liveMeeting: boolean;
};

const NONE: BookingActions = {
  cancel: false,
  reschedule: false,
  approve: false,
  decline: false,
  editLink: false,
  record: false,
  chat: false,
  liveMeeting: false,
};

export function bookingActions(
  booking: Pick<Booking, 'status' | 'startAt' | 'endAt'>,
  role: UserRole | null,
  now: number = Date.now(),
): BookingActions {
  if (!role) {
    return NONE;
  }
  const { status } = booking;
  const started = now >= Date.parse(booking.startAt);
  const ended = now > Date.parse(booking.endAt);
  const open = status === 'PENDING' || status === 'CONFIRMED';
  const finished = status === 'COMPLETED' || status === 'NO_SHOW';
  const chat = status === 'CONFIRMED' || finished;
  const liveMeeting =
    status === 'CONFIRMED' && isWithinJoinWindow(booking, now);

  if (role === 'STUDENT') {
    return {
      ...NONE,
      cancel: open && !started,
      reschedule: open && !started,
      chat,
      liveMeeting,
    };
  }
  if (role === 'LECTURER') {
    return {
      ...NONE,
      approve: status === 'PENDING',
      decline: status === 'PENDING',
      editLink: open && !ended,
      record: started && (status === 'CONFIRMED' || finished),
      chat,
      liveMeeting,
    };
  }
  // ADMIN: read only.
  return { ...NONE, chat };
}

// ---- meeting link ----
export type MeetingProvider = 'zoom' | 'meet' | 'teams' | 'other';

function hostOf(url: string): string | null {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url.trim());
  return m ? m[1].toLowerCase() : null;
}

const hostIs = (host: string, domain: string) =>
  host === domain || host.endsWith(`.${domain}`);

export function meetingProvider(
  url: string | null | undefined,
): MeetingProvider | null {
  if (!url) {
    return null;
  }
  const host = hostOf(url);
  if (!host) {
    return null;
  }
  if (hostIs(host, 'zoom.us') || hostIs(host, 'zoom.com')) {
    return 'zoom';
  }
  if (host === 'meet.google.com') {
    return 'meet';
  }
  if (hostIs(host, 'teams.microsoft.com') || hostIs(host, 'teams.live.com')) {
    return 'teams';
  }
  return 'other';
}

export const PROVIDER_BUTTON_LABEL: Record<MeetingProvider, string> = {
  zoom: 'Tham gia trên Zoom',
  meet: 'Tham gia trên Google Meet',
  teams: 'Tham gia trên Teams',
  other: 'Mở link họp',
};

/** https URL with a dotted host. Empty string means "clear the link" and is valid. */
export function isValidMeetingUrl(input: string): boolean {
  const v = input.trim();
  if (v === '') {
    return true;
  }
  return /^https:\/\/[^\s/?#]+\.[^\s/?#]+(\/\S*)?$/i.test(v);
}

// ---- add to calendar ----
function gcalStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** Google Calendar "create event" template URL (no backend, no OAuth). */
export function googleCalendarUrl(
  booking: Pick<
    Booking,
    'startAt' | 'endAt' | 'topic' | 'meetingUrl' | 'lecturerName'
  >,
): string {
  const title = booking.topic
    ? `Office hour: ${booking.topic}`
    : `Office hour với ${booking.lecturerName}`;
  const params: [string, string][] = [
    ['action', 'TEMPLATE'],
    ['text', title],
    ['dates', `${gcalStamp(booking.startAt)}/${gcalStamp(booking.endAt)}`],
    ['details', `Giảng viên: ${booking.lecturerName}`],
  ];
  if (booking.meetingUrl) {
    params.push(['location', booking.meetingUrl]);
  }
  return `https://calendar.google.com/calendar/render?${params
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')}`;
}

// ---- errors ----
/** Vietnamese message for a failed booking action, branching on error key (never on message). */
export function bookingErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.is(409, ERR.CANCELLATION_NOTICE_PASSED)) {
      const h = noticeHoursOf(err.details);
      return h
        ? `Chỉ được hủy lịch trước giờ hẹn ít nhất ${h} giờ. Bạn có thể nhắn giảng viên để hỏi.`
        : 'Đã quá hạn hủy lịch. Bạn có thể nhắn giảng viên để hỏi.';
    }
    if (err.is(409, ERR.SLOT_ALREADY_CONFIRMED)) {
      return 'Khung giờ này đã được xác nhận cho sinh viên khác. Yêu cầu này không thể duyệt.';
    }
    if (err.is(409, ERR.SLOT_HELD_FOR_WAITLIST)) {
      return 'Khung giờ này đang được giữ cho sinh viên trong hàng đợi.';
    }
    if (err.is(409, ERR.BOOKING_TRANSITION_NOT_ALLOWED)) {
      return 'Trạng thái lịch hẹn đã thay đổi. Danh sách đã được làm mới.';
    }
    if (err.is(404, ERR.BOOKING_NOT_FOUND)) {
      return 'Không tìm thấy lịch hẹn này.';
    }
    if (err.status === 422) {
      return 'Dữ liệu không hợp lệ. Hãy kiểm tra lại.';
    }
    if (err.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    }
  }
  return 'Không thực hiện được. Kiểm tra kết nối rồi thử lại.';
}
