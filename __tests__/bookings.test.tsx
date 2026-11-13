import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { Booking, BookingTimelineEvent } from '../src/api/domainTypes';
import {
  BookingRow,
  DateBlock,
  MeetingLinkButton,
  Timeline,
} from '../src/features/booking/detail';

async function render(element: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(element);
  });
  return r;
}
const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

const booking: Booking = {
  id: 'b1',
  slotId: 's1',
  lecturerId: 'l1',
  studentId: 'st1',
  lecturerName: 'TS. Khoa',
  studentName: 'Mai',
  department: null,
  topic: null,
  startAt: '2026-11-18T07:00:00Z',
  endAt: '2026-11-18T07:20:00Z',
  status: 'PENDING',
  meetingUrl: null,
};

test('BookingRow shows the other party for each role', async () => {
  const sv = await render(
    <BookingRow booking={booking} role="STUDENT" onPress={() => {}} />,
  );
  expect(texts(sv)).toEqual(
    expect.arrayContaining(['TS. Khoa', 'Thứ Tư 18/11 · 14:00 · Trực tiếp', 'Chờ duyệt']),
  );
  const gv = await render(
    <BookingRow booking={booking} role="LECTURER" onPress={() => {}} />,
  );
  expect(texts(gv)).toContain('Mai');
});

test('DateBlock renders VN day and time range', async () => {
  const r = await render(
    <DateBlock startAt={booking.startAt} endAt={booking.endAt} where="online" />,
  );
  const all = texts(r).join('|');
  expect(all).toContain('18');
  expect(all).toContain('Thứ Tư, tháng 11');
  expect(all).toContain('14:00 - 14:20');
});

test('Timeline is newest first with translated labels', async () => {
  const events: BookingTimelineEvent[] = [
    { id: 1, type: 'CREATED', label: 'Created', at: '2026-11-17T01:02:00Z', status: null, note: 'Hỏi đề cương' },
    { id: 2, type: 'CONFIRMED', label: 'Confirmed', at: '2026-11-17T04:30:00Z', status: null, note: null },
  ];
  const r = await render(<Timeline events={events} />);
  const t = texts(r);
  expect(t.indexOf('Đã xác nhận')).toBeLessThan(t.indexOf('Đã gửi yêu cầu'));
  expect(t).toContain('17/11 11:30');
});

test('MeetingLinkButton picks the label from the URL', async () => {
  const z = await render(<MeetingLinkButton url="https://zoom.us/j/1" />);
  expect(texts(z)).toContain('Tham gia trên Zoom');
  const m = await render(
    <MeetingLinkButton url="https://meet.google.com/abc" />,
  );
  expect(texts(m)).toContain('Tham gia trên Google Meet');
  const o = await render(<MeetingLinkButton url="https://example.com/x" />);
  expect(texts(o)).toContain('Mở link họp');
});
