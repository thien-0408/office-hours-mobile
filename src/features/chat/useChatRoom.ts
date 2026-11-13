import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getChatHistory, markChatRead } from '../../api/chat';
import { queryKeys } from '../../api/hooks/queryKeys';
import {
  stompPublish,
  useStompConnectCount,
  useStompState,
  useStompSubscription,
} from '../../realtime/stomp';
import {
  applyRead,
  ascending,
  fromServer,
  gapCursor,
  isTypingVisible,
  makePending,
  mergeMessages,
  newClientMessageId,
  nextTypingUntil,
  oldestCursor,
  shouldSendTyping,
  unreadUpToId,
  type ChatErrorFrame,
  type RoomFrame,
  type TypingFrame,
  type UiMessage,
} from './logic';

const PAGE = 50;
const MAX_GAP_PAGES = 10;
const SEND_TIMEOUT_MS = 10_000;
const TYPING_IDLE_MS = 2500;

export type ChatRoom = {
  messages: UiMessage[]; // ascending
  loading: boolean;
  loadError: boolean;
  hasOlder: boolean;
  loadingOlder: boolean;
  /** A ROOM_CLOSED frame or a CHAT_NOT_OPEN rejection arrived. */
  closedFrame: boolean;
  otherTyping: boolean;
  connected: boolean;
  reload: () => void;
  loadOlder: () => void;
  send: (body: string) => void;
  retry: (clientMessageId: string) => void;
  notifyTyping: () => void;
  stopTyping: () => void;
};

