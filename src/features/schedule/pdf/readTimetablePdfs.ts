// Picked PDF files -> merged timetable rows (lecture + lab PDFs end up in one rows[] like the web).
import type { ParsedTimetableRow } from '../../../api/domainTypes';
import { extractTextItems } from '../../../../modules/pdf-text';
import { parseTimetableItems, type TextItem } from './parseTimetablePdf';

export interface PickedPdf {
  uri: string;
  name: string;
  mimeType?: string | null;
}

export type TimetablePdfErrorKind = 'notPdf' | 'unreadable' | 'notTemplate';

export class TimetablePdfError extends Error {
  readonly kind: TimetablePdfErrorKind;
  readonly fileName: string;

  constructor(kind: TimetablePdfErrorKind, fileName: string) {
    super(`${kind}: ${fileName}`);
    this.name = 'TimetablePdfError';
    this.kind = kind;
    this.fileName = fileName;
  }
}

export interface TimetablePdfResult {
  rows: ParsedTimetableRow[];
  /** Original file names, sent to the backend as `sourceFiles` (audit only). */
  sourceFiles: string[];
}

export const MAX_SOURCE_FILES = 20; // backend: <= 20 names
const MAX_SOURCE_NAME = 255;

export function isPdf(file: PickedPdf): boolean {
  return (
    file.mimeType === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/** Reads every picked PDF. Throws TimetablePdfError for the first file that is not usable. */
export async function readTimetablePdfs(
  files: PickedPdf[],
): Promise<TimetablePdfResult> {
  const rows: ParsedTimetableRow[] = [];
  const sourceFiles: string[] = [];

  for (const file of files) {
    if (!isPdf(file)) {
      throw new TimetablePdfError('notPdf', file.name);
    }
    let items: TextItem[];
    try {
      const { pages } = await extractTextItems(file.uri);
      items = pages.flatMap(p => p.items);
    } catch {
      throw new TimetablePdfError('unreadable', file.name);
    }
    const parsed = parseTimetableItems(items);
    if (parsed.dayColumns === 0 || parsed.rows.length === 0) {
      throw new TimetablePdfError('notTemplate', file.name);
    }
    rows.push(...parsed.rows);
    sourceFiles.push([...file.name].slice(0, MAX_SOURCE_NAME).join(''));
  }
  return { rows, sourceFiles: sourceFiles.slice(0, MAX_SOURCE_FILES) };
}

/** Vietnamese message for a failed pick/read. Never shows raw exception text. */
export function timetablePdfErrorText(e: unknown): string {
  if (e instanceof TimetablePdfError) {
    switch (e.kind) {
      case 'notPdf':
        return `"${e.fileName}" không phải file PDF. Chỉ nhận file PDF thời khóa biểu của phòng Đào tạo.`;
      case 'notTemplate':
        return `"${e.fileName}" không đúng mẫu thời khóa biểu của phòng Đào tạo (không thấy cột thứ hoặc môn học nào).`;
      case 'unreadable':
        return `Không đọc được "${e.fileName}". File có thể bị hỏng hoặc đặt mật khẩu.`;
    }
  }
  return 'Không đọc được file PDF. Thử lại sau.';
}
