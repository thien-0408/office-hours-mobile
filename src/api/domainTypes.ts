// Domain DTOs, mirrored from the backend records under
// OfficeHours/src/main/java/eiu/officehours/** (source of truth, not web mock types).
// ids are UUID strings. Instants are ISO-8601 UTC strings. LocalTime is "HH:mm", LocalDate "YYYY-MM-DD".

export type Uuid = string;
export type IsoInstant = string;

/** PageResponse<T>: page is 0-based. There are no cursors for list endpoints. */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

/** Spring Pageable query. Backend default size 20, max 100. `sort` is "field,asc|desc". */
export type PageParams = { page?: number; size?: number; sort?: string };

// ---- lecturers ----
export type CampusRoom = {
  id: Uuid;
  buildingCode: string;
  floor: number;
  name: string;
  /** Omitted by the backend when unset. */
  code?: string | null;
  capacity?: number | null;
  xM?: number | null;
  zM?: number | null;
};

/** LecturerResponse (list item, no officeRoom). */
export type Lecturer = {
  id: Uuid;
  slug: string;
  name: string;
  department: string | null;
  photoUrl: string | null;
  blurb: string | null;
};

/** LecturerDetailResponse. */
export type LecturerDetail = Lecturer & { officeRoom: CampusRoom | null };

export type LecturerListQuery = PageParams & {
  q?: string;
  department?: string;
  /** ISO 1 (Mon) .. 7 (Sun). */
  dayOfWeek?: number;
  availableOnly?: boolean;
};

/** BookableSlotResponse. */
export type BookableSlot = {
  id: Uuid;
  lecturerId: Uuid;
  startAt: IsoInstant;
  endAt: IsoInstant;
  /** false: confirmed for someone else, student may join the waitlist. */
  available: boolean;
  /** true: overlaps the student's own PENDING/CONFIRMED booking. */
  conflict: boolean;
};

/** Either `week` ("YYYY-Www") or a from/to range. Without any, the backend uses the current week. */
export type SlotRangeQuery = { week?: string; from?: string; to?: string };

export type SuggestedCategory = 'ALL' | 'CS' | 'MATH' | 'SOON';

/** SuggestedSlotResponse. */
export type SuggestedSlot = {
  id: Uuid;
  lecturerId: Uuid;
  lecturerName: string;
  department: string | null;
  photoUrl: string | null;
  startAt: IsoInstant;
  endAt: IsoInstant;
  dayOfWeek: number;
  dayLabel: string;
  formattedTime: string;
  specialtyTag: string | null;
  blurb: string | null;
  isConflictFree: boolean;
};

export type SlotStatus = 'OPEN' | 'FULL' | 'CLOSED';

/** SlotDetailResponse. meetingUrl only for the owning lecturer and admin. */
export type SlotDetail = {
  id: Uuid;
  lecturerId: Uuid;
  startAt: IsoInstant;
  endAt: IsoInstant;
  status: SlotStatus;
  capacity: number;
  meetingUrl: string | null;
  waitlistCount: number;
};

// ---- bookings ----
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

/** BookingResponse. (The docs mention `participants?`; the DTO has no such field.) */
export type Booking = {
  id: Uuid;
  slotId: Uuid;
  lecturerId: Uuid;
  studentId: Uuid;
  lecturerName: string;
  studentName: string;
  department: string | null;
  topic: string | null;
  startAt: IsoInstant;
  endAt: IsoInstant;
  status: BookingStatus;
  /** Effective link; null for in-person. */
  meetingUrl: string | null;
};

export type BookingListQuery = PageParams & {
  status?: BookingStatus;
  /** Admin only. */
  studentId?: Uuid;
  lecturerId?: Uuid;
  from?: string;
  to?: string;
};

/** POST /bookings. participantEmails must be omitted/empty (group bookings: BE-37, not built). */
export type CreateBookingPayload = { slotId: Uuid; topic?: string };

export type BookingTimelineType =
  | 'CREATED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'NO_SHOW';

/** BookingTimelineResponse (id is a Long). `label` is English, translate by `type`. */
export type BookingTimelineEvent = {
  id: number;
  type: BookingTimelineType;
  label: string;
  at: IsoInstant;
  status: string | null;
  note: string | null;
};

export type MeetingRecord = {
  bookingId: Uuid;
  attended: boolean;
  notes: string | null;
  recordedAt: IsoInstant;
};

export type MeetingRecordPayload = { attended: boolean; notes?: string };

// ---- waitlist ----
export type WaitlistStatus =
  | 'WAITING'
  | 'OFFERED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

/** MyWaitlistResponse. position/offered* are null when not applicable. */
export type MyWaitlistEntry = {
  id: Uuid;
  slotId: Uuid;
  lecturerName: string;
  department: string | null;
  desiredSlotLabel: string;
  position: number | null;
  status: WaitlistStatus;
  offeredStartAt: IsoInstant | null;
  offeredExpiresAt: IsoInstant | null;
};

/** QueueEntryResponse. */
export type QueueEntry = {
  id: Uuid;
  studentId: Uuid;
  studentName: string;
  position: number | null;
  status: WaitlistStatus;
  requestedAt: IsoInstant;
  offerExpiresAt: IsoInstant | null;
};

/** SlotWaitlistResponse. */
export type SlotWaitlist = {
  slotId: Uuid;
  startAt: IsoInstant;
  endAt: IsoInstant;
  slotLabel: string;
  entries: QueueEntry[];
};

// ---- notifications ----
export type NotificationType =
  | 'BOOKING_PENDING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_DECLINED'
  | 'BOOKING_CANCELLED'
  | 'WAITLIST_OFFERED'
  | 'WAITLIST_EXPIRED'
  | 'WAITLIST_ACCEPTED'
  | 'REMINDER';

