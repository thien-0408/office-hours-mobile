import type { ChatMessage } from '../src/api/domainTypes';
import { vnDateToInstant } from '../src/api/time';
import {
  applyRead,
  ascending,
  buildListItems,
  closedNotice,
  dayLabel,
  fromServer,
  gapCursor,
  isRoomClosed,
  isTypingVisible,
  makePending,
  mergeMessages,
  newClientMessageId,
  nextTypingUntil,
  oldestCursor,
  shouldSendTyping,
  showActionBar,
  systemText,
  SYSTEM_FALLBACK,
  unreadUpToId,
  TYPING_TTL_MS,
} from '../src/features/chat/logic';

const ME = 'me';
const THEM = 'them';
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function msg(id: number, over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    bookingId: 'b1',
    senderId: THEM,
    type: 'TEXT',
    body: `m${id}`,
    clientMessageId: uuid(id),
    createdAt: new Date(Date.UTC(2026, 10, 18, 7, id)).toISOString(),
    readAt: null,
    ...over,
  };
}
const ids = (l: { id: number | null }[]) => l.map(m => m.id);

describe('merge', () => {
  test('dedupes by id and orders ascending', () => {
    const a = ascending([msg(3), msg(2)]);
    const merged = mergeMessages(a, [fromServer(msg(2)), fromServer(msg(4))]);
    expect(ids(merged)).toEqual([2, 3, 4]);
  });

  test('server echo replaces the pending bubble by clientMessageId', () => {
    const pending = makePending({
      bookingId: 'b1',
      senderId: ME,
      body: 'hi',
      clientMessageId: uuid(99),
      now: Date.UTC(2026, 10, 18, 7, 30),
    });
    const withPending = mergeMessages(ascending([msg(1)]), [pending]);
    expect(ids(withPending)).toEqual([1, null]);
    const echoed = mergeMessages(withPending, [
      fromServer(msg(2, { senderId: ME, clientMessageId: uuid(99), body: 'hi' })),
    ]);
    expect(ids(echoed)).toEqual([1, 2]);
    expect(echoed[1].status).toBe('sent');
  });

  test('a resend echo with the same id does not duplicate', () => {
    const one = mergeMessages([], [fromServer(msg(5))]);
    expect(mergeMessages(one, [fromServer(msg(5))])).toHaveLength(1);
  });

  test('pending bubbles stay after server rows even with an older id gap', () => {
    const p = makePending({
      bookingId: 'b1',
      senderId: ME,
      body: 'x',
      clientMessageId: uuid(50),
      now: 0,
    });
    const merged = mergeMessages([p], ascending([msg(9), msg(8)]));
    expect(ids(merged)).toEqual([8, 9, null]);
  });

  test('read time is never erased by a later copy without it', () => {
    const read = fromServer(msg(2, { senderId: ME, readAt: '2026-11-18T08:00:00Z' }));
    const merged = mergeMessages([read], [fromServer(msg(2, { senderId: ME }))]);
    expect(merged[0].readAt).toBe('2026-11-18T08:00:00Z');
  });

  test('a failed bubble goes back to pending on retry, and server rows win over failure', () => {
    const p = makePending({
      bookingId: 'b1',
      senderId: ME,
      body: 'x',
      clientMessageId: uuid(7),
      now: 0,
    });
    const failed = mergeMessages([p], [{ ...p, status: 'failed', errorKey: 'CHAT_RATE_LIMITED' }]);
    expect(failed[0].status).toBe('failed');
    const retried = mergeMessages(failed, [{ ...p, status: 'pending' }]);
    expect(retried[0].status).toBe('pending');
    expect(retried[0].errorKey).toBeUndefined();
    const server = fromServer(msg(3, { senderId: ME, clientMessageId: uuid(7) }));
    const sent = mergeMessages(retried, [server]);
    const late = mergeMessages(sent, [{ ...p, status: 'failed' }]);
    expect(late).toHaveLength(1);
    expect(late[0].status).toBe('sent');
  });
});

