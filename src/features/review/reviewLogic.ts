import type { QueueEntry } from '../../api/domainTypes';

const QUEUE_STATUS: Record<QueueEntry['status'], string> = {
  WAITING: 'đang chờ',
  OFFERED: 'đã được mời',
  FULFILLED: 'đã đặt',
  CANCELLED: 'đã hủy',
  EXPIRED: 'hết hạn',
};

/** "1. Nguyễn Văn A · đang chờ" (read-only waitlist row for the lecturer). */
export function queueEntryLabel(e: QueueEntry): string {
  const pos = e.position != null ? `${e.position}. ` : '';
  return `${pos}${e.studentName} · ${QUEUE_STATUS[e.status]}`;
}

/** Payload for PATCH meeting-record: notes trimmed, empty omitted. */
export function meetingRecordPayload(attended: boolean, notes: string) {
  const n = notes.trim();
  return n === '' ? { attended } : { attended, notes: n };
}
