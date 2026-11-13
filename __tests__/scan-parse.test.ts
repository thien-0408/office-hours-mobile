import {
  extractTimeInfo,
  findTimes,
  matchDayPrefix,
  parseTimetable,
  PERIOD_TIMES,
  splitTitleRoom,
  type OcrBlock,
  type OcrResult,
} from '../src/features/schedule/scan/parseTimetable';

// ---- synthetic ML Kit results -------------------------------------------------

const CHAR_W = 8;
const LINE_H = 20;

/** One block with one line per entry of `lines`; words become elements with frames. */
function cell(lines: string | string[], left: number, top: number): OcrBlock {
  const arr = Array.isArray(lines) ? lines : [lines];
  return {
    lines: arr.map((text, i) => {
      let x = left;
      const elements = text.split(' ').map(w => {
        const width = w.length * CHAR_W;
        const el = {
          text: w,
          frame: { left: x, top: top + i * 24, width, height: LINE_H },
        };
        x += width + CHAR_W;
        return el;
      });
      const last = elements[elements.length - 1].frame;
      return {
        text,
        elements,
        frame: {
          left,
          top: top + i * 24,
          width: last.left + last.width - left,
          height: LINE_H,
        },
      };
    }),
  };
}

function result(blocks: OcrBlock[]): OcrResult {
  return { text: '', blocks };
}

/** Plain text lines without frames (what a list-format photo often yields). */
function plain(lines: string[]): OcrResult {
  return {
    text: lines.join('\n'),
    blocks: [
      {
        lines: lines.map(text => ({
          text,
          elements: text.split(' ').map(t => ({ text: t })),
        })),
      },
    ],
  };
}

const COL_X = [160, 360, 560]; // Thứ 2, 3, 4
const ROW_Y = [100, 220, 340]; // 3 slots

function gridBlocks(headers: string[] = ['Thứ 2', 'Thứ 3', 'Thứ 4']) {
  const blocks: OcrBlock[] = [];
  headers.forEach((h, i) => blocks.push(cell(h, COL_X[i] + 10, 0)));
  return blocks;
}

describe('helpers', () => {
  it('matches day names with and without diacritics and noise', () => {
    expect(matchDayPrefix('Thứ 2')?.dayOfWeek).toBe(1);
    expect(matchDayPrefix('Thú 2')?.dayOfWeek).toBe(1);
    expect(matchDayPrefix('THU 7')?.dayOfWeek).toBe(6);
    expect(matchDayPrefix('T5')?.dayOfWeek).toBe(4);
    expect(matchDayPrefix('Thứ Tư')?.dayOfWeek).toBe(3);
    expect(matchDayPrefix('Thứ Bảy')?.dayOfWeek).toBe(6);
    expect(matchDayPrefix('Chủ nhật')?.dayOfWeek).toBe(7);
    expect(matchDayPrefix('CN')?.dayOfWeek).toBe(7);
    expect(matchDayPrefix('Monday')?.dayOfWeek).toBe(1);
    expect(matchDayPrefix('Sun')?.dayOfWeek).toBe(7);
    expect(matchDayPrefix('Thể chất')).toBeNull();
    expect(matchDayPrefix('CNTT cơ bản')).toBeNull();
  });

  it('reads times in several spellings', () => {
    expect(findTimes('07:30').map(t => t.hhmm)).toEqual(['07:30']);
    expect(findTimes('7:30 - 9:00').map(t => t.hhmm)).toEqual([
      '07:30',
      '09:00',
    ]);
    expect(findTimes('7h30').map(t => t.hhmm)).toEqual(['07:30']);
    expect(findTimes('O7:30')[0]).toMatchObject({
      hhmm: '07:30',
      corrected: true,
    });
    expect(findTimes('25:00')).toHaveLength(0);
    expect(findTimes('B11.306')).toHaveLength(0);
  });

  it('extracts ranges, singles and periods', () => {
    expect(extractTimeInfo('07:30 - 09:00 CTDL')).toMatchObject({
      start: '07:30',
      end: '09:00',
      guessed: false,
      rest: 'CTDL',
    });
    expect(extractTimeInfo('O7:30 - 09:OO CTDL')).toMatchObject({
      start: '07:30',
      end: '09:00',
      guessed: true,
    });
    expect(extractTimeInfo('7:30')).toMatchObject({ start: '07:30', end: null });
    const p = extractTimeInfo('Tiết 1-3 Mạng');
    expect(p).toMatchObject({
      start: PERIOD_TIMES[1].start,
      end: PERIOD_TIMES[3].end,
      guessed: true,
      rest: 'Mạng',
    });
    expect(extractTimeInfo('hello').found).toBe(false);
    expect(extractTimeInfo('3-4', { allowPlainPeriod: true }).found).toBe(true);
    expect(extractTimeInfo('3-4').found).toBe(false);
  });

  it('splits title and room', () => {
    expect(splitTitleRoom('Lập trình di động B11.306')).toEqual({
      title: 'Lập trình di động',
      room: 'B11.306',
    });
    expect(splitTitleRoom('Mạng máy tính 306.b11')).toEqual({
      title: 'Mạng máy tính',
      room: '306.B11',
    });
    expect(splitTitleRoom('Thực hành LAB403.B08')).toEqual({
      title: 'Thực hành',
      room: 'LAB403.B08',
    });
    expect(splitTitleRoom('Thể chất Sân B')).toEqual({ title: 'Thể chất Sân B' });
    expect(splitTitleRoom('CTDL Phòng: A1.203')).toEqual({
      title: 'CTDL',
      room: 'A1.203',
    });
  });
});

