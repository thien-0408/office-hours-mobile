import { api } from './client';
import type {
  Booking,
  BookingListQuery,
  BookingTimelineEvent,
  CreateBookingPayload,
  MeetingRecord,
  MeetingRecordPayload,
  Page,
} from './domainTypes';

/**
 * POST /bookings -> 201 Booking(PENDING). Errors: 409 BOOKING_ALREADY_REQUESTED,
 * 409 BOOKING_SLOT_UNAVAILABLE / BOOKING_SLOT_TAKEN (details.waitlistAvailable),
 * 422 BOOKING_STUDENT_CONFLICT (details.conflictType).
 */
export function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return api.post<Booking>('/bookings', payload);
}

/** GET /bookings?status&page&size&sort. Student: own; lecturer: to review; admin: any. */
export function listBookings(
  query: BookingListQuery = {},
): Promise<Page<Booking>> {
  return api.get<Page<Booking>>('/bookings', { query });
}

/** GET /bookings/{id}. */
export function getBooking(id: string): Promise<Booking> {
  return api.get<Booking>(`/bookings/${id}`);
}

/** GET /bookings/{id}/timeline: oldest first, plain array. */
export function getBookingTimeline(
  id: string,
): Promise<BookingTimelineEvent[]> {
  return api.get<BookingTimelineEvent[]>(`/bookings/${id}/timeline`);
}

/** POST /bookings/{id}/cancel. 409 CANCELLATION_NOTICE_PASSED (details.noticeHours) inside 24 h. */
export function cancelBooking(id: string): Promise<Booking> {
  return api.post<Booking>(`/bookings/${id}/cancel`);
}

/** POST /bookings/{id}/reschedule { newSlotId } -> new booking in PENDING. */
export function rescheduleBooking(
  id: string,
  newSlotId: string,
): Promise<Booking> {
  return api.post<Booking>(`/bookings/${id}/reschedule`, { newSlotId });
}

/** POST /bookings/{id}/confirm (lecturer). 409 SLOT_ALREADY_CONFIRMED / SLOT_HELD_FOR_WAITLIST. */
export function confirmBooking(id: string): Promise<Booking> {
  return api.post<Booking>(`/bookings/${id}/confirm`);
}

/** POST /bookings/{id}/decline { reason? } (lecturer). */
export function declineBooking(id: string, reason?: string): Promise<Booking> {
  return api.post<Booking>(
    `/bookings/${id}/decline`,
    reason === undefined ? undefined : { reason },
  );
}

/** PATCH /bookings/{id} { meetingUrl: https URL | null } (lecturer). 422 on a bad URL. */
export function updateBookingMeetingUrl(
  id: string,
  meetingUrl: string | null,
): Promise<Booking> {
  return api.patch<Booking>(`/bookings/${id}`, { meetingUrl });
}

/** POST /bookings/{id}/complete (lecturer, from slot start). */
export function completeBooking(id: string): Promise<Booking> {
  return api.post<Booking>(`/bookings/${id}/complete`);
}

/** POST /bookings/{id}/no-show (lecturer, from slot start). */
export function markNoShow(id: string): Promise<Booking> {
  return api.post<Booking>(`/bookings/${id}/no-show`);
}

/** PATCH /bookings/{id}/meeting-record { attended, notes? } (lecturer). */
export function updateMeetingRecord(
  id: string,
  payload: MeetingRecordPayload,
): Promise<MeetingRecord> {
  return api.patch<MeetingRecord>(`/bookings/${id}/meeting-record`, payload);
}
