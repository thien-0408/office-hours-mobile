import { api } from './client';
import type {
  AppNotification,
  NotificationListQuery,
  Page,
} from './domainTypes';

/** GET /notifications?unreadOnly&since&page&size&sort -> Page. Title/body follow Accept-Language. */
export function listNotifications(
  query: NotificationListQuery = {},
): Promise<Page<AppNotification>> {
  return api.get<Page<AppNotification>>('/notifications', { query });
}

/** POST /notifications/{id}/read -> the updated notification. */
export function markNotificationRead(id: string): Promise<AppNotification> {
  return api.post<AppNotification>(`/notifications/${id}/read`);
}

/** POST /notifications/read-all -> 204. */
export function markAllNotificationsRead(): Promise<void> {
  return api.post('/notifications/read-all');
}
