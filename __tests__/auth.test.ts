import { ApiError, NetworkError } from '../src/api/errors';
import {
  classifyLoginError,
  classifyRegisterError,
  classifyResetError,
} from '../src/features/auth/authErrors';
import { secondsLeft } from '../src/features/auth/rateLimit';
import {
  extractToken,
  isPasswordValid,
  isValidEmail,
  passwordRules,
  passwordStrength,
  validateEmail,
} from '../src/features/auth/validators';

const err = (
  status: number,
  error: string,
  extra: Partial<ConstructorParameters<typeof ApiError>[0]> = {},
) => new ApiError({ status, error, message: 'x', ...extra });

describe('validators', () => {
  test('email', () => {
    expect(isValidEmail('bao.pham@eiu.edu.vn')).toBe(true);
    expect(isValidEmail(' a@b.co ')).toBe(true);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail(`${'a'.repeat(251)}@b.co`)).toBe(false);
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('a@b.co')).toBeNull();
  });

  test('password length 8..72', () => {
    expect(isPasswordValid('1234567')).toBe(false);
    expect(isPasswordValid('12345678')).toBe(true);
    expect(isPasswordValid('a'.repeat(72))).toBe(true);
    expect(isPasswordValid('a'.repeat(73))).toBe(false);
  });

  test('rules and match', () => {
    const r = passwordRules('12345678', '1234567');
    expect(r.map(x => [x.id, x.ok])).toEqual([
      ['min', true],
      ['max', true],
      ['match', false],
    ]);
    expect(passwordRules('abc').find(x => x.id === 'match')).toBeUndefined();
    expect(passwordRules('', '').find(x => x.id === 'match')?.ok).toBe(false);
  });

  test('strength', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abc')).toBe(1);
    expect(passwordStrength('abcdefgh')).toBe(2);
    expect(passwordStrength('Abcdefg1')).toBe(3);
    expect(passwordStrength('Abcdefghij1!')).toBe(4);
  });

  test('extractToken', () => {
    expect(extractToken(' abc123 ')).toBe('abc123');
    expect(
      extractToken('https://app.example/reset-password?token=abc%2D1&x=2'),
    ).toBe('abc-1');
  });
});

describe('error mapping', () => {
  test('login 401 -> generic invalid, no field hint', () => {
    expect(classifyLoginError(err(401, 'INVALID_CREDENTIALS'))).toEqual({
      kind: 'invalid',
    });
  });

  test('login 429 -> countdown from retryAfterSeconds, default 60', () => {
    expect(
      classifyLoginError(
        err(429, 'AUTH_RATE_LIMITED', { retryAfterSeconds: 42 }),
      ),
    ).toEqual({ kind: 'rateLimited', retryAfterSeconds: 42 });
    expect(classifyLoginError(err(429, 'AUTH_RATE_LIMITED'))).toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 60,
    });
  });

  test('login network / other', () => {
    expect(classifyLoginError(new NetworkError('down'))).toEqual({
      kind: 'network',
    });
    expect(classifyLoginError(err(500, 'INTERNAL'))).toEqual({ kind: 'other' });
  });

  test('register field errors map onto fields', () => {
    const f = classifyRegisterError(
      err(400, 'VALIDATION_FAILED', {
        fieldErrors: [
          { field: 'email', error: 'FIELD_INVALID_EMAIL', message: '' },
          { field: 'password', error: 'FIELD_MIN_LENGTH:8', message: '' },
        ],
      }),
    );
    expect(f.fields.email).toMatch(/định dạng/);
    expect(f.fields.password).toMatch(/8/);
    expect(f.form).toBeUndefined();
  });

  test('register EMAIL_ALREADY_EXISTS -> email field', () => {
    const f = classifyRegisterError(
      err(409, 'EMAIL_ALREADY_EXISTS', {
        fieldErrors: [{ field: 'email', message: 'dup' }],
      }),
    );
    expect(f.fields.email).toMatch(/đã có tài khoản/);
    expect(classifyRegisterError(err(409, 'EMAIL_ALREADY_EXISTS')).fields.email).toBeDefined();
  });

  test('register unknown -> form message', () => {
    expect(classifyRegisterError(err(500, 'X')).form).toBeDefined();
    expect(classifyRegisterError(new NetworkError('x')).form).toBeDefined();
  });

  test('reset', () => {
    expect(classifyResetError(err(400, 'INVALID_RESET_TOKEN'))).toBe(
      'invalidToken',
    );
    expect(classifyResetError(new NetworkError('x'))).toBe('network');
    expect(
      classifyResetError(
        err(400, 'VALIDATION_FAILED', {
          fieldErrors: [{ field: 'newPassword', error: 'FIELD_MIN_LENGTH:8', message: '' }],
        }),
      ),
    ).toBe('weakPassword');
    expect(classifyResetError(err(500, 'X'))).toBe('other');
  });
});

describe('rate limit countdown', () => {
  test('secondsLeft rounds up and floors at 0', () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
    expect(secondsLeft(10_000, 10_000)).toBe(0);
    expect(secondsLeft(10_000, 20_000)).toBe(0);
  });
});
