const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    delete store[k];
  }),
}));

import { api, onSessionExpired, setLocale } from '../src/api/client';
import { ApiError } from '../src/api/errors';
import { login } from '../src/api/auth';
import { me } from '../src/api/users';
import {
  clearTokens,
  getAccessToken,
  resetTokenCache,
  setTokens,
} from '../src/api/tokenStore';

type Call = { url: string; init: RequestInit };
type Handler = (url: string, init: RequestInit) => Response;

function jsonRes(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

const fetchMock = jest.fn();
let calls: Call[] = [];

function mockFetch(handler: Handler) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  });
}

function headerOf(c: Call, name: string): string | undefined {
  return (c.init.headers as Record<string, string>)[name];
}

async function failure(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error('expected the request to reject');
}

beforeEach(async () => {
  Object.keys(store).forEach(k => delete store[k]);
  resetTokenCache();
  setLocale('vi');
  calls = [];
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  mockFetch(() => jsonRes(200, {}));
  await setTokens({ accessToken: 'A1', refreshToken: 'R1' });
});

describe('api client', () => {
  it('attaches Authorization, Accept-Language and X-Request-Id', async () => {
    setLocale('en');
    await api.get('/users/me');
    expect(headerOf(calls[0], 'Authorization')).toBe('Bearer A1');
    expect(headerOf(calls[0], 'Accept-Language')).toBe('en');
    expect(headerOf(calls[0], 'X-Request-Id')).toMatch(
      /^[A-Za-z0-9._-]{8,64}$/,
    );
    expect(calls[0].url).toBe('http://10.0.2.2:8080/api/v1/users/me');
  });

  it('two concurrent 401s trigger exactly one refresh and both replay', async () => {
    mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) {
        return jsonRes(200, {
          accessToken: 'A2',
          refreshToken: 'R2',
          expiresIn: 900,
        });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer A2'
        ? jsonRes(200, { ok: url })
        : jsonRes(401, { status: 401, error: 'INVALID_TOKEN', message: 'x' });
    });

    const [a, b] = await Promise.all([
      api.get<{ ok: string }>('/users/me'),
      api.get<{ ok: string }>('/bookings'),
    ]);

    expect(a.ok).toMatch(/users\/me$/);
    expect(b.ok).toMatch(/bookings$/);
    const refreshCalls = calls.filter(c => c.url.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(JSON.parse(refreshCalls[0].init.body as string)).toEqual({
      refreshToken: 'R1',
    });
    expect(headerOf(refreshCalls[0], 'Authorization')).toBeUndefined();
    expect(await getAccessToken()).toBe('A2');
    expect(store['oh.refreshToken']).toBe('R2');
    expect(calls).toHaveLength(5); // 2 first tries + 1 refresh + 2 replays
  });

  it('refresh failure clears tokens, emits sessionExpired, rejects with 401', async () => {
    mockFetch(url =>
      url.endsWith('/auth/refresh')
        ? jsonRes(401, {
            status: 401,
            error: 'REFRESH_TOKEN_EXPIRED',
            message: 'expired',
          })
        : jsonRes(401, { status: 401, error: 'INVALID_TOKEN', message: 'x' }),
    );
    const expired = jest.fn();
    const off = onSessionExpired(expired);

    const err = await failure(api.get('/users/me'));
    off();

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
    expect(err.error).toBe('INVALID_TOKEN');
    expect(expired).toHaveBeenCalledTimes(1);
    expect(await getAccessToken()).toBeNull();
    expect(store['oh.accessToken']).toBeUndefined();
    expect(store['oh.refreshToken']).toBeUndefined();
  });

  it('parses VALIDATION_FAILED field errors', async () => {
    mockFetch(() =>
      jsonRes(400, {
        status: 400,
        error: 'VALIDATION_FAILED',
        message: '2 fields are invalid',
        details: {
          errors: [
            {
              field: 'email',
              error: 'FIELD_REQUIRED',
              message: 'Email is required',
            },
            {
              field: 'password',
              error: 'FIELD_MIN_LENGTH',
              message: 'too short',
            },
          ],
        },
      }),
    );
    const err = await failure(login('', ''));
    expect(err.status).toBe(400);
    expect(err.error).toBe('VALIDATION_FAILED');
    expect(err.fieldErrors).toEqual([
      { field: 'email', error: 'FIELD_REQUIRED', message: 'Email is required' },
      { field: 'password', error: 'FIELD_MIN_LENGTH', message: 'too short' },
    ]);
  });

  it('parses MULTIPLE_ERRORS entries whose field is nested in context', async () => {
    mockFetch(() =>
      jsonRes(400, {
        status: 400,
        error: 'MULTIPLE_ERRORS',
        message: '2 errors',
        details: {
          errors: [
            {
              error: 'ROLE_NOT_SELF_ASSIGNABLE',
              message: 'm',
              context: { errors: [{ field: 'role', message: 'm' }] },
            },
            {
              error: 'EMAIL_ALREADY_EXISTS',
              message: 'm2',
              context: { errors: [{ field: 'email', message: 'm2' }] },
            },
          ],
        },
      }),
    );
    const err = await failure(api.post('/auth/register', {}, { auth: false }));
    expect(err.fieldErrors.map(f => f.field)).toEqual(['role', 'email']);
  });

  it('exposes retryAfterSeconds on 429', async () => {
    mockFetch(() =>
      jsonRes(
        429,
        { status: 429, error: 'AUTH_RATE_LIMITED', message: 'slow down' },
        { 'Retry-After': '900' },
      ),
    );
    const err = await failure(login('a@b.c', 'pw'));
    expect(err.status).toBe(429);
    expect(err.error).toBe('AUTH_RATE_LIMITED');
    expect(err.retryAfterSeconds).toBe(900);
  });

  it('never refreshes for auth endpoints', async () => {
    mockFetch(() =>
      jsonRes(401, {
        status: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'bad',
      }),
    );
    const err = await failure(login('a@b.c', 'wrong'));
    expect(err.error).toBe('INVALID_CREDENTIALS');

    await failure(api.post('/auth/logout'));

    expect(calls.filter(c => c.url.endsWith('/auth/refresh'))).toHaveLength(0);
    expect(calls).toHaveLength(2);
    // login is public: no bearer; logout is authenticated: bearer attached
    expect(headerOf(calls[0], 'Authorization')).toBeUndefined();
    expect(headerOf(calls[1], 'Authorization')).toBe('Bearer A1');
  });

  it('login stores the token pair and me() uses it', async () => {
    await clearTokens();
    mockFetch(url =>
      url.endsWith('/auth/login')
        ? jsonRes(200, {
            accessToken: 'AX',
            refreshToken: 'RX',
            expiresIn: 900,
            user: {
              id: 'u',
              email: 'e',
              fullName: 'n',
              role: 'STUDENT',
              department: null,
            },
          })
        : jsonRes(200, { id: 'u' }),
    );
    await login('e', 'p');
    expect(store['oh.accessToken']).toBe('AX');
    await me();
    expect(headerOf(calls[1], 'Authorization')).toBe('Bearer AX');
  });
  it('business 401 (INVALID_CREDENTIALS) does not trigger refresh', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonRes(401, {
          status: 401,
          error: 'INVALID_CREDENTIALS',
          message: 'x',
        }),
      ),
    );
    await expect(
      api.post('/users/me/change-password', {
        currentPassword: 'a',
        newPassword: 'b',
      }),
    ).rejects.toMatchObject({ status: 401, error: 'INVALID_CREDENTIALS' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