describe('parseTimetable: grid', () => {
  it('reads a 3 days x 3 slots grid with time labels', () => {
    const blocks = [
      ...gridBlocks(),
      cell('07:30 - 09:30', 0, ROW_Y[0]),
      cell('09:45 - 11:45', 0, ROW_Y[1]),
      cell('13:00 - 15:00', 0, ROW_Y[2]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('A1.203', COL_X[0], ROW_Y[0] + 24),
      cell('Mạng máy tính B8.201', COL_X[1], ROW_Y[0]),
      cell(['Cấu trúc dữ liệu', 'B11.105'], COL_X[2], ROW_Y[1]),
      cell('Tiếng Anh 4 B4.002', COL_X[0], ROW_Y[2]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows).toEqual([
      {
        dayOfWeek: 1,
        startTime: '07:30',
        endTime: '09:30',
        title: 'Lập trình Web',
        room: 'A1.203',
        confidence: 'high',
      },
      {
        dayOfWeek: 1,
        startTime: '13:00',
        endTime: '15:00',
        title: 'Tiếng Anh 4',
        room: 'B4.002',
        confidence: 'high',
      },
      {
        dayOfWeek: 2,
        startTime: '07:30',
        endTime: '09:30',
        title: 'Mạng máy tính',
        room: 'B8.201',
        confidence: 'high',
      },
      {
        dayOfWeek: 3,
        startTime: '09:45',
        endTime: '11:45',
        title: 'Cấu trúc dữ liệu',
        room: 'B11.105',
        confidence: 'high',
      },
    ]);
  });

  it('reads multi-line time labels ("07:30" / "-" / "09:30")', () => {
    const blocks = [
      ...gridBlocks(),
      cell(['07:30', '-', '09:30'], 0, ROW_Y[0] - 24),
      cell(['13:00', '-', '15:00'], 0, ROW_Y[1] - 24),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('CTDL', COL_X[1], ROW_Y[1]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows.map(r => [r.dayOfWeek, r.startTime, r.endTime])).toEqual([
      [1, '07:30', '09:30'],
      [2, '13:00', '15:00'],
    ]);
  });

  it('maps period labels through the period table and marks them low', () => {
    const blocks = [
      ...gridBlocks(),
      cell('Tiết 1-3', 0, ROW_Y[0]),
      cell('Tiết 4-6', 0, ROW_Y[1]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('Cơ sở dữ liệu', COL_X[2], ROW_Y[1]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      dayOfWeek: 1,
      startTime: PERIOD_TIMES[1].start,
      endTime: PERIOD_TIMES[3].end,
      confidence: 'low',
    });
    expect(rows[1]).toMatchObject({
      dayOfWeek: 3,
      startTime: PERIOD_TIMES[4].start,
      endTime: PERIOD_TIMES[6].end,
      confidence: 'low',
    });
  });

  it('uses the next label as end time when labels hold only a start (like the mock)', () => {
    const blocks = [
      ...gridBlocks(),
      cell('7:30', 0, ROW_Y[0]),
      cell('9:30', 0, ROW_Y[1]),
      cell('13:00', 0, ROW_Y[2]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('Tiếng Anh 4', COL_X[1], ROW_Y[2]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows[0]).toMatchObject({
      startTime: '07:30',
      endTime: '09:30',
      confidence: 'high',
    });
    // last label has no successor: end guessed (+90 min) and flagged
    expect(rows[1]).toMatchObject({
      startTime: '13:00',
      endTime: '14:30',
      confidence: 'low',
    });
  });

  it('survives OCR noise in headers and times', () => {
    const blocks = [
      ...gridBlocks(['Thú 2', 'Thu 3', 'THỨ 4']),
      cell('O7:30 - 09:30', 0, ROW_Y[0]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('Mạng', COL_X[1], ROW_Y[0]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows.map(r => r.dayOfWeek)).toEqual([1, 2]);
    expect(rows[0].startTime).toBe('07:30');
    // letter O was guessed as zero
    expect(rows[0].confidence).toBe('low');
  });

  it('handles a cell that spans two slots (merged cell)', () => {
    const mid = (ROW_Y[0] + ROW_Y[1]) / 2; // sits on the boundary between slot 1 and 2
    const blocks = [
      ...gridBlocks(),
      cell('07:30 - 09:30', 0, ROW_Y[0]),
      cell('09:45 - 11:45', 0, ROW_Y[1]),
      cell('13:00 - 15:00', 0, ROW_Y[2]),
      cell(['Đồ án', 'chuyên ngành'], COL_X[1], mid - 24),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      dayOfWeek: 2,
      startTime: '07:30',
      endTime: '11:45',
      title: 'Đồ án chuyên ngành',
      confidence: 'low',
    });
  });

  it('keeps a missing day column out and orders by header text, not index', () => {
    // only Thứ 2 and Thứ 4 recognised: Thứ 4 header sits two pitches to the right
    const blocks = [
      cell('Thứ 2', COL_X[0] + 10, 0),
      cell('Thứ 4', COL_X[2] + 10, 0),
      cell('07:30 - 09:30', 0, ROW_Y[0]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
      cell('Mạng', COL_X[2], ROW_Y[0]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows.map(r => r.dayOfWeek)).toEqual([1, 3]);
  });

  it('accepts abbreviations and Sunday', () => {
    const blocks = [
      cell('T7', COL_X[0] + 10, 0),
      cell('CN', COL_X[1] + 10, 0),
      cell('07:30 - 09:30', 0, 100),
      cell('Lập trình Web', COL_X[0], 100),
      cell('Họp lớp', COL_X[1], 100),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows.map(r => r.dayOfWeek)).toEqual([6, 7]);
  });

  it('reads times that are inside the cell when there is no label column', () => {
    const blocks = [
      ...gridBlocks(),
      cell(['07:30-09:30', 'Lập trình Web', 'B11.306'], COL_X[0], ROW_Y[0]),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows).toEqual([
      {
        dayOfWeek: 1,
        startTime: '07:30',
        endTime: '09:30',
        title: 'Lập trình Web',
        room: 'B11.306',
        confidence: 'high',
      },
    ]);
  });

  it('marks cells without any time as low with empty times', () => {
    const blocks = [...gridBlocks(), cell('Lập trình Web', COL_X[0], ROW_Y[0])];
    const rows = parseTimetable(result(blocks));
    expect(rows).toEqual([
      {
        dayOfWeek: 1,
        startTime: '',
        endTime: '',
        title: 'Lập trình Web',
        confidence: 'low',
      },
    ]);
  });

  it('ignores text above the header row', () => {
    const blocks = [
      cell('THỜI KHÓA BIỂU HỌC KỲ 1', 70, -60),
      ...gridBlocks(),
      cell('07:30 - 09:30', 0, ROW_Y[0]),
      cell('Lập trình Web', COL_X[0], ROW_Y[0]),
    ];
    expect(parseTimetable(result(blocks))).toHaveLength(1);
  });
});

describe('parseTimetable: list format', () => {
  it('parses "Thứ 2 07:30-09:00 Title Room" lines', () => {
    const rows = parseTimetable(
      plain([
        'Thứ 2 07:30-09:00 Lập trình di động B11.306',
        'Thứ 4 13:00 - 15:00 Cơ sở dữ liệu 306.B11',
        'Chủ nhật 09:00-11:00 Câu lạc bộ',
      ]),
    );
    expect(rows).toEqual([
      {
        dayOfWeek: 1,
        startTime: '07:30',
        endTime: '09:00',
        title: 'Lập trình di động',
        room: 'B11.306',
        confidence: 'high',
      },
      {
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '15:00',
        title: 'Cơ sở dữ liệu',
        room: '306.B11',
        confidence: 'high',
      },
      {
        dayOfWeek: 7,
        startTime: '09:00',
        endTime: '11:00',
        title: 'Câu lạc bộ',
        confidence: 'high',
      },
    ]);
  });

  it('carries the day over several lines and takes a title from the next line', () => {
    const rows = parseTimetable(
      plain([
        'Thứ 3',
        '07:30 - 09:30 Mạng máy tính A1.203',
        '09:45 - 11:45',
        'Hệ điều hành',
        'Thứ 5',
        '13:00 - 15:00 Tiếng Anh',
      ]),
    );
    expect(rows.map(r => [r.dayOfWeek, r.startTime, r.title])).toEqual([
      [2, '07:30', 'Mạng máy tính'],
      [2, '09:45', 'Hệ điều hành'],
      [4, '13:00', 'Tiếng Anh'],
    ]);
  });

  it('flags missing day, single time and OCR-fixed time as low', () => {
    const rows = parseTimetable(
      plain([
        '07:30-09:00 Không rõ thứ',
        'Thứ 2 O7:30-09:00 Lập trình',
        'Thứ 3 07:30 Chỉ có giờ bắt đầu',
      ]),
    );
    const byTitle = Object.fromEntries(rows.map(r => [r.title, r]));
    expect(byTitle['Không rõ thứ']).toMatchObject({
      dayOfWeek: 0,
      confidence: 'low',
    });
    expect(byTitle['Lập trình'].confidence).toBe('low');
    expect(byTitle['Chỉ có giờ bắt đầu']).toMatchObject({
      endTime: '',
      confidence: 'low',
    });
  });

  it('supports period expressions and English day names', () => {
    const rows = parseTimetable(
      plain(['Monday Tiết 1-3 Programming', 'Wed 13:00-15:00 Databases']),
    );
    expect(rows[0]).toMatchObject({
      dayOfWeek: 1,
      startTime: PERIOD_TIMES[1].start,
      confidence: 'low',
    });
    expect(rows[1]).toMatchObject({ dayOfWeek: 3, confidence: 'high' });
  });

  it('reads list lines that come with frames, rejoining split lines', () => {
    const blocks = [
      cell('Thứ 2', 10, 10),
      cell('07:30-09:00 Lập trình di động B11.306', 80, 12),
      cell('Thứ 3', 10, 60),
      cell('09:00-10:30 Mạng', 80, 62),
    ];
    const rows = parseTimetable(result(blocks));
    expect(rows.map(r => [r.dayOfWeek, r.startTime, r.title])).toEqual([
      [1, '07:30', 'Lập trình di động'],
      [2, '09:00', 'Mạng'],
    ]);
  });

  it('removes exact duplicates', () => {
    const rows = parseTimetable(
      plain(['Thứ 2 07:30-09:00 Mạng', 'Thứ 2 07:30-09:00 Mạng']),
    );
    expect(rows).toHaveLength(1);
  });
});

describe('parseTimetable: empty / junk input', () => {
  it('returns [] for empty or nonsense results', () => {
    expect(parseTimetable(null)).toEqual([]);
    expect(parseTimetable(undefined)).toEqual([]);
    expect(parseTimetable({ text: '', blocks: [] })).toEqual([]);
    expect(parseTimetable(plain(['', '   ']))).toEqual([]);
    expect(parseTimetable(plain(['Xin chào', 'Đây không phải lịch']))).toEqual(
      [],
    );
    expect(parseTimetable(result([cell('Thứ 2', 10, 0)]))).toEqual([]);
  });

  it('falls back to the plain text when there are no blocks', () => {
    const rows = parseTimetable({
      text: 'Thứ 2 07:30-09:00 Lập trình\nThứ 3 09:00-10:30 Mạng',
      blocks: [],
    });
    expect(rows).toHaveLength(2);
  });
});
