// Draft rows of the review screen: validation, mapping to the batch DTO and 422 row errors.
// Pure (no React Native imports). Day/time rules are small duplicates of scheduleLogic.ts on
// purpose: that file is feature-local and owned by another task.

import { ApiError } from '../../../api/errors';
import { ERR } from '../../../api/errorCodes';
import { ERROR_TEXT, errorText } from '../../../api/errorText';
import type {
  BatchRowError,
  ParsedTimetableRow,
  ScheduleBatchPayload,
  ScheduleImportMode,
} from '../../../api/domainTypes';
import { batchRowErrors } from '../../../api/schedule';
import type { ParsedScanRow } from './parseTimetable';

export const MAX_ROWS = 2000; // backend: 1..2000 rows
export const MAX_TITLE = 150; // subjectName
export const MAX_ROOM = 100;
export const SOURCE_FILE_NAME = 'camera-scan';

/** Backend day strings, index = ISO day (1..7). `day` must be exactly one of these. */
export const DAY_LABELS = [
  '',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
] as const;

export type RowField = 'dayOfWeek' | 'startTime' | 'endTime' | 'title' | 'room';
export type RowErrors = Partial<Record<RowField, string>>;

export interface ScanRow {
  /** Stable key for React lists. */
  key: string;
  /** 1..7, or 0 when unknown. */
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  room: string;
  /** 'low': the OCR was not sure. Becomes 'high' once the user edits the row. */
  confidence: 'high' | 'low';
}

let seq = 0;
export function newRowKey(): string {
  seq += 1;
  return `scan-row-${seq}`;
}

export function fromParsed(rows: ParsedScanRow[]): ScanRow[] {
  return rows.map(r => ({
    key: newRowKey(),
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime,
    endTime: r.endTime,
    title: r.title,
    room: r.room ?? '',
    confidence: r.confidence,
  }));
}

/** A blank row for "Thêm dòng". Confidence 'high': nothing was guessed. */
export function emptyRow(dayOfWeek = 0): ScanRow {
  return {
    key: newRowKey(),
    dayOfWeek,
    startTime: '',
    endTime: '',
    title: '',
    room: '',
    confidence: 'high',
  };
}

/**
 * "7:30" / "07:30" / "0730" / "7h30" -> "07:30". Returns null when it is not a valid
 * 24-hour time. The backend only accepts two-digit HH:mm.
 */
