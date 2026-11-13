import { ApiError, NetworkError } from '../../api/errors';

export const MSG = {
  invalidCredentials: 'Email hoặc mật khẩu không đúng.',
  network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  generic: 'Có lỗi xảy ra. Thử lại sau.',
  rateLimited: 'Thử quá nhiều lần',
  emailTaken: 'Email này đã có tài khoản.',
  invalidResetToken: 'Link đặt lại đã hết hạn hoặc đã được dùng.',
} as const;

export type LoginFailure =
  | { kind: 'invalid' }
  | { kind: 'rateLimited'; retryAfterSeconds: number }
  | { kind: 'network' }
  | { kind: 'other' };

const DEFAULT_RETRY_SECONDS = 60;

/** 401 INVALID_CREDENTIALS -> one generic message; 429 AUTH_RATE_LIMITED -> countdown. */
export function classifyLoginError(e: unknown): LoginFailure {
  if (e instanceof NetworkError) {
    return { kind: 'network' };
  }
  if (e instanceof ApiError) {
    if (e.status === 429) {
      return {
        kind: 'rateLimited',
        retryAfterSeconds: e.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS,
      };
    }
    if (e.status === 401) {
      return { kind: 'invalid' };
    }
  }
  return { kind: 'other' };
}

export type RegisterFailure = {
  fields: Partial<Record<'email' | 'password' | 'fullName', string>>;
  form?: string;
};

function fieldMessage(field: string, key?: string): string {
  if (key === 'FIELD_REQUIRED') {
    return 'Không được để trống.';
  }
  if (key === 'FIELD_INVALID_EMAIL') {
    return 'Email chưa đúng định dạng.';
  }
  if (key === 'EMAIL_ALREADY_EXISTS' && field === 'email') {
    return MSG.emailTaken;
  }
  if (key?.startsWith('FIELD_MIN_LENGTH:')) {
    return `Cần ít nhất ${key.split(':')[1]} ký tự.`;
  }
  if (key?.startsWith('FIELD_MAX_LENGTH:')) {
    return `Tối đa ${key.split(':')[1]} ký tự.`;
  }
  return 'Giá trị chưa hợp lệ.';
}

/** Maps ApiError.fieldErrors / EMAIL_ALREADY_EXISTS onto form fields. */
export function classifyRegisterError(e: unknown): RegisterFailure {
  if (e instanceof NetworkError) {
    return { fields: {}, form: MSG.network };
  }
  if (!(e instanceof ApiError)) {
    return { fields: {}, form: MSG.generic };
  }
  if (e.status === 429) {
    return { fields: {}, form: 'Thử quá nhiều lần. Chờ một chút rồi thử lại.' };
  }
  const fields: RegisterFailure['fields'] = {};
  if (e.error === 'EMAIL_ALREADY_EXISTS') {
    fields.email = MSG.emailTaken;
  }
  for (const fe of e.fieldErrors) {
    if (
      fe.field === 'email' ||
      fe.field === 'password' ||
      fe.field === 'fullName'
    ) {
      fields[fe.field] ??= fieldMessage(
        fe.field,
        fe.error ?? (fe.field === 'email' ? e.error : undefined),
      );
    }
  }
  return Object.keys(fields).length > 0
    ? { fields }
    : { fields, form: MSG.generic };
}

export type ResetFailure = 'invalidToken' | 'network' | 'weakPassword' | 'other';

/** 400 INVALID_RESET_TOKEN -> ask for a new link. */
export function classifyResetError(e: unknown): ResetFailure {
  if (e instanceof NetworkError) {
    return 'network';
  }
  if (e instanceof ApiError) {
    if (e.is(400, 'INVALID_RESET_TOKEN')) {
      return 'invalidToken';
    }
    if (e.fieldErrors.some(f => f.field === 'newPassword' || f.field === 'token')) {
      return 'weakPassword';
    }
  }
  return 'other';
}
