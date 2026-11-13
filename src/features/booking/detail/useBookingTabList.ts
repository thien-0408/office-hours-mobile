import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listBookings } from '../../../api/bookings';
import type { Booking } from '../../../api/domainTypes';
import {
  DEFAULT_PAGE_SIZE,
  flattenPages,
  pageInfiniteOptions,
} from '../../../api/hooks/pagination';
import { queryKeys } from '../../../api/hooks/queryKeys';
import {
  sortBookingsForTab,
  tabStatuses,
  type BookingTab,
} from './bookingLogic';

/**
 * Infinite list for a tab. Tabs with two statuses run two queries (both use the shared
 * ['bookings','list', ...] keys, so mutations invalidate them) and merge by start time.
 */
export function useBookingTabList(tab: BookingTab) {
  const [s1, s2] = tabStatuses(tab);
  const q1 = useInfiniteQuery({
    queryKey: queryKeys.bookings.list({ status: s1 }),
    queryFn: ({ pageParam }) =>
      listBookings({ size: DEFAULT_PAGE_SIZE, status: s1, page: pageParam }),
    ...pageInfiniteOptions,
  });
  const q2 = useInfiniteQuery({
    queryKey: queryKeys.bookings.list({ status: s2 ?? s1 }),
    queryFn: ({ pageParam }) =>
      listBookings({
        size: DEFAULT_PAGE_SIZE,
        status: s2 ?? s1,
        page: pageParam,
      }),
    enabled: s2 !== undefined,
    ...pageInfiniteOptions,
  });

  const items: Booking[] = useMemo(() => {
    const all = [
      ...flattenPages(q1.data),
      ...(s2 ? flattenPages(q2.data) : []),
    ];
    return sortBookingsForTab(all, tab);
  }, [q1.data, q2.data, s2, tab]);

  const queries = s2 ? [q1, q2] : [q1];
  const total =
    q1.data?.pages[0]?.totalElements === undefined
      ? undefined
      : q1.data.pages[0].totalElements +
        (s2 ? q2.data?.pages[0]?.totalElements ?? 0 : 0);
  return {
    items,
    total,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.every(q => q.isError),
    isRefetching: queries.some(q => q.isRefetching && !q.isFetchingNextPage),
    hasNextPage: queries.some(q => q.hasNextPage),
    isFetchingNextPage: queries.some(q => q.isFetchingNextPage),
    fetchNextPage: () => {
      for (const q of queries) {
        if (q.hasNextPage && !q.isFetchingNextPage) {
          q.fetchNextPage();
        }
      }
    },
    refetch: () => Promise.all(queries.map(q => q.refetch())),
  };
}
