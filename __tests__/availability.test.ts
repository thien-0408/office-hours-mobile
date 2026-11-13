import {
  availabilityErrorMessage,
  calculateSlotsCount,
  calculateTotalSlots,
  dayOfWeekName,
  formatExceptionSummary,
  formatRuleLabel,
  groupRulesByDay,
  isDurationDivisible,
  validateExceptionInput,
  validateRuleInput,
} from '../src/features/availability/availabilityLogic';
import { ApiError, NetworkError } from '../src/api/errors';
import { ERR } from '../src/api/errorCodes';
import type {
  AvailabilityException,
  AvailabilityRule,
} from '../src/api/domainTypes';

describe('availabilityLogic', () => {
  describe('dayOfWeekName', () => {
    it('returns Vietnamese day name', () => {
      expect(dayOfWeekName(1)).toBe('Thứ Hai');
      expect(dayOfWeekName(5)).toBe('Thứ Sáu');
      expect(dayOfWeekName(7)).toBe('Chủ Nhật');
      expect(dayOfWeekName(1, true)).toBe('T2');
    });
  });

  describe('calculateSlotsCount and isDurationDivisible', () => {
    it('calculates correct slot count', () => {
      // 08:00 to 10:00 = 120 mins / 20 mins = 6 slots
      expect(calculateSlotsCount('08:00', '10:00', 20)).toBe(6);
      // 19:00 to 20:00 = 60 mins / 15 mins = 4 slots
      expect(calculateSlotsCount('19:00', '20:00', 15)).toBe(4);
      // 09:00 to 10:15 = 75 mins / 30 mins = 2 slots (with 15 min remainder)
      expect(calculateSlotsCount('09:00', '10:15', 30)).toBe(2);
    });

    it('returns 0 for invalid times or zero slot length', () => {
      expect(calculateSlotsCount('10:00', '09:00', 20)).toBe(0);
      expect(calculateSlotsCount('08:00', '10:00', 0)).toBe(0);
    });

    it('verifies if duration is evenly divisible', () => {
      expect(isDurationDivisible('08:00', '10:00', 20)).toBe(true);
      expect(isDurationDivisible('08:00', '10:00', 30)).toBe(true);
      expect(isDurationDivisible('09:00', '10:15', 30)).toBe(false);
      expect(isDurationDivisible('10:00', '09:00', 20)).toBe(false);
    });

    it('calculates total slots across multiple days', () => {
      // 2 days * 4 slots/day = 8 slots
      expect(calculateTotalSlots(2, '19:00', '20:00', 15)).toBe(8);
      expect(calculateTotalSlots(0, '19:00', '20:00', 15)).toBe(0);
    });
  });

  describe('groupRulesByDay', () => {
    const rules: AvailabilityRule[] = [
      {
        id: 'r1',
        lecturerId: 'lec1',
        semesterId: 'sem1',
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '16:00',
        slotLengthMinutes: 20,
        effectiveFrom: '2026-09-01',
        effectiveTo: '2027-01-15',
        meetingUrl: null,
        active: true,
      },
      {
        id: 'r2',
        lecturerId: 'lec1',
        semesterId: 'sem1',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        slotLengthMinutes: 20,
        effectiveFrom: '2026-09-01',
        effectiveTo: '2027-01-15',
        meetingUrl: null,
        active: true,
      },
      {
        id: 'r3',
        lecturerId: 'lec1',
        semesterId: 'sem1',
        dayOfWeek: 3,
        startTime: '19:00',
        endTime: '20:00',
        slotLengthMinutes: 15,
        effectiveFrom: '2026-09-01',
        effectiveTo: '2027-01-15',
        meetingUrl: 'https://zoom.us/j/123456',
        active: true,
      },
    ];

    it('groups rules by dayOfWeek and sorts days 1..7', () => {
      const groups = groupRulesByDay(rules);
      expect(groups.length).toBe(2);

      // Group 1: Thứ Hai (dayOfWeek 1)
      expect(groups[0].dayOfWeek).toBe(1);
      expect(groups[0].dayLabel).toBe('Thứ Hai');
      expect(groups[0].rules.length).toBe(1);
      expect(groups[0].rules[0].id).toBe('r2');

      // Group 2: Thứ Tư (dayOfWeek 3)
      expect(groups[1].dayOfWeek).toBe(3);
      expect(groups[1].dayLabel).toBe('Thứ Tư');
      expect(groups[1].rules.length).toBe(2);
      expect(groups[1].rules[0].id).toBe('r1');
      expect(groups[1].rules[1].id).toBe('r3');
    });
  });

  describe('formatRuleLabel', () => {
    it('formats rule label for in-person rule', () => {
      const rule: AvailabilityRule = {
        id: 'r1',
        lecturerId: 'lec1',
        semesterId: 'sem1',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        slotLengthMinutes: 20,
        effectiveFrom: '2026-09-01',
        effectiveTo: null,
        meetingUrl: null,
        active: true,
      };
      const label = formatRuleLabel(rule);
      expect(label.timeRange).toBe('08:00 – 10:00');
      expect(label.subtitle).toBe('Slot 20 phút · Trực tiếp');
      expect(label.slotCount).toBe(6);
      expect(label.isOnline).toBe(false);
    });

    it('formats rule label for online rule', () => {
      const rule: AvailabilityRule = {
        id: 'r3',
        lecturerId: 'lec1',
        semesterId: 'sem1',
        dayOfWeek: 3,
        startTime: '19:00',
        endTime: '20:00',
        slotLengthMinutes: 15,
        effectiveFrom: '2026-09-01',
        effectiveTo: null,
        meetingUrl: 'https://zoom.us/j/123456',
        active: true,
      };
      const label = formatRuleLabel(rule);
      expect(label.timeRange).toBe('19:00 – 20:00');
      expect(label.subtitle).toBe('Slot 15 phút · Online');
      expect(label.slotCount).toBe(4);
      expect(label.isOnline).toBe(true);
    });
  });

  describe('formatExceptionSummary', () => {
    it('formats BLOCK exception', () => {
      const ex: AvailabilityException = {
        id: 'ex1',
        lecturerId: 'lec1',
        date: '2026-11-20',
        type: 'BLOCK',
        startTime: null,
        endTime: null,
        reason: 'Họp khoa cả ngày',
        meetingUrl: null,
      };
      const summary = formatExceptionSummary(ex);
      expect(summary.isBlock).toBe(true);
      expect(summary.title).toBe('Nghỉ · 20/11');
      expect(summary.subtitle).toBe('Họp khoa cả ngày');
    });

    it('formats ADD exception', () => {
      const ex: AvailabilityException = {
        id: 'ex2',
        lecturerId: 'lec1',
        date: '2026-11-21',
        type: 'ADD',
        startTime: '09:00',
        endTime: '10:00',
        reason: 'Ôn thi cuối kỳ',
        meetingUrl: 'https://meet.google.com/abc',
      };
      const summary = formatExceptionSummary(ex);
      expect(summary.isBlock).toBe(false);
      expect(summary.title).toBe('Thêm · 21/11, 09:00 – 10:00');
      expect(summary.subtitle).toBe('Ôn thi cuối kỳ');
    });
  });

  describe('validateRuleInput', () => {
    it('validates correct rule input', () => {
      const res = validateRuleInput({
        days: [3, 5],
        startTime: '19:00',
        endTime: '20:00',
        slotLengthMinutes: 15,
        isOnline: true,
        meetingUrl: 'https://zoom.us/j/12345',
      });
      expect(res.valid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('fails when no day is selected', () => {
      const res = validateRuleInput({
        days: [],
        startTime: '08:00',
        endTime: '10:00',
        slotLengthMinutes: 20,
      });
      expect(res.valid).toBe(false);
      expect(res.errors.days).toBeDefined();
    });

    it('fails when online URL is invalid', () => {
      const res = validateRuleInput({
        days: [1],
        startTime: '08:00',
        endTime: '10:00',
        slotLengthMinutes: 20,
        isOnline: true,
        meetingUrl: 'http://not-https.com',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.meetingUrl).toBeDefined();
    });
  });

  describe('validateExceptionInput', () => {
    it('validates correct exception input', () => {
      const res = validateExceptionInput({
        date: '2026-11-20',
        type: 'BLOCK',
        startTime: '08:00',
        endTime: '10:00',
        reason: 'Nghỉ đột xuất',
      });
      expect(res.valid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('rejects invalid date format', () => {
      const res = validateExceptionInput({
        date: '20-11-2026',
        type: 'BLOCK',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.date).toBeDefined();
    });
  });

  describe('availabilityErrorMessage', () => {
    it('translates AVAILABILITY_RULE_OVERLAP (409)', () => {
      const err = new ApiError({
        status: 409,
        error: ERR.AVAILABILITY_RULE_OVERLAP,
        message: 'Overlap',
      });
      expect(availabilityErrorMessage(err)).toBe(
        'Khung giờ bị trùng lặp với lịch rảnh khác đã có.',
      );
    });

    it('translates AVAILABILITY_ADD_CONFLICT (409)', () => {
      const err = new ApiError({
        status: 409,
        error: ERR.AVAILABILITY_ADD_CONFLICT,
        message: 'Conflict',
      });
      expect(availabilityErrorMessage(err)).toBe(
        'Ngoại lệ thêm giờ bị trùng hoặc không tạo được slot.',
      );
    });

    it('translates NetworkError', () => {
      const err = new NetworkError('Network down');
      expect(availabilityErrorMessage(err)).toContain('Không kết nối được máy chủ');
    });
  });
});
