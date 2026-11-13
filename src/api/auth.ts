import { api } from './client';
import { clearTokens, getRefreshToken, setTokens } from './tokenStore';
import type {
  AuthUser,
  LoginResponse,
  MessageResponse,
  RefreshResponse,
  RegisterRequest,
} from './types';

/** POST /auth/login. Stores the token pair. Public, rate limited (429 AUTH_RATE_LIMITED). */
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(
    '/auth/login',
    { email, password },
    { auth: false },
  );
  await setTokens({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
  return res;
}

/** POST /auth/register -> 201 AuthUser, no tokens (call login afterwards). */
export function register(payload: RegisterRequest): Promise<AuthUser> {
  return api.post<AuthUser>('/auth/register', payload, { auth: false });
}

/**
 * POST /auth/refresh with { refreshToken } in the body (no cookie). Rotates the pair.
 * The HTTP client refreshes automatically on 401; call this only for an explicit refresh.
 */
export async function refresh(): Promise<RefreshResponse> {
  const refreshToken = await getRefreshToken();
  const res = await api.post<RefreshResponse>(
    '/auth/refresh',
    { refreshToken },
    { auth: false },
  );
  await setTokens({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
  return res;
}

/** POST /auth/logout (204). Revokes all refresh sessions. Local tokens are cleared even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearTokens();
  }
}

/** POST /auth/forgot-password -> 202, always, whether or not the email exists. */
export function forgotPassword(email: string): Promise<MessageResponse> {
  return api.post<MessageResponse>(
    '/auth/forgot-password',
    { email },
    { auth: false },
  );
}

/** POST /auth/reset-password -> 204. 400 INVALID_RESET_TOKEN for a bad/expired/used token. */
export function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  return api.post(
    '/auth/reset-password',
    { token, newPassword },
    { auth: false },
  );
}
