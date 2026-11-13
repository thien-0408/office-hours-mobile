import { api } from './client';
import type {
  BookableSlot,
  Lecturer,
  LecturerDetail,
  LecturerListQuery,
  Page,
  SlotDetail,
  SlotRangeQuery,
  SuggestedCategory,
  SuggestedSlot,
} from './domainTypes';

/** GET /lecturers?q&department&dayOfWeek&availableOnly&page&size&sort -> Page<Lecturer>. */
export function listLecturers(
  query: LecturerListQuery = {},
): Promise<Page<Lecturer>> {
  return api.get<Page<Lecturer>>('/lecturers', { query });
}

/** GET /lecturers/{id} (includes officeRoom, null when none). */
export function getLecturer(id: string): Promise<LecturerDetail> {
  return api.get<LecturerDetail>(`/lecturers/${id}`);
}

/**
 * GET /lecturers/{id}/slots?week=YYYY-Www (or from/to). Plain array, not paginated.
 * Without a range the backend uses the current week.
 */
export function getLecturerSlots(
  lecturerId: string,
  range: SlotRangeQuery = {},
): Promise<BookableSlot[]> {
  return api.get<BookableSlot[]>(`/lecturers/${lecturerId}/slots`, {
    query: range,
  });
}

/** GET /slots/{id}. */
export function getSlot(id: string): Promise<SlotDetail> {
  return api.get<SlotDetail>(`/slots/${id}`);
}

/** GET /users/me/suggested-slots?category=&limit= (student). Backend defaults: ALL, 6. */
export function getSuggestedSlots(
  params: { category?: SuggestedCategory; limit?: number } = {},
): Promise<SuggestedSlot[]> {
  return api.get<SuggestedSlot[]>('/users/me/suggested-slots', {
    query: params,
  });
}
