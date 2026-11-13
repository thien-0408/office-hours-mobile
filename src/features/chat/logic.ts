import type {
  Booking,
  ChatMessage,
  Uuid,
} from '../../api/domainTypes';
import type { UserRole } from '../../api/types';
import { formatVnDate, formatVnDayTime, formatVnTime, vnParts } from '../../api/time';

// ---- wire frames (backend chat/model/responses) ----
export type MessageFrame = ChatMessage & { kind: 'MESSAGE' };
export type ReadFrame = {
  kind: 'READ';
  bookingId: Uuid;
  readerId: Uuid;
  upToId: number;
  readAt: string;
};
export type RoomClosedFrame = {
  kind: 'ROOM_CLOSED';
  bookingId: Uuid;
  status: string;
};
export type RoomFrame = MessageFrame | ReadFrame | RoomClosedFrame;
export type TypingFrame = { userId: Uuid; typing: boolean };
export type ChatErrorFrame = { clientMessageId: string | null; error: string };

// ---- messages ----
export type SendStatus = 'sent' | 'pending' | 'failed';

/** A history/live message, or an optimistic one (`id` null until the server echoes it). */
export type UiMessage = Omit<ChatMessage, 'id'> & {
  id: number | null;
  status: SendStatus;
  /** Error key from /user/queue/chat-errors, only on `failed`. */
  errorKey?: string;
};

export function fromServer(m: ChatMessage): UiMessage {
  return {
    id: m.id,
    bookingId: m.bookingId,
    senderId: m.senderId,
    type: m.type,
    body: m.body,
    clientMessageId: m.clientMessageId,
    createdAt: m.createdAt,
    readAt: m.readAt,
    status: 'sent',
  };
}

export function makePending(args: {
  bookingId: Uuid;
  senderId: Uuid;
  body: string;
  clientMessageId: Uuid;
  now: number;
}): UiMessage {
  return {
    id: null,
    bookingId: args.bookingId,
    senderId: args.senderId,
    type: 'TEXT',
    body: args.body,
    clientMessageId: args.clientMessageId,
    createdAt: new Date(args.now).toISOString(),
    readAt: null,
    status: 'pending',
  };
}

/** RFC 4122 v4 shape; the backend validates the pattern only. Hermes has no crypto.randomUUID. */
export function newClientMessageId(rand: () => number = Math.random): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(rand() * 16);
    return (c === 'x' ? r : 8 + (r % 4)).toString(16);
  });
}

