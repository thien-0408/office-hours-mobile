import { ApiError, NetworkError } from '../src/api/errors';
import { ERR } from '../src/api/errorCodes';
import {
  countInvalid,
  countLow,
  DAY_LABELS,
  emptyRow,
  fromParsed,
  mapBatchErrors,
  MAX_ROWS,
  normalizeTime,
  submitBlock,
  submitErrorText,
  toBatchPayload,
  toDtoRow,
  validateRow,
  type ScanRow,
} from '../src/features/schedule/scan/rows';

const good = (over: Partial<ScanRow> = {}): ScanRow => ({
  key: 'k',
  dayOfWeek: 2,
  startTime: '07:30',
  endTime: '09:30',
  title: 'Lập trình Web',
  room: 'A1.203',
  confidence: 'high',
  ...over,
});

function batch422(errors: unknown[]) {
  return new ApiError({
    status: 422,
    error: ERR.SCHEDULE_BATCH_INVALID,
    message: 'Invalid timetable batch',
    details: { errors },
  });
}

describe('normalizeTime', () => {
  it.each([
    ['7:30', '07:30'],
    ['07:30', '07:30'],
    ['0730', '07:30'],
    ['730', '07:30'],
    ['7h30', '07:30'],
    [' 9:05 ', '09:05'],
    ['23:59', '23:59'],
  ])('%s -> %s', (input, out) => {
    expect(normalizeTime(input)).toBe(out);
  });
  it.each(['', '24:00', '12:60', '7', 'abc', '7:5', '123456'])(
    'rejects %s',
    input => {
      expect(normalizeTime(input)).toBeNull();
    },
  );
});

describe('validateRow', () => {
  it('accepts a good row (lenient time input)', () => {
    expect(validateRow(good())).toEqual({});
    expect(validateRow(good({ startTime: '7:30', room: '' }))).toEqual({});
  });

  it('flags each bad field in Vietnamese', () => {
    const e = validateRow(
      good({ dayOfWeek: 0, startTime: '', endTime: 'xx', title: '  ' }),
    );
    expect(Object.keys(e).sort()).toEqual([
      'dayOfWeek',
      'endTime',
      'startTime',
      'title',
    ]);
    expect(e.title).toBe('Nhập tên môn.');
  });

  it('requires end after start (like the mock: 15:00 - 14:00)', () => {
    expect(validateRow(good({ startTime: '15:00', endTime: '14:00' }))).toEqual(
      { endTime: 'Giờ kết thúc phải sau giờ bắt đầu.' },
    );
    expect(validateRow(good({ startTime: '09:00', endTime: '09:00' })).endTime)
      .toBeDefined();
  });

  it('enforces length limits (title 150, room 100)', () => {
    expect(validateRow(good({ title: 'a'.repeat(150) })).title).toBeUndefined();
    expect(validateRow(good({ title: 'a'.repeat(151) })).title).toBeDefined();
    expect(validateRow(good({ room: 'r'.repeat(101) })).room).toBeDefined();
  });
});

describe('counts and submit gate', () => {
  it('counts invalid and low rows', () => {
    const rows = [good(), good({ title: '' }), good({ confidence: 'low' })];
    expect(countInvalid(rows)).toBe(1);
    expect(countLow(rows)).toBe(1);
  });

  it('submitBlock', () => {
    expect(submitBlock([])).toBe('empty');
    expect(submitBlock([good(), good({ endTime: '' })])).toBe('invalid');
    expect(submitBlock([good()])).toBeNull();
    const many = Array.from({ length: MAX_ROWS + 1 }, () => good());
    expect(submitBlock(many)).toBe('tooMany');
    expect(submitBlock(many.slice(0, MAX_ROWS))).toBeNull();
  });
});

