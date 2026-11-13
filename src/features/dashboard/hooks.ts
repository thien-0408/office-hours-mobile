import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { focusManager, useQuery } from '@tanstack/react-query';
import { listBookings } from '../../api/bookings';
import {
  dayRangeVn,
  sortByStart,
  vnDateString,
  weekRangeVn,
} from '../../api/bookingTime';
import type { BookingListQuery } from '../../api/domainTypes';
import { queryKeys } from '../../api/hooks/queryKeys';
import { listNotifications } from '../../api/notifications';

/** Polling interval while the app is in the foreground. */
export const BOOKINGS_POLL_MS = 60_000;

// React Query only knows "focus" from the browser; on RN tie it to AppState so
// refetchInterval pauses while the app is in the background (refetchIntervalInBackground
// is false by default and consults focusManager).
focusManager.setEventListener(handleFocus => {
  const sub = AppState.addEventListener('change', state =>
    handleFocus(state === 'active'),
  );
  return () => sub.remove();
});

/** Re-renders every `intervalMs` (default 30 s) with the current time. */
export function useNowTick(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * The viewer's CONFIRMED bookings from the start of today onward (VN date), soonest first.
 * Shared by the dashboard "next meeting" card and the floating now-card (same cache entry).
 * TODO(MO-20): replace polling with the Firestore users/{uid}/bookings listener.
 */
export function useUpcomingConfirmed(enabled = true) {
  const from = vnDateString(Date.now());
  const query: BookingListQuery = {
    status: 'CONFIRMED',
    from,
    size: 50,
    sort: 'startAt,asc',
  };
  return useQuery({
    queryKey: queryKeys.bookings.list(query),
    queryFn: () => listBookings(query),
    select: page => sortByStart(page.content),
    enabled,
    refetchInterval: BOOKINGS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** All of the viewer's bookings in the current Monday..Sunday (VN), any status. */
export function useWeekBookings(enabled = true) {
  const { from, to } = weekRangeVn();
  const query: BookingListQuery = { from, to, size: 100, sort: 'startAt,asc' };
  return useQuery({
    queryKey: queryKeys.bookings.list(query),
    queryFn: () => listBookings(query),
    select: page => page.content,
    enabled,
    refetchInterval: BOOKINGS_POLL_MS,
  });
}

/** All of the viewer's bookings today (VN), any status. */
export function useTodayBookings(enabled = true) {
  const { from, to } = dayRangeVn();
  const query: BookingListQuery = { from, to, size: 100, sort: 'startAt,asc' };
  return useQuery({
    queryKey: queryKeys.bookings.list(query),
    queryFn: () => listBookings(query),
    select: page => page.content,
    enabled,
    refetchInterval: BOOKINGS_POLL_MS,
  });
}

/** Number of PENDING bookings (totalElements of a size-1 page). Lecturer's "Duyệt" badge. */
export function usePendingCount(enabled = true) {
  const query: BookingListQuery = { status: 'PENDING', size: 1 };
  return useQuery({
    queryKey: queryKeys.bookings.list(query),
    queryFn: () => listBookings(query),
    select: page => page.totalElements,
    enabled,
    refetchInterval: BOOKINGS_POLL_MS,
  });
}

/** Number of unread notifications (totalElements of a size-1 page). Admin's tab badge. */
export function useUnreadCount(enabled = true) {
  const query = { unreadOnly: true, size: 1 };
  return useQuery({
    queryKey: queryKeys.notifications.list(query),
    queryFn: () => listNotifications(query),
    select: page => page.totalElements,
    enabled,
    refetchInterval: BOOKINGS_POLL_MS,
  });
}
