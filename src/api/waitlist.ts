import { api } from './client';
import type {
  Booking,
  MyWaitlistEntry,
  QueueEntry,
  SlotWaitlist,
} from './domainTypes';

/** POST /slots/{id}/waitlist -> 201 entry (WAITING). 409 WAITLIST_NOT_NEEDED / _ALREADY_JOINED / _ALREADY_FULFILLED. */
export function joinWaitlist(slotId: string): Promise<MyWaitlistEntry> {
  return api.post<MyWaitlistEntry>(`/slots/${slotId}/waitlist`);
}

/** GET /waitlist/me: plain array across all slots. */
export function getMyWaitlist(): Promise<MyWaitlistEntry[]> {
  return api.get<MyWaitlistEntry[]>('/waitlist/me');
}

/** DELETE /waitlist/{id} -> 204. */
export function leaveWaitlist(entryId: string): Promise<void> {
  return api.delete(`/waitlist/${entryId}`);
}

/**
 * POST /waitlist/{id}/accept -> the new CONFIRMED booking. 409 WAITLIST_OFFER_EXPIRED /
 * WAITLIST_TRANSITION_NOT_ALLOWED, 422 BOOKING_STUDENT_CONFLICT (entry stays OFFERED).
 */
export function acceptWaitlistOffer(entryId: string): Promise<Booking> {
  return api.post<Booking>(`/waitlist/${entryId}/accept`);
}

/** POST /waitlist/{id}/decline -> 204. */
export function declineWaitlistOffer(entryId: string): Promise<void> {
  return api.post(`/waitlist/${entryId}/decline`);
}

/** GET /slots/{id}/waitlist (lecturer owner / admin): queue of one slot. */
export function getSlotQueue(slotId: string): Promise<QueueEntry[]> {
  return api.get<QueueEntry[]>(`/slots/${slotId}/waitlist`);
}

/** GET /lecturers/me/slot-waitlist (lecturer): queues grouped by slot. */
export function getLecturerSlotWaitlist(): Promise<SlotWaitlist[]> {
  return api.get<SlotWaitlist[]>('/lecturers/me/slot-waitlist');
}
