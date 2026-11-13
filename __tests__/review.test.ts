import type { QueueEntry } from '../src/api/domainTypes';
import {
  meetingRecordPayload,
  queueEntryLabel,
} from '../src/features/review/reviewLogic';

const entry = (over: Partial<QueueEntry>): QueueEntry => ({
  id: 'e1',
  studentId: 's1',
  studentName: 'Mai',
  position: 1,
  status: 'WAITING',
  requestedAt: '2026-11-18T00:00:00Z',
  offerExpiresAt: null,
  ...over,
});

test('queue entry label', () => {
  expect(queueEntryLabel(entry({}))).toBe('1. Mai · đang chờ');
  expect(queueEntryLabel(entry({ position: null, status: 'OFFERED' }))).toBe(
    'Mai · đã được mời',
  );
});

test('meeting record payload trims and omits empty notes', () => {
  expect(meetingRecordPayload(true, '  ổn  ')).toEqual({
    attended: true,
    notes: 'ổn',
  });
  expect(meetingRecordPayload(false, '   ')).toEqual({ attended: false });
});
