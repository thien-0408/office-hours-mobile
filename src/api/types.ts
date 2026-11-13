// Mirrors backend DTOs (OfficeHours/src/main/java/eiu/officehours/{auth,user}/model).
// ids are UUID strings; success responses have no envelope.

export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN';
export type Locale = 'vi' | 'en';

/** AuthUserResponse. `department` is always present, null when unset. */
export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string | null;
};

/** LoginResponse. expiresIn = access-token lifetime in seconds. */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

/** RefreshResponse. Refresh tokens rotate: always store the new pair. */
export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type MessageResponse = { message: string };

/** RegisterRequest. Only STUDENT and LECTURER may self-register. */
export type RegisterRequest = {
  email: string;
  password: string; // 8..72 chars
  fullName: string; // max 150
  role: Exclude<UserRole, 'ADMIN'>;
  department?: string; // max 100
};

export type NotificationPrefs = {
  bookingConfirmed: boolean;
  bookingDeclined: boolean;
  waitlistOffer: boolean;
  reminders: boolean;
};

/** UserProfileResponse = AuthUser + notificationPrefs. */
export type UserProfile = AuthUser & { notificationPrefs: NotificationPrefs };

/**
 * ProfileUpdationRequest (PATCH /users/me). Omitted key = keep current value;
 * `department: null` / `officeRoomId: null` = clear. officeRoomId: LECTURER only (403 otherwise).
 */
export type UpdateProfilePayload = {
  fullName?: string;
  department?: string | null;
  officeRoomId?: string | null;
  notificationPrefs?: Partial<NotificationPrefs>;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string; // 8..72 chars
};
