import { api } from './client';
import type {
  AvailabilityException,
  AvailabilityExceptionPayload,
  AvailabilityRule,
  AvailabilityRulePatch,
  AvailabilityRulePayload,
  Semester,
} from './domainTypes';

/** GET /lecturers/{id}/availability-rules?semesterId (defaults to the active semester). */
export function listAvailabilityRules(
  lecturerId: string,
  semesterId?: string,
): Promise<AvailabilityRule[]> {
  return api.get<AvailabilityRule[]>(
    `/lecturers/${lecturerId}/availability-rules`,
    { query: { semesterId } },
  );
}

/** POST /lecturers/{id}/availability-rules -> 201. 409 AVAILABILITY_RULE_OVERLAP. */
export function createAvailabilityRule(
  lecturerId: string,
  payload: AvailabilityRulePayload,
): Promise<AvailabilityRule> {
  return api.post<AvailabilityRule>(
    `/lecturers/${lecturerId}/availability-rules`,
    payload,
  );
}

/** PATCH /availability-rules/{id}: only the keys you send are changed. */
export function updateAvailabilityRule(
  id: string,
  patch: AvailabilityRulePatch,
): Promise<AvailabilityRule> {
  return api.patch<AvailabilityRule>(`/availability-rules/${id}`, patch);
}

/** DELETE /availability-rules/{id} -> 204. */
export function deleteAvailabilityRule(id: string): Promise<void> {
  return api.delete(`/availability-rules/${id}`);
}

/** GET /lecturers/{id}/availability-exceptions. */
export function listAvailabilityExceptions(
  lecturerId: string,
): Promise<AvailabilityException[]> {
  return api.get<AvailabilityException[]>(
    `/lecturers/${lecturerId}/availability-exceptions`,
  );
}

/** POST /lecturers/{id}/availability-exceptions -> 201. 409 AVAILABILITY_ADD_CONFLICT for an ADD that makes no slot. */
export function createAvailabilityException(
  lecturerId: string,
  payload: AvailabilityExceptionPayload,
): Promise<AvailabilityException> {
  return api.post<AvailabilityException>(
    `/lecturers/${lecturerId}/availability-exceptions`,
    payload,
  );
}

/** DELETE /availability-exceptions/{id} -> 204. */
export function deleteAvailabilityException(id: string): Promise<void> {
  return api.delete(`/availability-exceptions/${id}`);
}

/** GET /semesters/active. 404 ACTIVE_SEMESTER_NOT_FOUND when none. */
export function getActiveSemester(): Promise<Semester> {
  return api.get<Semester>('/semesters/active');
}

/** GET /semesters: plain array. */
export function listSemesters(): Promise<Semester[]> {
  return api.get<Semester[]>('/semesters');
}