function byOrder(a: UiMessage, b: UiMessage): number {
  // Server rows first by id; not-yet-acknowledged ones after, in the order they were typed.
  if (a.id !== null && b.id !== null) {
    return a.id - b.id;
  }
  if (a.id !== null) {
    return -1;
  }
  if (b.id !== null) {
    return 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

/**
 * Merge `incoming` into `existing`, ascending (oldest first). Dedupes by `id` and by
 * `clientMessageId` (the server echo replaces the optimistic bubble). A server row never
 * goes back to pending/failed, and a known `readAt` is never erased.
 */
export function mergeMessages(
  existing: UiMessage[],
  incoming: UiMessage[],
): UiMessage[] {
  const byId = new Map<number, UiMessage>();
  const byClient = new Map<string, UiMessage>();
  const loose: UiMessage[] = [];
  const add = (m: UiMessage) => {
    const prior =
      (m.id !== null ? byId.get(m.id) : undefined) ??
      (m.clientMessageId ? byClient.get(m.clientMessageId) : undefined);
    let next = m;
    if (prior) {
      const keepServer = prior.id !== null && m.id === null;
      next = keepServer ? { ...prior } : { ...prior, ...m };
      next.readAt = m.readAt ?? prior.readAt;
      if (next.id !== null) {
        next.status = 'sent';
      }
      if (next.status !== 'failed') {
        delete next.errorKey;
      }
      if (prior.id !== null) {
        byId.delete(prior.id);
      }
      if (prior.clientMessageId) {
        byClient.delete(prior.clientMessageId);
      }
      const at = loose.indexOf(prior);
      if (at >= 0) {
        loose.splice(at, 1);
      }
    }
    if (next.id !== null) {
      byId.set(next.id, next);
    } else {
      loose.push(next);
    }
    if (next.clientMessageId) {
      byClient.set(next.clientMessageId, next);
    }
  };
  existing.forEach(add);
  incoming.forEach(add);
  return [...byId.values(), ...loose].sort(byOrder);
}

/** Highest server id we hold: the `?after=` cursor for the gap fetch. */
export function gapCursor(messages: UiMessage[]): number | undefined {
  let max: number | undefined;
  for (const m of messages) {
    if (m.id !== null && (max === undefined || m.id > max)) {
      max = m.id;
    }
  }
  return max;
}

/** Lowest server id: the `?before=` cursor to load older history. */
export function oldestCursor(messages: UiMessage[]): number | undefined {
  let min: number | undefined;
  for (const m of messages) {
    if (m.id !== null && (min === undefined || m.id < min)) {
      min = m.id;
    }
  }
  return min;
}

/** Newest-first page from the API -> ascending. */
export function ascending(page: ChatMessage[]): UiMessage[] {
  return page.map(fromServer).sort(byOrder);
}

/** The other participant read our messages up to `upToId`. */
export function applyRead(
  messages: UiMessage[],
  frame: Pick<ReadFrame, 'readerId' | 'upToId' | 'readAt'>,
): UiMessage[] {
  let changed = false;
  const next = messages.map(m => {
    if (
      m.id !== null &&
      m.id <= frame.upToId &&
      m.senderId !== null &&
      m.senderId !== frame.readerId &&
      !m.readAt
    ) {
      changed = true;
      return { ...m, readAt: frame.readAt };
    }
    return m;
  });
  return changed ? next : messages;
}

/** Highest id of a message from the other side that we have not reported as read. */
export function unreadUpToId(
  messages: UiMessage[],
  selfId: Uuid | null | undefined,
  alreadyReported: number,
): number | null {
  let max = 0;
  for (const m of messages) {
    if (
      m.id !== null &&
      m.type === 'TEXT' &&
      m.senderId !== null &&
      m.senderId !== selfId &&
      m.id > max
    ) {
      max = m.id;
    }
  }
  return max > alreadyReported ? max : null;
}

// ---- SYSTEM messages ----
export const SYSTEM_TEXT: Record<string, string> = {
  'booking.confirmed': 'Lịch hẹn đã được xác nhận. Hai bên có thể nhắn tin ở đây.',
  'booking.completed': 'Buổi hẹn đã hoàn thành.',
  'booking.completed.automatic': 'Buổi hẹn đã tự động đánh dấu hoàn thành.',
  'booking.no_show': 'Sinh viên đã vắng mặt trong buổi hẹn.',
  'booking.cancelled': 'Lịch hẹn đã bị hủy.',
  'booking.rescheduled': 'Lịch hẹn đã được đổi sang giờ khác.',
};
export const SYSTEM_FALLBACK = 'Lịch hẹn có cập nhật mới.';

/** Vietnamese text for a SYSTEM message key. Unknown keys never leak the raw body. */
export function systemText(key: string): string {
  return SYSTEM_TEXT[key] ?? SYSTEM_FALLBACK;
}

// ---- send errors ----
export const SEND_ERROR_TEXT: Record<string, string> = {
  CHAT_NOT_OPEN: 'Phòng chat đã đóng.',
  CHAT_RATE_LIMITED: 'Bạn nhắn quá nhanh. Đợi một chút rồi gửi lại.',
  CHAT_CLIENT_MESSAGE_ID_REUSED: 'Tin nhắn bị trùng. Hãy gửi lại.',
  VALIDATION_FAILED: 'Tin nhắn chưa hợp lệ (trống hoặc quá 2.000 ký tự).',
};
export function sendErrorText(key: string | undefined): string {
  return (key && SEND_ERROR_TEXT[key]) || 'Chưa gửi được.';
}

// ---- typing ----
export const TYPING_TTL_MS = 4000;
export const TYPING_SEND_INTERVAL_MS = 3000;

/** Expiry timestamp of the other party's typing indicator after a frame (0 = not typing). */
export function nextTypingUntil(
  prevUntil: number,
  frame: TypingFrame,
  selfId: Uuid | null | undefined,
  now: number,
): number {
  if (frame.userId === selfId) {
    return prevUntil;
  }
  return frame.typing ? now + TYPING_TTL_MS : 0;
}

export function isTypingVisible(until: number, now: number): boolean {
  return until > now;
}

/** Throttle for outgoing `{typing:true}`: send at most once per interval. */
export function shouldSendTyping(
  lastSentAt: number | null,
  now: number,
  intervalMs = TYPING_SEND_INTERVAL_MS,
): boolean {
  return lastSentAt === null || now - lastSentAt >= intervalMs;
}

// ---- room state / actions ----
export function isRoomClosed(
  bookingStatus: Booking['status'] | undefined,
  closedFrame: boolean,
): boolean {
  return closedFrame || (bookingStatus !== undefined && bookingStatus !== 'CONFIRMED');
}

export const CLOSED_NOTICE = 'Buổi hẹn đã kết thúc. Bạn vẫn đọc được lịch sử trò chuyện.';
export const CLOSED_NOTICE_BEFORE_OPEN =
  'Phòng chat mở khi lịch hẹn được xác nhận.';

export function closedNotice(bookingStatus: Booking['status'] | undefined): string {
  return bookingStatus === 'PENDING' ? CLOSED_NOTICE_BEFORE_OPEN : CLOSED_NOTICE;
}

/** "Đã gặp" / "Vắng mặt": lecturer only, booking CONFIRMED, from the start time. */
export function showActionBar(args: {
  role: UserRole | null;
  status: Booking['status'] | undefined;
  startAt: string | undefined;
  now: number;
  closedFrame?: boolean;
}): boolean {
  if (args.role !== 'LECTURER' || args.status !== 'CONFIRMED' || args.closedFrame) {
    return false;
  }
  if (!args.startAt) {
    return false;
  }
  const start = Date.parse(args.startAt);
  return !Number.isNaN(start) && args.now >= start;
}

// ---- list model (inverted list: index 0 = newest) ----
export type DayItem = { kind: 'day'; key: string; label: string };
export type MessageItem = {
  kind: 'message';
  key: string;
  message: UiMessage;
  mine: boolean;
  /** "13:59", or "13:59 · Đã xem" */
  meta: string | null;
  showSeen: boolean;
};
export type SystemItem = { kind: 'system'; key: string; text: string };
export type ListItem = DayItem | MessageItem | SystemItem;

export function itemKey(m: UiMessage): string {
  return m.clientMessageId ? `c:${m.clientMessageId}` : `i:${m.id}`;
}

function dayKey(iso: string): string {
  const p = vnParts(iso);
  return `${p.year}-${p.month}-${p.day}`;
}

/** "Hôm nay" / "Hôm qua" / "Thứ Tư 18/11" / "18/11/2025" (other year), in VN time. */
export function dayLabel(iso: string, now: number): string {
  const d = vnParts(iso);
  const n = vnParts(now);
  const today = Date.UTC(n.year, n.month - 1, n.day);
  const msgDay = Date.UTC(d.year, d.month - 1, d.day);
  const diff = Math.round((today - msgDay) / 86_400_000);
  if (diff === 0) {
    return 'Hôm nay';
  }
  if (diff === 1) {
    return 'Hôm qua';
  }
  if (d.year !== n.year) {
    return formatVnDate(iso);
  }
  return formatVnDayTime(iso).split(' · ')[0];
}

/**
 * Ascending messages -> newest-first list items with day separators (a separator sits above the
 * first message of its day, i.e. after it in newest-first order), time meta under the last
 * bubble of each same-sender same-minute run, and "Đã xem" under our last sent message.
 */
export function buildListItems(
  messages: UiMessage[],
  selfId: Uuid | null | undefined,
  now: number,
): ListItem[] {
  let lastOwnId: number | null = null;
  for (const m of messages) {
    if (m.type === 'TEXT' && m.senderId === selfId && m.id !== null) {
      lastOwnId = m.id;
    }
  }
  const out: ListItem[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const newer = messages[i + 1];
    if (m.type === 'SYSTEM') {
      out.push({ kind: 'system', key: itemKey(m), text: systemText(m.body) });
    } else {
      const mine = m.senderId === selfId;
      const runContinues =
        !!newer &&
        newer.type === 'TEXT' &&
        newer.senderId === m.senderId &&
        formatVnTime(newer.createdAt) === formatVnTime(m.createdAt);
      const showSeen = mine && m.id !== null && m.id === lastOwnId && !!m.readAt;
      let meta: string | null = null;
      if (m.status === 'pending') {
        meta = 'Đang gửi…';
      } else if (m.status === 'failed') {
        meta = sendErrorText(m.errorKey);
      } else if (!runContinues || showSeen) {
        meta = formatVnTime(m.createdAt) + (showSeen ? ' · Đã xem' : '');
      }
      out.push({ kind: 'message', key: itemKey(m), message: m, mine, meta, showSeen });
    }
    const older = messages[i - 1];
    if (!older || dayKey(older.createdAt) !== dayKey(m.createdAt)) {
      out.push({
        kind: 'day',
        key: `d:${dayKey(m.createdAt)}`,
        label: dayLabel(m.createdAt, now),
      });
    }
  }
  return out;
}