describe('cursors', () => {
  test('gap cursor is the highest server id, ignoring pending', () => {
    const p = makePending({
      bookingId: 'b1',
      senderId: ME,
      body: 'x',
      clientMessageId: uuid(1),
      now: 0,
    });
    expect(gapCursor([p])).toBeUndefined();
    expect(gapCursor([...ascending([msg(4), msg(9), msg(6)]), p])).toBe(9);
  });
  test('oldest cursor is the lowest server id', () => {
    expect(oldestCursor(ascending([msg(4), msg(9)]))).toBe(4);
    expect(oldestCursor([])).toBeUndefined();
  });
});

describe('system messages', () => {
  test('known keys translate, unknown never leak the raw body', () => {
    for (const k of [
      'booking.confirmed',
      'booking.completed',
      'booking.completed.automatic',
      'booking.no_show',
      'booking.cancelled',
      'booking.rescheduled',
    ]) {
      expect(systemText(k)).not.toBe(SYSTEM_FALLBACK);
      expect(systemText(k)).not.toContain('booking.');
    }
    expect(systemText('booking.something_new')).toBe(SYSTEM_FALLBACK);
    expect(systemText('Booking confirmed')).toBe(SYSTEM_FALLBACK);
  });
});

describe('typing', () => {
  const T = 1_000_000;
  test('other party typing shows for ~4 s, false clears, own frames ignored', () => {
    const until = nextTypingUntil(0, { userId: THEM, typing: true }, ME, T);
    expect(until).toBe(T + TYPING_TTL_MS);
    expect(isTypingVisible(until, T + 3999)).toBe(true);
    expect(isTypingVisible(until, T + 4000)).toBe(false);
    expect(nextTypingUntil(until, { userId: THEM, typing: false }, ME, T + 1)).toBe(0);
    expect(nextTypingUntil(0, { userId: ME, typing: true }, ME, T)).toBe(0);
  });
  test('outgoing typing is throttled', () => {
    expect(shouldSendTyping(null, T)).toBe(true);
    expect(shouldSendTyping(T, T + 1000)).toBe(false);
    expect(shouldSendTyping(T, T + 3000)).toBe(true);
  });
});

describe('read receipts', () => {
  test('READ frame marks only our messages up to upToId', () => {
    const list = ascending([
      msg(1, { senderId: ME }),
      msg(2, { senderId: THEM }),
      msg(3, { senderId: ME }),
      msg(4, { senderId: ME }),
    ]);
    const out = applyRead(list, { readerId: THEM, upToId: 3, readAt: 'R' });
    expect(out.map(m => m.readAt)).toEqual(['R', null, 'R', null]);
    expect(applyRead(out, { readerId: THEM, upToId: 3, readAt: 'R2' })).toBe(out);
  });
  test('unreadUpToId reports the newest incoming TEXT once', () => {
    const list = ascending([
      msg(1, { senderId: ME }),
      msg(2, { senderId: THEM }),
      msg(3, { senderId: null, type: 'SYSTEM', body: 'booking.confirmed' }),
      msg(4, { senderId: THEM }),
    ]);
    expect(unreadUpToId(list, ME, 0)).toBe(4);
    expect(unreadUpToId(list, ME, 4)).toBeNull();
    expect(unreadUpToId(ascending([msg(1, { senderId: ME })]), ME, 0)).toBeNull();
  });
});