describe('DTO mapping', () => {
  it('uses the backend day strings', () => {
    expect(DAY_LABELS.slice(1)).toEqual([
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'Chủ Nhật',
    ]);
  });

  it('maps a row to exactly the ParsedTimetableRow fields', () => {
    expect(
      toDtoRow(good({ dayOfWeek: 7, startTime: '7:30', title: ' CTDL ', room: ' B11.105 ' })),
    ).toEqual({
      day: 'Chủ Nhật',
      date: null,
      startTime: '07:30',
      endTime: '09:30',
      subjectCode: '',
      subjectName: 'CTDL',
      group: '',
      room: 'B11.105',
      lecturerName: '',
    });
  });

  it('builds the batch payload and keeps row order (rowIndex == list index)', () => {
    const rows = [good({ title: 'A' }), good({ title: 'B', dayOfWeek: 1 })];
    const p = toBatchPayload(rows, 'sem-1', 'MERGE');
    expect(Object.keys(p).sort()).toEqual([
      'mode',
      'rows',
      'semesterId',
      'sourceFiles',
    ]);
    expect(p.semesterId).toBe('sem-1');
    expect(p.mode).toBe('MERGE');
    expect(p.sourceFiles.length).toBeLessThanOrEqual(20);
    expect(p.rows.map(r => r.subjectName)).toEqual(['A', 'B']);
    expect(p.rows[1].day).toBe('Thứ 2');
  });

  it('fromParsed / emptyRow', () => {
    const [r] = fromParsed([
      {
        dayOfWeek: 1,
        startTime: '07:30',
        endTime: '09:30',
        title: 'Mạng',
        confidence: 'low',
      },
    ]);
    expect(r).toMatchObject({ room: '', confidence: 'low', dayOfWeek: 1 });
    expect(emptyRow(3)).toMatchObject({ dayOfWeek: 3, title: '', confidence: 'high' });
    expect(emptyRow().key).not.toBe(emptyRow().key);
  });
});

describe('mapBatchErrors', () => {
  it('maps rowIndex + field to cards and ignores the English message', () => {
    const m = mapBatchErrors(
      [
        { rowIndex: 3, field: 'endTime', message: 'Must be after startTime' },
        { rowIndex: 1, field: 'day', message: 'Must be Thứ 2 ...' },
        { rowIndex: 3, field: 'room', message: 'Must be at most 100 characters' },
      ],
      5,
    );
    expect(m.firstRowIndex).toBe(1);
    expect(m.byRow[1]).toEqual({ dayOfWeek: 'Thứ trong tuần chưa hợp lệ.' });
    expect(Object.keys(m.byRow[3]).sort()).toEqual(['endTime', 'room']);
    expect(JSON.stringify(m)).not.toMatch(/Must be/);
    expect(m.general).toEqual([]);
  });

  it('puts top-level and out-of-range errors in general', () => {
    const m = mapBatchErrors(
      [
        { field: 'rows', message: 'Must contain 1 to 2000 rows' },
        { field: 'semesterId', message: 'Must be a UUID' },
        { rowIndex: 99, field: 'day', message: 'x' },
        { field: 'mode', message: 'x' },
      ],
      2,
    );
    expect(m.firstRowIndex).toBeNull();
    expect(m.byRow).toEqual({});
    expect(m.general).toHaveLength(3);
  });

  it('unknown row field falls back to a generic text on the title', () => {
    const m = mapBatchErrors([{ rowIndex: 0, field: 'date', message: 'x' }], 1);
    expect(m.byRow[0].title).toBe('Giá trị chưa hợp lệ.');
  });
});

describe('submitErrorText', () => {
  it('422 with rows points to the cards', () => {
    const e = batch422([
      { rowIndex: 0, field: 'endTime', message: 'Must be after startTime' },
      { rowIndex: 2, field: 'day', message: 'x' },
    ]);
    expect(submitErrorText(e, 3)).toContain('2 dòng');
  });

  it('413 and network/other errors use fixed Vietnamese text', () => {
    expect(
      submitErrorText(
        new ApiError({
          status: 413,
          error: ERR.SCHEDULE_BATCH_TOO_LARGE,
          message: 'Timetable body exceeds 1 MiB',
        }),
        3,
      ),
    ).toBe('Dữ liệu quá lớn (tối đa 2.000 dòng).');
    expect(submitErrorText(new NetworkError('x'), 3)).toMatch(/kết nối/);
    expect(submitErrorText(new Error('boom'), 3)).toBe(
      'Có lỗi xảy ra. Thử lại sau.',
    );
    expect(
      submitErrorText(batch422([{ field: 'rows', message: 'x' }]), 0),
    ).toBe('Cần từ 1 đến 2.000 dòng.');
  });
});
