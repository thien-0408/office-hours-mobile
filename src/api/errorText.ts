import { ApiError, NetworkError, type FieldError } from './errors';

/**
 * Vietnamese text for errors. The backend `message` is always English and
 * meant for logs, so UI text is derived from `status` + `error` codes only.
 */
export const ERROR_TEXT = {
  network: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  generic: 'Có lỗi xảy ra. Thử lại sau.',
  invalidField: 'Giá trị chưa hợp lệ.',
} as const;

/** Text for one validation error from `details.errors[]`. */
export function fieldErrorText(fe: Pick<FieldError, 'error'>): string {
  const key = fe.error;
  if (key === 'FIELD_REQUIRED') {
    return 'Không được để trống.';
  }
  if (key === 'FIELD_INVALID_EMAIL') {
    return 'Email chưa đúng định dạng.';
  }
  if (key?.startsWith('FIELD_MIN_LENGTH:')) {
    return `Cần ít nhất ${key.split(':')[1]} ký tự.`;
  }
  if (key?.startsWith('FIELD_MAX_LENGTH:')) {
    return `Tối đa ${key.split(':')[1]} ký tự.`;
  }
  return ERROR_TEXT.invalidField;
}

/** Field name → Vietnamese text, for forms. */
export function fieldErrorMap(e: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (e instanceof ApiError) {
    for (const fe of e.fieldErrors) {
      out[fe.field] ??= fieldErrorText(fe);
    }
  }
  return out;
}

/** Generic one-line text for an unexpected failure. */
export function errorText(e: unknown): string {
  return e instanceof NetworkError ? ERROR_TEXT.network : ERROR_TEXT.generic;
}
