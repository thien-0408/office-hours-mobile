/** Client-side rules mirroring the backend (RegisterRequest / ResetPasswordRequest). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const EMAIL_MAX = 255;
export const FULL_NAME_MAX = 150;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const v = email.trim();
  return v.length > 0 && v.length <= EMAIL_MAX && EMAIL_RE.test(v);
}

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) {
    return 'Nhập email.';
  }
  if (!isValidEmail(v)) {
    return 'Email chưa đúng định dạng.';
  }
  return null;
}

export function validateFullName(name: string): string | null {
  const v = name.trim();
  if (!v) {
    return 'Nhập họ và tên.';
  }
  if (v.length > FULL_NAME_MAX) {
    return `Tối đa ${FULL_NAME_MAX} ký tự.`;
  }
  return null;
}

export type PasswordRule = {
  id: 'min' | 'max' | 'match';
  label: string;
  ok: boolean;
};

export function passwordRules(
  password: string,
  confirm?: string,
): PasswordRule[] {
  const rules: PasswordRule[] = [
    {
      id: 'min',
      label: `Ít nhất ${PASSWORD_MIN} ký tự`,
      ok: password.length >= PASSWORD_MIN,
    },
    {
      id: 'max',
      label: `Không quá ${PASSWORD_MAX} ký tự`,
      ok: password.length > 0 && password.length <= PASSWORD_MAX,
    },
  ];
  if (confirm !== undefined) {
    rules.push({
      id: 'match',
      label: 'Hai ô khớp nhau',
      ok: password.length > 0 && password === confirm,
    });
  }
  return rules;
}

export function isPasswordValid(password: string): boolean {
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}

/** 0..4. Only a hint on the device; the server enforces length only. */
export function passwordStrength(password: string): number {
  if (password.length === 0) {
    return 0;
  }
  if (!isPasswordValid(password)) {
    return 1;
  }
  let score = 2;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r =>
    r.test(password),
  ).length;
  if (classes >= 3) {
    score += 1;
  }
  if (password.length >= 12 && classes >= 2) {
    score += 1;
  }
  return Math.min(4, score);
}

export function passwordHint(password: string): string {
  if (password.length === 0) {
    return `Cần ít nhất ${PASSWORD_MIN} ký tự.`;
  }
  if (password.length < PASSWORD_MIN) {
    return `Cần ít nhất ${PASSWORD_MIN} ký tự, còn thiếu ${PASSWORD_MIN - password.length}.`;
  }
  if (password.length > PASSWORD_MAX) {
    return `Tối đa ${PASSWORD_MAX} ký tự.`;
  }
  return ['', 'Còn yếu.', 'Tạm được.', 'Khá tốt.', 'Mạnh.'][
    passwordStrength(password)
  ];
}

/** Accepts a bare token or a full reset link (?token=...). */
export function extractToken(input: string): string {
  const v = input.trim();
  const m = /[?&]token=([^&#\s]+)/.exec(v);
  return m ? decodeURIComponent(m[1]) : v;
}
