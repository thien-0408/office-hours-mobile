import { api } from './client';
import type {
  AdminUser,
  AdminUpdateUserPayload,
  AdminUserListQuery,
  Page,
} from './domainTypes';

/** GET /users?role&department&q&page&size&sort (admin). */
export function listUsers(
  query: AdminUserListQuery = {},
): Promise<Page<AdminUser>> {
  return api.get<Page<AdminUser>>('/users', { query });
}

/** GET /users/{id} (admin). */
export function getUser(id: string): Promise<AdminUser> {
  return api.get<AdminUser>(`/users/${id}`);
}

/** PATCH /users/{id} (admin). 400 CANNOT_MODIFY_SELF, 409 LAST_ADMIN_REQUIRED. */
export function updateUser(
  id: string,
  payload: AdminUpdateUserPayload,
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/users/${id}`, payload);
}

/** DELETE /users/{id} -> 204 (deactivates). 400 CANNOT_MODIFY_SELF, 409 LAST_ADMIN_REQUIRED. */
export function deactivateUser(id: string): Promise<void> {
  return api.delete(`/users/${id}`);
}