describe('room state and action bar', () => {
  const start = '2026-11-18T07:00:00Z';
  const base = { role: 'LECTURER' as const, status: 'CONFIRMED' as const, startAt: start };
  const T0 = Date.parse(start);
  test('lecturer only, CONFIRMED only, from start time', () => {
    expect(showActionBar({ ...base, now: T0 - 1 })).toBe(false);
    expect(showActionBar({ ...base, now: T0 })).toBe(true);
    expect(showActionBar({ ...base, role: 'STUDENT', now: T0 + 1 })).toBe(false);
    expect(showActionBar({ ...base, role: null, now: T0 + 1 })).toBe(false);
    expect(showActionBar({ ...base, status: 'COMPLETED', now: T0 + 1 })).toBe(false);
    expect(showActionBar({ ...base, status: undefined, now: T0 + 1 })).toBe(false);
    expect(showActionBar({ ...base, now: T0 + 1, closedFrame: true })).toBe(false);
    expect(showActionBar({ ...base, startAt: undefined, now: T0 + 1 })).toBe(false);
  });
  test('closed by frame or by status', () => {
    expect(isRoomClosed('CONFIRMED', false)).toBe(false);
    expect(isRoomClosed(undefined, false)).toBe(false);
    expect(isRoomClosed('CONFIRMED', true)).toBe(true);
    expect(isRoomClosed('NO_SHOW', false)).toBe(true);
    expect(closedNotice('PENDING')).not.toBe(closedNotice('COMPLETED'));
  });
});

describe('list items', () => {
  const NOW = vnDateToInstant(2026, 11, 18, 20, 0).getTime();
  test('newest first with day separators above each day, VN time', () => {
    // 2026-11-17 23:50 UTC is 18/11 06:50 VN; 2026-11-17 16:30 UTC is 17/11 23:30 VN.
    const a = msg(1, { createdAt: '2026-11-17T16:30:00Z' });
    const b = msg(2, { createdAt: '2026-11-17T23:50:00Z' });
    const items = buildListItems(ascending([a, b]), ME, NOW);
    expect(items.map(i => i.kind)).toEqual(['message', 'day', 'message', 'day']);
    expect(items[1]).toMatchObject({ label: 'Hôm nay' });
    expect(items[3]).toMatchObject({ label: 'Hôm qua' });
  });
  test('meta shows once per same-sender minute run; Đã xem only under our last message', () => {
    const list = ascending([
      msg(1, { senderId: THEM, createdAt: '2026-11-18T07:00:05Z' }),
      msg(2, { senderId: THEM, createdAt: '2026-11-18T07:00:40Z' }),
      msg(3, { senderId: ME, createdAt: '2026-11-18T07:01:00Z', readAt: 'R' }),
      msg(4, { senderId: ME, createdAt: '2026-11-18T07:05:00Z', readAt: 'R' }),
    ]);
    const msgs = buildListItems(list, ME, NOW).filter(i => i.kind === 'message') as any[];
    // newest first: 4, 3, 2, 1
    expect(msgs.map(i => i.meta)).toEqual(['14:05 · Đã xem', '14:01', '14:00', null]);
    expect(msgs.map(i => i.showSeen)).toEqual([true, false, false, false]);
  });
  test('SYSTEM rows are translated and pending/failed show status text', () => {
    const sys = fromServer(
      msg(1, { senderId: null, type: 'SYSTEM', body: 'booking.confirmed' }),
    );
    const failed = {
      ...makePending({ bookingId: 'b1', senderId: ME, body: 'x', clientMessageId: uuid(8), now: NOW }),
      status: 'failed' as const,
      errorKey: 'CHAT_RATE_LIMITED',
    };
    const pending = makePending({ bookingId: 'b1', senderId: ME, body: 'y', clientMessageId: uuid(9), now: NOW });
    const items = buildListItems([sys, failed, pending], ME, NOW);
    const kinds = items.map(i => i.kind);
    expect(kinds).toEqual(['message', 'message', 'system', 'day']);
    expect((items[0] as any).meta).toBe('Đang gửi…');
    expect((items[1] as any).meta).toContain('nhanh');
    expect((items[2] as any).text).toBe(systemText('booking.confirmed'));
  });
  test('day labels', () => {
    expect(dayLabel('2026-11-11T05:00:00Z', NOW)).toBe('Thứ Tư 11/11');
    expect(dayLabel('2025-11-11T05:00:00Z', NOW)).toBe('11/11/2025');
  });
});

test('newClientMessageId matches the backend UUID pattern and varies', () => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const a = newClientMessageId();
  expect(a).toMatch(re);
  expect(newClientMessageId()).not.toBe(a);
});