export function useChatRoom(
  bookingId: string,
  selfId: string | null | undefined,
  canSend: boolean,
): ChatRoom {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [closedFrame, setClosedFrame] = useState(false);
  const [typingUntil, setTypingUntil] = useState(0);
  const [, setTick] = useState(0);

  const state = useStompState();
  const connectCount = useStompConnectCount();
  const connected = state === 'connected';

  const messagesRef = useRef<UiMessage[]>([]);
  const loadedRef = useRef(false);
  const reportedRef = useRef(0);
  const sendTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const lastTypingSent = useRef<number | null>(null);
  const typingIdle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const apply = useCallback((fn: (prev: UiMessage[]) => UiMessage[]) => {
    const next = fn(messagesRef.current);
    messagesRef.current = next;
    setMessages(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const timers = sendTimers.current;
    return () => {
      mounted.current = false;
      timers.forEach(t => clearTimeout(t));
      timers.clear();
      if (typingIdle.current) {
        clearTimeout(typingIdle.current);
      }
    };
  }, []);

  // ---- initial history (newest page) ----
  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const page = await getChatHistory(bookingId, { limit: PAGE });
      if (!mounted.current) {
        return;
      }
      apply(prev => mergeMessages(prev, ascending(page)));
      setHasOlder(page.length >= PAGE);
      loadedRef.current = true;
    } catch {
      if (mounted.current) {
        setLoadError(true);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [bookingId, apply]);

  useEffect(() => {
    loadedRef.current = false;
    messagesRef.current = [];
    setMessages([]);
    reportedRef.current = 0;
    loadInitial();
  }, [loadInitial]);

  const loadOlder = useCallback(async () => {
    const before = oldestCursor(messagesRef.current);
    if (!loadedRef.current || loadingOlder || !hasOlder || before === undefined) {
      return;
    }
    setLoadingOlder(true);
    try {
      const page = await getChatHistory(bookingId, { before, limit: PAGE });
      if (!mounted.current) {
        return;
      }
      apply(prev => mergeMessages(prev, ascending(page)));
      setHasOlder(page.length >= PAGE);
    } catch {
      // keep hasOlder: the next scroll to the top tries again
    } finally {
      if (mounted.current) {
        setLoadingOlder(false);
      }
    }
  }, [bookingId, apply, hasOlder, loadingOlder]);

  // ---- gap fetch after every (re)connect: ?after=<last id>, ascending ----
  useEffect(() => {
    if (connectCount === 0 || !loadedRef.current) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        for (let i = 0; i < MAX_GAP_PAGES && !cancelled; i++) {
          const after = gapCursor(messagesRef.current);
          if (after === undefined) {
            return;
          }
          const page = await getChatHistory(bookingId, { after, limit: 100 });
          if (cancelled || !mounted.current) {
            return;
          }
          apply(prev => mergeMessages(prev, page.map(fromServer)));
          if (page.length < 100) {
            return;
          }
        }
      } catch {
        // the next reconnect or a manual reload covers it
      }
    })();
    return () => {
      cancelled = true;
    };
    // loading flips false when history lands, which also covers "connected before history".
  }, [connectCount, loading, bookingId, apply]);

  // ---- live frames ----
  const clearSendTimer = (clientMessageId: string | null) => {
    if (!clientMessageId) {
      return;
    }
    const t = sendTimers.current.get(clientMessageId);
    if (t) {
      clearTimeout(t);
      sendTimers.current.delete(clientMessageId);
    }
  };

  const failPending = useCallback(
    (clientMessageId: string, errorKey?: string) => {
      apply(prev =>
        prev.map(m =>
          m.clientMessageId === clientMessageId && m.id === null
            ? { ...m, status: 'failed' as const, errorKey }
            : m,
        ),
      );
    },
    [apply],
  );

  useStompSubscription<RoomFrame>(
    `/topic/bookings/${bookingId}/messages`,
    frame => {
      if (frame.kind === 'MESSAGE') {
        clearSendTimer(frame.clientMessageId);
        apply(prev => mergeMessages(prev, [fromServer(frame)]));
        if (frame.type === 'SYSTEM') {
          qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
        }
      } else if (frame.kind === 'READ') {
        if (frame.readerId !== selfId) {
          apply(prev => applyRead(prev, frame));
        }
      } else if (frame.kind === 'ROOM_CLOSED') {
        setClosedFrame(true);
        qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      }
    },
  );

  useStompSubscription<TypingFrame>(
    `/topic/bookings/${bookingId}/typing`,
    frame => {
      setTypingUntil(prev => nextTypingUntil(prev, frame, selfId, Date.now()));
    },
  );

  useStompSubscription<ChatErrorFrame>('/user/queue/chat-errors', frame => {
    if (frame.error === 'CHAT_NOT_OPEN') {
      setClosedFrame(true);
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    }
    if (frame.clientMessageId) {
      clearSendTimer(frame.clientMessageId);
      failPending(frame.clientMessageId, frame.error);
    }
  });

  // Hide the typing indicator when it expires.
  useEffect(() => {
    if (!isTypingVisible(typingUntil, Date.now())) {
      return undefined;
    }
    const t = setTimeout(() => setTick(n => n + 1), typingUntil - Date.now() + 20);
    return () => clearTimeout(t);
  }, [typingUntil]);

  // ---- read receipts ----
  useEffect(() => {
    if (!selfId || AppState.currentState !== 'active') {
      return;
    }
    const upTo = unreadUpToId(messages, selfId, reportedRef.current);
    if (upTo === null) {
      return;
    }
    reportedRef.current = upTo;
    markChatRead(bookingId, upTo).catch(() => {
      // allow a retry on the next incoming message
      reportedRef.current = Math.min(reportedRef.current, upTo - 1);
    });
  }, [messages, selfId, bookingId]);

  // ---- sending ----
  const publishMessage = useCallback(
    (clientMessageId: string, body: string) => {
      clearSendTimer(clientMessageId);
      const ok = stompPublish(`/app/bookings/${bookingId}/messages`, {
        clientMessageId,
        body,
      });
      if (!ok) {
        failPending(clientMessageId);
        return;
      }
      sendTimers.current.set(
        clientMessageId,
        setTimeout(() => {
          sendTimers.current.delete(clientMessageId);
          failPending(clientMessageId);
        }, SEND_TIMEOUT_MS),
      );
    },
    [bookingId, failPending],
  );

  const send = useCallback(
    (raw: string) => {
      const body = raw.trim();
      if (!body || !selfId || !canSend) {
        return;
      }
      const clientMessageId = newClientMessageId();
      apply(prev =>
        mergeMessages(prev, [
          makePending({ bookingId, senderId: selfId, body, clientMessageId, now: Date.now() }),
        ]),
      );
      publishMessage(clientMessageId, body);
    },
    [apply, bookingId, canSend, publishMessage, selfId],
  );

  const retry = useCallback(
    (clientMessageId: string) => {
      const m = messagesRef.current.find(
        x => x.clientMessageId === clientMessageId && x.id === null,
      );
      if (!m || !canSend) {
        return;
      }
      // Same clientMessageId: the server dedupes a resend, so a lost echo cannot double-post.
      // Only a REUSED rejection needs a fresh id.
      const reuse = m.errorKey === 'CHAT_CLIENT_MESSAGE_ID_REUSED';
      const id = reuse ? newClientMessageId() : clientMessageId;
      apply(prev =>
        mergeMessages(
          prev.filter(x => x !== m),
          [{ ...m, clientMessageId: id, status: 'pending', errorKey: undefined }],
        ),
      );
      publishMessage(id, m.body);
    },
    [apply, canSend, publishMessage],
  );

  // ---- typing out ----
  const sendTyping = useCallback(
    (typing: boolean) => {
      stompPublish(`/app/bookings/${bookingId}/typing`, { typing });
    },
    [bookingId],
  );

  const stopTyping = useCallback(() => {
    if (typingIdle.current) {
      clearTimeout(typingIdle.current);
      typingIdle.current = null;
    }
    if (lastTypingSent.current !== null) {
      lastTypingSent.current = null;
      sendTyping(false);
    }
  }, [sendTyping]);

  const notifyTyping = useCallback(() => {
    if (!canSend) {
      return;
    }
    const now = Date.now();
    if (shouldSendTyping(lastTypingSent.current, now)) {
      lastTypingSent.current = now;
      sendTyping(true);
    }
    if (typingIdle.current) {
      clearTimeout(typingIdle.current);
    }
    typingIdle.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [canSend, sendTyping, stopTyping]);

  const reload = useCallback(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    messages,
    loading,
    loadError,
    hasOlder,
    loadingOlder,
    closedFrame,
    otherTyping: isTypingVisible(typingUntil, Date.now()),
    connected,
    reload,
    loadOlder,
    send,
    retry,
    notifyTyping,
    stopTyping,
  };
}