export function normalizeTime(input: string): string | null {
  const s = (input ?? '').trim();
  let m = /^(\d{1,2})\s*[:h.]\s*(\d{2})$/i.exec(s);
  if (!m) {
    m = /^(\d{1,2})(\d{2})$/.exec(s);
  }
  if (!m) {
    return null;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Local validation, mirroring ScheduleBatchMapper. Empty object = row is valid. */
export function validateRow(row: ScanRow): RowErrors {
  const errors: RowErrors = {};
  if (!(row.dayOfWeek >= 1 && row.dayOfWeek <= 7)) {
    errors.dayOfWeek = 'Chọn thứ trong tuần.';
  }
  const start = normalizeTime(row.startTime);
  const end = normalizeTime(row.endTime);
  if (!start) {
    errors.startTime = 'Giờ bắt đầu chưa đúng (HH:mm).';
  }
  if (!end) {
    errors.endTime = 'Giờ kết thúc chưa đúng (HH:mm).';
  } else if (start && minutes(end) <= minutes(start)) {
    errors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
  }
  const title = row.title.trim();
  if (!title) {
    errors.title = 'Nhập tên môn.';
  } else if ([...title].length > MAX_TITLE) {
    errors.title = `Tối đa ${MAX_TITLE} ký tự.`;
  }
  if ([...row.room.trim()].length > MAX_ROOM) {
    errors.room = `Tối đa ${MAX_ROOM} ký tự.`;
  }
  return errors;
}

export function countInvalid(rows: ScanRow[]): number {
  return rows.filter(r => Object.keys(validateRow(r)).length > 0).length;
}

export function countLow(rows: ScanRow[]): number {
  return rows.filter(r => r.confidence === 'low').length;
}

export type SubmitBlock = 'empty' | 'tooMany' | 'invalid' | null;

/** Why the Save button is disabled (null = can submit). */
export function submitBlock(rows: ScanRow[]): SubmitBlock {
  if (rows.length === 0) {
    return 'empty';
  }
  if (rows.length > MAX_ROWS) {
    return 'tooMany';
  }
  if (countInvalid(rows) > 0) {
    return 'invalid';
  }
  return null;
}

/** Row -> exact ParsedTimetableRow DTO (rows must already be valid). */
export function toDtoRow(row: ScanRow): ParsedTimetableRow {
  return {
    day: DAY_LABELS[row.dayOfWeek],
    date: null,
    startTime: normalizeTime(row.startTime) ?? row.startTime,
    endTime: normalizeTime(row.endTime) ?? row.endTime,
    subjectCode: '',
    subjectName: row.title.trim(),
    group: '',
    room: row.room.trim(),
    lecturerName: '',
  };
}

/**
 * Payload for POST /users/me/schedule-entries/batch. Row order is kept, so the backend's
 * zero-based `rowIndex` is also the index into the review list.
 */
export function toBatchPayload(
  rows: ScanRow[],
  semesterId: string,
  mode: ScheduleImportMode,
): ScheduleBatchPayload {
  return {
    semesterId,
    mode,
    sourceFiles: [SOURCE_FILE_NAME],
    rows: rows.map(toDtoRow),
  };
}

// ---- 422 SCHEDULE_BATCH_INVALID -> cards ----

/** Backend field name -> card field. */
const SERVER_FIELD: Record<string, RowField> = {
  day: 'dayOfWeek',
  startTime: 'startTime',
  endTime: 'endTime',
  subjectName: 'title',
  subjectCode: 'title',
  room: 'room',
};

const SERVER_FIELD_TEXT: Record<RowField, string> = {
  dayOfWeek: 'Thứ trong tuần chưa hợp lệ.',
  startTime: 'Giờ bắt đầu chưa hợp lệ (HH:mm).',
  endTime: 'Giờ kết thúc chưa hợp lệ hoặc không sau giờ bắt đầu.',
  title: 'Tên môn chưa hợp lệ.',
  room: 'Phòng chưa hợp lệ.',
};

export interface MappedBatchErrors {
  /** rowIndex -> card field -> Vietnamese text. */
  byRow: Record<number, RowErrors>;
  /** Errors not tied to a row (semester, mode, row count...). */
  general: string[];
  /** Smallest rowIndex that has an error, or null. */
  firstRowIndex: number | null;
}

/**
 * Map details.errors[] back to review cards. Text comes from the field name, never from the
 * (English) backend message. Out-of-range or unknown fields fall back to a generic row error.
 */
export function mapBatchErrors(
  errors: BatchRowError[],
  rowCount: number,
): MappedBatchErrors {
  const byRow: Record<number, RowErrors> = {};
  const general: string[] = [];
  let first: number | null = null;
  for (const e of errors) {
    if (typeof e.rowIndex === 'number' && e.rowIndex >= 0 && e.rowIndex < rowCount) {
      const field = SERVER_FIELD[e.field] ?? 'title';
      const rowErrs = (byRow[e.rowIndex] ??= {});
      rowErrs[field] ??=
        SERVER_FIELD[e.field] === undefined
          ? ERROR_TEXT.invalidField
          : SERVER_FIELD_TEXT[field];
      first = first === null ? e.rowIndex : Math.min(first, e.rowIndex);
    } else if (e.field === 'rows') {
      general.push('Cần từ 1 đến 2.000 dòng.');
    } else if (e.field === 'semesterId') {
      general.push('Chưa xác định được học kỳ. Thử lại sau.');
    } else {
      general.push(ERROR_TEXT.invalidField);
    }
  }
  return { byRow, general: [...new Set(general)], firstRowIndex: first };
}

/** One-line text for a failed submit. Row details go to the cards via mapBatchErrors. */
export function submitErrorText(e: unknown, rowCount: number): string {
  if (e instanceof ApiError) {
    if (e.is(413, ERR.SCHEDULE_BATCH_TOO_LARGE)) {
      return 'Dữ liệu quá lớn (tối đa 2.000 dòng).';
    }
    const mapped = mapBatchErrors(batchRowErrors(e), rowCount);
    const n = Object.keys(mapped.byRow).length;
    if (n > 0) {
      return `Máy chủ báo ${n} dòng chưa hợp lệ. Sửa các dòng được đánh dấu rồi lưu lại.`;
    }
    if (mapped.general.length > 0) {
      return mapped.general[0];
    }
  }
  return errorText(e);
}