/** NotificationResponse. Title/body are rendered server-side per Accept-Language. */
export type AppNotification = {
  id: Uuid;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: IsoInstant;
  read: boolean;
  bookingId: Uuid | null;
};

export type NotificationListQuery = PageParams & {
  unreadOnly?: boolean;
  /** Polling fallback: only notifications after this instant. */
  since?: string;
};

// ---- schedule ----
export type ScheduleLocationType = 'LAB' | 'ROOM' | 'ONLINE' | 'OTHER';

/** ScheduleBlockResponse. startTime/endTime are "HH:mm". */
export type ScheduleBlock = {
  id: Uuid;
  title: string;
  dayOfWeek: number;
  /** dd/MM label from the timetable, informational. */
  date: string | null;
  startTime: string;
  endTime: string;
  /** e.g. MANUAL | IMPORTED. */
  source: string;
  subjectCode: string | null;
  subjectName: string | null;
  group: string | null;
  room: string | null;
  lecturerName: string | null;
  locationType: ScheduleLocationType | null;
  colorHue: string | null;
  notes: string | null;
};

/** ScheduleEntryCreationRequest. semesterId defaults to the active semester when omitted. */
export type CreateScheduleEntryPayload = {
  semesterId?: Uuid;
  title: string; // max 200
  dayOfWeek: number; // 1..7
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room: string; // max 100, required (may be empty)
  locationType?: ScheduleLocationType;
  lecturerName?: string; // max 150
};

export type ScheduleImportMode = 'REPLACE' | 'MERGE';

export type ParsedTimetableRow = {
  /** "Thứ 2".."Thứ 7" | "Chủ Nhật". Do not send dayOfWeek. */
  day: string;
  /** null | dd/MM | dd/MM/yyyy */
  date: string | null;
  startTime: string;
  endTime: string;
  subjectCode: string; // max 30, empty allowed
  subjectName: string; // max 150
  group: string; // max 20
  room: string; // max 100
  lecturerName: string; // max 150
};

/** Batch payload. 1..2000 rows, <= 20 sourceFiles, body <= 1 MiB. */
export type ScheduleBatchPayload = {
  semesterId: Uuid;
  mode: ScheduleImportMode;
  sourceFiles: string[];
  rows: ParsedTimetableRow[];
};

export type ImportScheduleResult = {
  importId: Uuid;
  mode: ScheduleImportMode;
  addedCount: number;
  skippedCount: number;
  replacedCount: number;
};

/** One entry of details.errors on 422 SCHEDULE_BATCH_INVALID. rowIndex is 0-based; absent for top-level fields. */
export type BatchRowError = {
  rowIndex?: number;
  field: string;
  message: string;
};

export type ScheduleImport = {
  id: Uuid;
  importedAt: IsoInstant;
  mode: ScheduleImportMode;
  sourceFiles: string[];
  addedCount: number;
  skippedCount: number;
  replacedCount: number;
  status: 'SUCCESS' | 'FAILED';
};

export type AdminScheduleImport = ScheduleImport & {
  uploadedBy: Uuid;
  targetUserId: Uuid;
};

// ---- availability ----
/** RuleResponse. */
export type AvailabilityRule = {
  id: Uuid;
  lecturerId: Uuid;
  semesterId: Uuid;
  dayOfWeek: number;
  startTime: string; // HH:mm
  endTime: string;
  slotLengthMinutes: number;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string | null;
  meetingUrl: string | null;
  active: boolean;
};

/** AvailabilityRuleRequest. POST needs all but effectiveTo/meetingUrl; PATCH is partial (presence-tracked). */
export type AvailabilityRulePayload = {
  semesterId: Uuid;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  meetingUrl?: string | null;
};
export type AvailabilityRulePatch = Partial<AvailabilityRulePayload>;

export type AvailabilityExceptionType = 'BLOCK' | 'ADD';

/** ExceptionResponse. reason only for owner/admin. */
export type AvailabilityException = {
  id: Uuid;
  lecturerId: Uuid;
  date: string;
  type: AvailabilityExceptionType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  meetingUrl: string | null;
};

export type AvailabilityExceptionPayload = {
  date: string;
  type: AvailabilityExceptionType;
  startTime?: string;
  endTime?: string;
  reason?: string;
  /** Only meaningful for ADD. */
  meetingUrl?: string | null;
};

/** SemesterResponse. */
export type Semester = {
  id: Uuid;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
};

// ---- chat (REST part) ----
export type ChatMessageType = 'TEXT' | 'SYSTEM';

/** ChatMessageResponse. SYSTEM: senderId null, body is a translation key (booking.confirmed ...). */
export type ChatMessage = {
  id: number;
  bookingId: Uuid;
  senderId: Uuid | null;
  type: ChatMessageType;
  body: string;
  clientMessageId: Uuid | null;
  createdAt: IsoInstant;
  readAt: IsoInstant | null;
};

/** before/after are message ids (mutually exclusive). limit 1..100, default 50. */
export type ChatHistoryQuery = {
  before?: number;
  after?: number;
  limit?: number;
};

// ---- admin ----
/** AdminUserResponse. */
export type AdminUser = {
  id: Uuid;
  fullName: string;
  email: string;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  department: string | null;
  active: boolean;
};

export type AdminUserListQuery = PageParams & {
  role?: 'STUDENT' | 'LECTURER' | 'ADMIN';
  department?: string;
  q?: string;
};

/** AdminUpdateUserRequest: omitted key = keep, null department/officeRoomId = clear. */
export type AdminUpdateUserPayload = {
  role?: 'STUDENT' | 'LECTURER' | 'ADMIN';
  department?: string | null;
  officeRoomId?: Uuid | null;
};

// ---- realtime ----
export type FirebaseTokenResponse = { firebaseToken: string };
