// Machine error keys the UI must branch on (with the HTTP status). Taken from the backend
// enums under eiu/officehours/**/error and **/spi (BookingError, AllocationError, ...).
// Compare with `ApiError.is(status, ERR.X)`; never match on `message`.

export const ERR = {
  // ---- booking (409 unless noted) ----
  BOOKING_ALREADY_REQUESTED: 'BOOKING_ALREADY_REQUESTED',
  BOOKING_SLOT_UNAVAILABLE: 'BOOKING_SLOT_UNAVAILABLE', // details.waitlistAvailable
  BOOKING_SLOT_TAKEN: 'BOOKING_SLOT_TAKEN', // details.waitlistAvailable (true while held for an offer)
  BOOKING_STUDENT_CONFLICT: 'BOOKING_STUDENT_CONFLICT', // 422, details.conflictType SCHEDULE|BOOKING
  BOOKING_SEMESTER_UNAVAILABLE: 'BOOKING_SEMESTER_UNAVAILABLE',
  BOOKING_RESCHEDULE_SLOT_INVALID: 'BOOKING_RESCHEDULE_SLOT_INVALID', // 422
  BOOKING_TRANSITION_NOT_ALLOWED: 'BOOKING_TRANSITION_NOT_ALLOWED',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND', // 404
  SLOT_NOT_FOUND: 'SLOT_NOT_FOUND', // 404
  CANCELLATION_NOTICE_PASSED: 'CANCELLATION_NOTICE_PASSED', // details.noticeHours
  SLOT_ALREADY_CONFIRMED: 'SLOT_ALREADY_CONFIRMED',
  SLOT_HELD_FOR_WAITLIST: 'SLOT_HELD_FOR_WAITLIST',

  // ---- waitlist ----
  WAITLIST_NOT_NEEDED: 'WAITLIST_NOT_NEEDED',
  WAITLIST_ALREADY_JOINED: 'WAITLIST_ALREADY_JOINED',
  WAITLIST_ALREADY_FULFILLED: 'WAITLIST_ALREADY_FULFILLED',
  WAITLIST_ENTRY_NOT_FOUND: 'WAITLIST_ENTRY_NOT_FOUND', // 404
  WAITLIST_OFFER_EXPIRED: 'WAITLIST_OFFER_EXPIRED',
  WAITLIST_TRANSITION_NOT_ALLOWED: 'WAITLIST_TRANSITION_NOT_ALLOWED',

  // ---- schedule ----
  SCHEDULE_ENTRY_NOT_FOUND: 'SCHEDULE_ENTRY_NOT_FOUND', // 404
  SCHEDULE_ENTRY_DUPLICATE: 'SCHEDULE_ENTRY_DUPLICATE', // 409
  SCHEDULE_ENTRY_INVALID: 'SCHEDULE_ENTRY_INVALID', // 422
  SCHEDULE_BATCH_INVALID: 'SCHEDULE_BATCH_INVALID', // 422, details.errors[{rowIndex?, field, message}]
  SCHEDULE_BATCH_TOO_LARGE: 'SCHEDULE_BATCH_TOO_LARGE', // 413
  SCHEDULE_TARGET_INVALID: 'SCHEDULE_TARGET_INVALID', // 422
  SCHEDULE_IMPORT_FAILED: 'SCHEDULE_IMPORT_FAILED', // 500

  // ---- availability ----
  AVAILABILITY_RULE_NOT_FOUND: 'AVAILABILITY_RULE_NOT_FOUND',
  AVAILABILITY_RULE_OVERLAP: 'AVAILABILITY_RULE_OVERLAP', // 409
  AVAILABILITY_EXCEPTION_NOT_FOUND: 'AVAILABILITY_EXCEPTION_NOT_FOUND',
  AVAILABILITY_ADD_CONFLICT: 'AVAILABILITY_ADD_CONFLICT', // 409
  AVAILABILITY_LECTURER_NOT_FOUND: 'AVAILABILITY_LECTURER_NOT_FOUND',

  // ---- semester / campus / user ----
  ACTIVE_SEMESTER_NOT_FOUND: 'ACTIVE_SEMESTER_NOT_FOUND', // 404
  SEMESTER_NOT_FOUND: 'SEMESTER_NOT_FOUND',
  CAMPUS_ROOM_NOT_FOUND: 'CAMPUS_ROOM_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CANNOT_MODIFY_SELF: 'CANNOT_MODIFY_SELF', // 400
  LAST_ADMIN_REQUIRED: 'LAST_ADMIN_REQUIRED', // 409

  // ---- chat (REST + STOMP chat-errors queue) ----
  CHAT_NOT_OPEN: 'CHAT_NOT_OPEN',
  CHAT_RATE_LIMITED: 'CHAT_RATE_LIMITED', // 429
  CHAT_CLIENT_MESSAGE_ID_REUSED: 'CHAT_CLIENT_MESSAGE_ID_REUSED',

  // ---- realtime ----
  REALTIME_DISABLED: 'REALTIME_DISABLED', // 503
  REALTIME_UPSTREAM_FAILED: 'REALTIME_UPSTREAM_FAILED', // 502

  // ---- generic ----
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MULTIPLE_ERRORS: 'MULTIPLE_ERRORS',
  MALFORMED_REQUEST: 'MALFORMED_REQUEST',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const;

export type ErrorCode = (typeof ERR)[keyof typeof ERR];

function detailField(details: unknown, key: string): unknown {
  return typeof details === 'object' && details !== null
    ? (details as Record<string, unknown>)[key]
    : undefined;
}

/** details.waitlistAvailable of a 409 booking race (BOOKING_SLOT_UNAVAILABLE / _TAKEN). */
export function waitlistAvailableOf(details: unknown): boolean {
  return detailField(details, 'waitlistAvailable') === true;
}

/** details.noticeHours of CANCELLATION_NOTICE_PASSED. */
export function noticeHoursOf(details: unknown): number | undefined {
  const v = detailField(details, 'noticeHours');
  return typeof v === 'number' ? v : undefined;
}

/** details.conflictType ('SCHEDULE' | 'BOOKING') of BOOKING_STUDENT_CONFLICT. */
export function conflictTypeOf(
  details: unknown,
): 'SCHEDULE' | 'BOOKING' | undefined {
  const v = detailField(details, 'conflictType');
  return v === 'SCHEDULE' || v === 'BOOKING' ? v : undefined;
}
