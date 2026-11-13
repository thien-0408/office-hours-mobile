export type FieldError = {
  field: string;
  /** Validation key such as FIELD_REQUIRED; absent for some single business errors. */
  error?: string;
  message: string;
};

/** Error body: { status, error, message, path, timestamp, details? } */
export type ApiErrorBody = {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
  details?: unknown;
};

/**
 * UI code must branch on `status` + `error`, never on `message`
 * (message is English text meant for logs/developers).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly fieldErrors: FieldError[];
  readonly retryAfterSeconds?: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(init: {
    status: number;
    error: string;
    message: string;
    fieldErrors?: FieldError[];
    retryAfterSeconds?: number;
    requestId?: string;
    details?: unknown;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.error = init.error;
    this.fieldErrors = init.fieldErrors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds;
    this.requestId = init.requestId;
    this.details = init.details;
  }

  is(status: number, error?: string): boolean {
    return (
      this.status === status && (error === undefined || this.error === error)
    );
  }
}

export class NetworkError extends Error {
  readonly timedOut: boolean;
  constructor(message: string, timedOut = false) {
    super(message);
    this.name = 'NetworkError';
    this.timedOut = timedOut;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Reads details.errors[].
 * - VALIDATION_FAILED: entries are { field, error, message }.
 * - MULTIPLE_ERRORS: entries are { error, message, context? }. When the source
 *   exception was raised for a field, the field sits at context.errors[0].field.
 * - A single business error raised for a field (e.g. EMAIL_ALREADY_EXISTS) has
 *   details.errors[{ field, message }] with no `error` key.
 * Entries without any resolvable field are skipped.
 */
export function parseFieldErrors(details: unknown): FieldError[] {
  if (!isRecord(details) || !Array.isArray(details.errors)) {
    return [];
  }
  const out: FieldError[] = [];
  for (const entry of details.errors) {
    if (!isRecord(entry)) {
      continue;
    }
    let field = typeof entry.field === 'string' ? entry.field : undefined;
    if (
      !field &&
      isRecord(entry.context) &&
      Array.isArray(entry.context.errors)
    ) {
      const inner = entry.context.errors.find(
        (e: unknown) => isRecord(e) && typeof e.field === 'string',
      ) as { field: string } | undefined;
      field = inner?.field;
    }
    if (!field) {
      continue;
    }
    out.push({
      field,
      error: typeof entry.error === 'string' ? entry.error : undefined,
      message: typeof entry.message === 'string' ? entry.message : '',
    });
  }
  return out;
}

export function buildApiError(
  status: number,
  body: ApiErrorBody | null,
  headers: { get(name: string): string | null },
): ApiError {
  const error = typeof body?.error === 'string' ? body.error : 'UNKNOWN_ERROR';
  let retryAfterSeconds: number | undefined;
  if (status === 429) {
    const raw = headers.get('Retry-After');
    const n = raw === null ? NaN : Number(raw);
    if (Number.isFinite(n) && n >= 0) {
      retryAfterSeconds = n;
    }
  }
  return new ApiError({
    status,
    error,
    message:
      typeof body?.message === 'string' ? body.message : `HTTP ${status}`,
    fieldErrors: parseFieldErrors(body?.details),
    retryAfterSeconds,
    requestId: headers.get('X-Request-Id') ?? undefined,
    details: body?.details,
  });
}
