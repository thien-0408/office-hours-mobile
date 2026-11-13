import { api } from './client';
import { ApiError } from './errors';
import { ERR } from './errorCodes';
import type {
  AdminScheduleImport,
  BatchRowError,
  CreateScheduleEntryPayload,
  ImportScheduleResult,
  Page,
  PageParams,
  ScheduleBatchPayload,
  ScheduleBlock,
  ScheduleImport,
} from './domainTypes';

/** GET /users/me/schedule-entries: active-semester busy blocks, plain array. */
export function listMyScheduleEntries(): Promise<ScheduleBlock[]> {
  return api.get<ScheduleBlock[]>('/users/me/schedule-entries');
}

/** GET /users/{userId}/schedule-entries (owner / admin). */
export function listScheduleEntriesOf(
  userId: string,
): Promise<ScheduleBlock[]> {
  return api.get<ScheduleBlock[]>(`/users/${userId}/schedule-entries`);
}

/** POST /users/me/schedule-entries -> 201 block (source MANUAL). 409 SCHEDULE_ENTRY_DUPLICATE, 422 SCHEDULE_ENTRY_INVALID. */
export function addMyScheduleEntry(
  payload: CreateScheduleEntryPayload,
): Promise<ScheduleBlock> {
  return api.post<ScheduleBlock>('/users/me/schedule-entries', payload);
}

/** POST /users/{userId}/schedule-entries (admin). */
export function addScheduleEntryFor(
  userId: string,
  payload: CreateScheduleEntryPayload,
): Promise<ScheduleBlock> {
  return api.post<ScheduleBlock>(`/users/${userId}/schedule-entries`, payload);
}

/** DELETE /schedule-entries/{id} -> 204. */
export function deleteScheduleEntry(id: string): Promise<void> {
  return api.delete(`/schedule-entries/${id}`);
}

/**
 * POST /users/me/schedule-entries/batch -> 201. Whole batch is validated first; any bad row gives
 * 422 SCHEDULE_BATCH_INVALID with details.errors[{rowIndex?, field, message}] (see batchRowErrors).
 * 413 SCHEDULE_BATCH_TOO_LARGE above 1 MiB / 2000 rows.
 */
export function importMySchedule(
  payload: ScheduleBatchPayload,
): Promise<ImportScheduleResult> {
  return api.post<ImportScheduleResult>(
    '/users/me/schedule-entries/batch',
    payload,
  );
}

/** POST /users/{userId}/schedule-entries/batch (admin, on behalf of a user). */
export function importScheduleFor(
  userId: string,
  payload: ScheduleBatchPayload,
): Promise<ImportScheduleResult> {
  return api.post<ImportScheduleResult>(
    `/users/${userId}/schedule-entries/batch`,
    payload,
  );
}

/** GET /users/me/schedule-imports: own history, plain array. */
export function listMyScheduleImports(): Promise<ScheduleImport[]> {
  return api.get<ScheduleImport[]>('/users/me/schedule-imports');
}

/** GET /schedule-imports (admin): paginated, default sort createdAt desc. */
export function listAllScheduleImports(
  query: PageParams = {},
): Promise<Page<AdminScheduleImport>> {
  return api.get<Page<AdminScheduleImport>>('/schedule-imports', { query });
}

/**
 * Row errors of a failed batch. Returns [] unless `e` is a 422 SCHEDULE_BATCH_INVALID.
 * (ApiError.fieldErrors drops rowIndex, so read details directly.)
 */
export function batchRowErrors(e: unknown): BatchRowError[] {
  if (!(e instanceof ApiError) || !e.is(422, ERR.SCHEDULE_BATCH_INVALID)) {
    return [];
  }
  const raw = (e.details as { errors?: unknown } | undefined)?.errors;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: BatchRowError[] = [];
  for (const r of raw) {
    if (typeof r !== 'object' || r === null) {
      continue;
    }
    const o = r as Record<string, unknown>;
    out.push({
      rowIndex: typeof o.rowIndex === 'number' ? o.rowIndex : undefined,
      field: typeof o.field === 'string' ? o.field : '',
      message: typeof o.message === 'string' ? o.message : '',
    });
  }
  return out;
}
