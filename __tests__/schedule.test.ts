import {
  dayOfWeekToName,
  filterBlocksByDay,
  formatMinutesToTime,
  formatScheduleSource,
  getWeekDays,
  isTimeOverlap,
  isTimeRangeValid,
  isTimeValid,
  parseTimeToMinutes,
  scheduleErrorMessage,
  sortScheduleBlocks,
  validateScheduleEntryInput,
} from '../src/features/schedule/scheduleLogic';
import { ApiError, NetworkError } from '../src/api/errors';
import { ERR } from '../src/api/errorCodes';
import type { ScheduleBlock } from '../src/api/domainTypes';

describe('scheduleLogic', () => {
  describe('dayOfWeekToName', () => {
    it('returns Vietnamese full names by default', () => {
      expect(dayOfWeekToName(1)).toBe('Thứ Hai');
      expect(dayOfWeekToName(2)).toBe('Thứ Ba');
      expect(dayOfWeekToName(3)).toBe('Thứ Tư');
      expect(dayOfWeekToName(4)).toBe('Thứ Năm');
      expect(dayOfWeekToName(5)).toBe('Thứ Sáu');
      expect(dayOfWeekToName(6)).toBe('Thứ Bảy');
      expect(dayOfWeekToName(7)).toBe('Chủ Nhật');
    });

    it('returns short names when short = true', () => {
      expect(dayOfWeekToName(1, true)).toBe('T2');
      expect(dayOfWeekToName(3, true)).toBe('T4');
      expect(dayOfWeekToName(7, true)).toBe('CN');
    });

    it('returns empty string for invalid day', () => {
      expect(dayOfWeekToName(0)).toBe('');
      expect(dayOfWeekToName(8)).toBe('');
    });
  });

  describe('parseTimeToMinutes and formatMinutesToTime', () => {
    it('parses valid HH:mm into minutes since midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('07:30')).toBe(450);
      expect(parseTimeToMinutes('14:45')).toBe(14 * 60 + 45);
      expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59);
    });

    it('returns NaN for invalid time strings', () => {
      expect(parseTimeToMinutes('')).toBeNaN();
      expect(parseTimeToMinutes('25:00')).toBeNaN();
      expect(parseTimeToMinutes('12:60')).toBeNaN();
      expect(parseTimeToMinutes('abc')).toBeNaN();
    });

    it('formats minutes to HH:mm string', () => {
      expect(formatMinutesToTime(0)).toBe('00:00');
      expect(formatMinutesToTime(450)).toBe('07:30');
      expect(formatMinutesToTime(885)).toBe('14:45');
      expect(formatMinutesToTime(1439)).toBe('23:59');
    });

    it('clamps out of range minutes', () => {
      expect(formatMinutesToTime(-10)).toBe('00:00');
      expect(formatMinutesToTime(2000)).toBe('23:59');
    });
  });

  describe('isTimeValid and isTimeRangeValid', () => {
    it('checks time format validity', () => {
      expect(isTimeValid('08:00')).toBe(true);
      expect(isTimeValid('23:59')).toBe(true);
      expect(isTimeValid('24:00')).toBe(false);
      expect(isTimeValid('8:00')).toBe(true);
    });

    it('checks if end time is strictly after start time', () => {
      expect(isTimeRangeValid('08:00', '10:00')).toBe(true);
      expect(isTimeRangeValid('10:00', '10:00')).toBe(false);
      expect(isTimeRangeValid('11:00', '10:00')).toBe(false);
      expect(isTimeRangeValid('invalid', '10:00')).toBe(false);
    });
  });

  describe('isTimeOverlap', () => {
    it('detects overlapping time ranges', () => {
      expect(isTimeOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);
      expect(isTimeOverlap('08:00', '10:00', '07:00', '09:00')).toBe(true);
      expect(isTimeOverlap('08:00', '10:00', '08:30', '09:30')).toBe(true);
    });

    it('returns false for adjacent and non-overlapping ranges', () => {
      expect(isTimeOverlap('08:00', '10:00', '10:00', '12:00')).toBe(false);
      expect(isTimeOverlap('08:00', '10:00', '06:00', '08:00')).toBe(false);
      expect(isTimeOverlap('08:00', '10:00', '13:00', '14:00')).toBe(false);
    });
  });

  describe('sortScheduleBlocks and filterBlocksByDay', () => {
    const blocks: ScheduleBlock[] = [
      {
        id: '2',
        title: 'CTDL',
        dayOfWeek: 3,
        date: null,
        startTime: '10:00',
        endTime: '12:00',
        source: 'MANUAL',
        subjectCode: null,
        subjectName: null,
        group: null,
        room: 'B11.105',
        lecturerName: null,
        locationType: 'ROOM',
        colorHue: null,
        notes: null,
      },
      {
        id: '1',
        title: 'Web Dev',
        dayOfWeek: 2,
        date: null,
        startTime: '07:30',
        endTime: '09:30',
        source: 'IMPORTED',
        subjectCode: null,
        subjectName: null,
        group: null,
        room: 'A1.203',
        lecturerName: null,
        locationType: 'ROOM',
        colorHue: null,
        notes: null,
      },
      {
        id: '3',
        title: 'Tiếng Anh',
        dayOfWeek: 2,
        date: null,
        startTime: '13:00',
        endTime: '15:00',
        source: 'MANUAL',
        subjectCode: null,
        subjectName: null,
        group: null,
        room: 'B4.002',
        lecturerName: null,
        locationType: 'ROOM',
        colorHue: null,
        notes: null,
      },
    ];

    it('sorts blocks by dayOfWeek then startTime', () => {
      const sorted = sortScheduleBlocks(blocks);
      expect(sorted.map(b => b.id)).toEqual(['1', '3', '2']);
    });

    it('filters blocks by specific day of week', () => {
      const day2Blocks = filterBlocksByDay(blocks, 2);
      expect(day2Blocks.length).toBe(2);
      expect(day2Blocks[0].title).toBe('Web Dev');
      expect(day2Blocks[1].title).toBe('Tiếng Anh');

      const day5Blocks = filterBlocksByDay(blocks, 5);
      expect(day5Blocks.length).toBe(0);
    });
  });

  describe('getWeekDays', () => {
    it('produces 7 days from Monday to Sunday', () => {
      // 2026-11-18 is Wednesday (dayOfWeek 3)
      const wednesday = new Date('2026-11-18T10:00:00+07:00');
      const days = getWeekDays(wednesday);

      expect(days.length).toBe(7);
      expect(days[0].dayOfWeek).toBe(1);
      expect(days[0].shortLabel).toBe('T2');
      expect(days[0].dateNumber).toBe(16);

      expect(days[2].dayOfWeek).toBe(3);
      expect(days[2].shortLabel).toBe('T4');
      expect(days[2].dateNumber).toBe(18);
      expect(days[2].isToday).toBe(true);

      expect(days[6].dayOfWeek).toBe(7);
      expect(days[6].shortLabel).toBe('CN');
      expect(days[6].dateNumber).toBe(22);
    });
  });

  describe('formatScheduleSource', () => {
    it('formats source values into Vietnamese', () => {
      expect(formatScheduleSource('MANUAL')).toBe('Nhập tay');
      expect(formatScheduleSource('IMPORTED')).toBe('Đã quét');
      expect(formatScheduleSource(null)).toBe('Lịch bận');
    });
  });

  describe('validateScheduleEntryInput', () => {
    it('validates correct input successfully', () => {
      const res = validateScheduleEntryInput({
        title: 'Học Lập trình Web',
        dayOfWeek: 2,
        startTime: '08:00',
        endTime: '10:00',
        room: 'A1.203',
      });
      expect(res.valid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects empty title', () => {
      const res = validateScheduleEntryInput({
        title: '',
        dayOfWeek: 2,
        startTime: '08:00',
        endTime: '10:00',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.title).toBeDefined();
    });

    it('rejects endTime <= startTime', () => {
      const res = validateScheduleEntryInput({
        title: 'Học',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '09:00',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.endTime).toBeDefined();
    });
  });

  describe('scheduleErrorMessage', () => {
    it('translates SCHEDULE_ENTRY_DUPLICATE (409)', () => {
      const err = new ApiError({
        status: 409,
        error: ERR.SCHEDULE_ENTRY_DUPLICATE,
        message: 'Duplicate',
      });
      expect(scheduleErrorMessage(err)).toBe('Lịch bận này đã tồn tại trong học kỳ.');
    });

    it('translates SCHEDULE_ENTRY_INVALID (422)', () => {
      const err = new ApiError({
        status: 422,
        error: ERR.SCHEDULE_ENTRY_INVALID,
        message: 'Invalid',
      });
      expect(scheduleErrorMessage(err)).toBe(
        'Khung giờ không hợp lệ: giờ kết thúc phải sau giờ bắt đầu.',
      );
    });

    it('translates NetworkError', () => {
      const err = new NetworkError('Connection lost');
      expect(scheduleErrorMessage(err)).toContain('Không kết nối được máy chủ');
    });
  });
});
