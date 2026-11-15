import { extractTextItems } from '../modules/pdf-text';
import {
  parseTimetableItems,
  type TextItem,
} from '../src/features/schedule/pdf/parseTimetablePdf';
import {
  isPdf,
  readTimetablePdfs,
  timetablePdfErrorText,
  TimetablePdfError,
} from '../src/features/schedule/pdf/readTimetablePdfs';
import {
  fromTimetableRows,
  toBatchPayload,
} from '../src/features/schedule/scan/rows';
import fixture from './fixtures/TimeTable.items.json';

// Items of __tests__/fixtures/TimeTable.pdf, produced once by scripts/extract-pdf-fixture.mjs
// (pdfjs-dist) in the native module's convention: PDF user space, y up.
const items: TextItem[] = fixture.pages.flatMap(p => p.items);

const mockExtract = extractTextItems as jest.Mock;

describe('parseTimetableItems on the AAO template', () => {
  const result = parseTimetableItems(items);

  it('reads the header metadata and the 7 day columns', () => {
    expect(result.dayColumns).toBe(7);
    // Same regex as the web: informational only (it also over-captures the text after the name).
    expect(result.metadata.name).toMatch(/^Nguyễn Đình Thiện/);
    expect(result.metadata.semester).toMatch(/^Học kỳ 4 - Năm học 2025 - 2026/);
  });

  it('finds the known rows', () => {
    expect(result.rows).toHaveLength(7);
    expect(
      result.rows.map(
        r => `${r.day} ${r.startTime}-${r.endTime} ${r.subjectCode}`,
      ),
    ).toEqual([
      'Thứ 2 09:30-11:30 CSW 437',
      'Thứ 2 16:30-18:30 CSW 430',
      'Thứ 4 09:30-11:30 CSW 437',
      'Thứ 4 16:30-18:30 CSW 430',
      'Thứ 5 07:30-11:30 CSW 430',
      'Thứ 7 07:30-11:30 CSE 422',
      'Thứ 7 12:30-16:30 CSW 437',
    ]);
    expect(result.rows[1]).toEqual({
      day: 'Thứ 2',
      date: '03/08',
      startTime: '16:30',
      endTime: '18:30',
      subjectCode: 'CSW 430',
      subjectName: 'Phát triển ứng dụng di động',
      group: '01',
      room: 'ONLINE 3',
      lecturerName: 'Trần Văn Tài',
    });
    expect(result.rows[5]).toEqual({
      day: 'Thứ 7',
      date: '08/08',
      startTime: '07:30',
      endTime: '11:30',
      subjectCode: 'CSE 422',
      subjectName: 'Kỹ năng lập trình chuyên nghiệp',
      group: 'E',
      room: 'LAB403.B08',
      lecturerName: 'Rohit Kumar Kasera',
    });
  });

  it('every row is shaped for the batch DTO', () => {
    for (const r of result.rows) {
      expect(r.startTime).toMatch(/^\d{1,2}:\d{2}$/);
      expect(r.endTime).toMatch(/^\d{1,2}:\d{2}$/);
      expect(r.day).toMatch(/^(Thứ [2-7]|Chủ Nhật)$/);
    }
  });

  it('sorts Thứ 2 -> Chủ Nhật, then by start time', () => {
    const order = [
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'Chủ Nhật',
    ];
    const keys = result.rows.map(r => order.indexOf(r.day));
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });

  it('does not leak the time ruler into Thứ 2', () => {
    const monday = result.rows.filter(r => r.day === 'Thứ 2');
    for (const r of monday) {
      expect(r.subjectName).not.toMatch(/^\d{1,2}:\d{2}/);
    }
  });

  it('returns no rows and no columns for a non-template document', () => {
    const other = parseTimetableItems([
      { text: 'Hóa đơn tiền điện', x: 10, y: 800 },
      { text: 'Tổng cộng: 120.000', x: 10, y: 780 },
    ]);
    expect(other.dayColumns).toBe(0);
    expect(other.rows).toEqual([]);
  });
});

describe('readTimetablePdfs', () => {
  beforeEach(() => mockExtract.mockReset());

  it('merges several PDFs into one rows[] and keeps the file names', async () => {
    mockExtract.mockResolvedValue({ pages: fixture.pages });
    const out = await readTimetablePdfs([
      { uri: 'file:///a.pdf', name: 'lt.pdf', mimeType: 'application/pdf' },
      { uri: 'file:///b.pdf', name: 'th.pdf', mimeType: 'application/pdf' },
    ]);
    const single = parseTimetableItems(items).rows.length;
    expect(out.rows).toHaveLength(single * 2);
    expect(out.sourceFiles).toEqual(['lt.pdf', 'th.pdf']);
    const payload = toBatchPayload(
      fromTimetableRows(out.rows),
      'sem-1',
      'REPLACE',
      out.sourceFiles,
    );
    expect(payload.sourceFiles).toEqual(['lt.pdf', 'th.pdf']);
    expect(payload.rows[0]).toEqual(out.rows[0]);
  });

  it('rejects a non-PDF without reading it', async () => {
    await expect(
      readTimetablePdfs([
        { uri: 'file:///x.jpg', name: 'x.jpg', mimeType: 'image/jpeg' },
      ]),
    ).rejects.toMatchObject({ kind: 'notPdf', fileName: 'x.jpg' });
    expect(mockExtract).not.toHaveBeenCalled();
  });

  it('rejects a PDF that is not the template', async () => {
    mockExtract.mockResolvedValue({
      pages: [{ width: 1, height: 1, items: [{ text: 'Hello', x: 1, y: 1 }] }],
    });
    await expect(
      readTimetablePdfs([
        { uri: 'file:///h.pdf', name: 'h.pdf', mimeType: 'application/pdf' },
      ]),
    ).rejects.toMatchObject({ kind: 'notTemplate' });
  });

  it('reports an unreadable PDF', async () => {
    mockExtract.mockRejectedValue(new Error('encrypted'));
    await expect(
      readTimetablePdfs([{ uri: 'file:///h.pdf', name: 'h.pdf' }]),
    ).rejects.toMatchObject({ kind: 'unreadable' });
  });
});

describe('helpers', () => {
  it('isPdf checks mime type or extension', () => {
    expect(isPdf({ uri: 'u', name: 'a.PDF' })).toBe(true);
    expect(isPdf({ uri: 'u', name: 'a', mimeType: 'application/pdf' })).toBe(
      true,
    );
    expect(isPdf({ uri: 'u', name: 'a.png', mimeType: 'image/png' })).toBe(
      false,
    );
  });

  it('error text is Vietnamese and never echoes raw exceptions', () => {
    expect(
      timetablePdfErrorText(new TimetablePdfError('notPdf', 'a.png')),
    ).toContain('PDF');
    expect(
      timetablePdfErrorText(new TimetablePdfError('notTemplate', 'a.pdf')),
    ).toContain('mẫu');
    expect(timetablePdfErrorText(new Error('boom'))).not.toContain('boom');
  });
});
