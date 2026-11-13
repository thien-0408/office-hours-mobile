import { api } from './client';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from './types';

/** GET /users/me */
export function me(): Promise<UserProfile> {
  return api.get<UserProfile>('/users/me');
}

/** PATCH /users/me (partial; omitted keys are kept). */
export function updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
  return api.patch<UserProfile>('/users/me', payload);
}

/** POST /users/me/change-password -> 204. */
export function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return api.post('/users/me/change-password', payload);
}
