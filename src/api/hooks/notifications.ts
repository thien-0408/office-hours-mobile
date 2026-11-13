import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../notifications';
import type { NotificationListQuery } from '../domainTypes';
import { DEFAULT_PAGE_SIZE, pageInfiniteOptions } from './pagination';
import { queryKeys } from './queryKeys';

export function useNotifications(
  filters: Omit<NotificationListQuery, 'page'> = {},
) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: ({ pageParam }) =>
      listNotifications({
        size: DEFAULT_PAGE_SIZE,
        ...filters,
        page: pageParam,
      }),
    ...pageInfiniteOptions,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
