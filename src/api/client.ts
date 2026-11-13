import { getApiBaseUrl, REQUEST_TIMEOUT_MS } from './config';
import { ApiError, ApiErrorBody, buildApiError, NetworkError } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStore';
import type { Locale, RefreshResponse } from './types';

// ---- locale (sent as Accept-Language) ----
let locale: Locale = 'vi';
export function setLocale(next: Locale): void {
  locale = next;
}
export function getLocale(): Locale {
  return locale;
}

// ---- sessionExpired event ----
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

/** Fires when a refresh fails and the stored tokens were cleared. Returns unsubscribe. */
export function onSessionExpired(listener: Listener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function emitSessionExpired(): void {
  sessionExpiredListeners.forEach(l => l());
}

// ---- request ----
export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Attach the bearer token (default true). Use false for public endpoints. */
  auth?: boolean;
  timeoutMs?: number;
};

function newRequestId(): string {
  // Backend accepts ^[A-Za-z0-9._-]{8,64}$
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand()}${rand()}`;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  let url = getApiBaseUrl() + (path.startsWith('/') ? path : `/${path}`);
  if (query) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    if (parts.length) {
      url += `?${parts.join('&')}`;
    }
  }
  return url;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) {
    return undefined;
  }
  const text = await res.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** One HTTP round trip: no refresh logic. Throws ApiError (non-2xx) or NetworkError. */
async function send<T>(
  path: string,
  opts: RequestOptions,
  accessToken: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': locale,
    'X-Request-Id': newRequestId(),
  };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw new NetworkError(
      timedOut
        ? 'Request timed out'
        : e instanceof Error
        ? e.message
        : 'Network request failed',
      timedOut,
    );
  } finally {
    clearTimeout(timer);
  }

  const body = await parseBody(res);
  if (!res.ok) {
    throw buildApiError(
      res.status,
      (body ?? null) as ApiErrorBody | null,
      res.headers,
    );
  }
  return body as T;
}

// ---- single-flight refresh ----
let refreshInFlight: Promise<string> | null = null;

/** Resolves with the new access token; rejects if refresh failed (tokens cleared, event emitted). */
function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new ApiError({
            status: 401,
            error: 'NO_REFRESH_TOKEN',
            message: 'No refresh token',
          });
        }
        const res = await send<RefreshResponse>(
          '/auth/refresh',
          { method: 'POST', body: { refreshToken } },
          null,
        );
        await setTokens({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        });
        return res.accessToken;
      } catch (e) {
        // A transient network failure must not log the user out.
        if (!(e instanceof NetworkError)) {
          await clearTokens();
          emitSessionExpired();
        }
        throw e;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// Only an expired/missing bearer is worth a refresh. Other 401s are business
// errors (e.g. INVALID_CREDENTIALS from change-password) and must not rotate tokens.
const REFRESHABLE_401 = new Set(['INVALID_TOKEN', 'UNAUTHENTICATED']);

function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/auth/');
}

export async function request<T = void>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const useAuth = opts.auth !== false;
  const usedToken = useAuth ? await getAccessToken() : null;
  try {
    return await send<T>(path, opts, usedToken);
  } catch (e) {
    const canRefresh =
      useAuth &&
      !isAuthEndpoint(path) &&
      e instanceof ApiError &&
      e.status === 401 &&
      REFRESHABLE_401.has(e.error);
    if (!canRefresh) {
      throw e;
    }
    // Another request may have refreshed already while this one was in flight.
    const current = await getAccessToken();
    let token: string;
    if (current && current !== usedToken) {
      token = current;
    } else {
      try {
        token = await refreshAccessToken();
      } catch (refreshError) {
        if (refreshError instanceof NetworkError) {
          throw refreshError;
        }
        throw e; // the original 401 ApiError
      }
    }
    return send<T>(path, opts, token); // replay once; a second 401 propagates
  }
}

export const api = {
  get: <T>(path: string, o?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...o, method: 'GET' }),
  post: <T = void>(path: string, body?: unknown, o?: RequestOptions) =>
    request<T>(path, { ...o, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, o?: RequestOptions) =>
    request<T>(path, { ...o, method: 'PATCH', body }),
  delete: <T = void>(path: string, o?: RequestOptions) =>
    request<T>(path, { ...o, method: 'DELETE' }),
};
