import { api } from './client';
import type { ChatHistoryQuery, ChatMessage } from './domainTypes';

/**
 * GET /bookings/{id}/messages?before|after&limit. Plain array.
 * No cursor or `before`: newest first. `after`: ascending (catch up after a disconnect).
 * Sending both cursors is a 400. limit 1..100, default 50. Cursors are message ids.
 */
export function getChatHistory(
  bookingId: string,
  query: ChatHistoryQuery = {},
): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/bookings/${bookingId}/messages`, { query });
}

/** POST /bookings/{id}/messages/read { upToId } -> 204. upToId >= 1. Admin gets 403. */
export function markChatRead(bookingId: string, upToId: number): Promise<void> {
  return api.post(`/bookings/${bookingId}/messages/read`, { upToId });
}
