import {
  formatRole,
  NOTIFICATION_PREF_ITEMS,
  resolvePasswordError,
  validatePasswordChange,
  validateProfileUpdate,
} from '../src/features/profile/profileLogic';
import { ApiError } from '../src/api/errors';
import { APP_INFO, FAQS, PRIVACY_POINTS } from '../src/features/help/helpData';

describe('profileLogic', () => {
  describe('formatRole', () => {
    it('formats roles correctly into Vietnamese', () => {
      expect(formatRole('STUDENT')).toBe('Sinh viên');
      expect(formatRole('LECTURER')).toBe('Giảng viên');
      expect(formatRole('ADMIN')).toBe('Quản trị viên');
      expect(formatRole(null)).toBe('');
      expect(formatRole(undefined)).toBe('');
    });
  });

  describe('validateProfileUpdate', () => {
    it('fails when fullName is empty or whitespace', () => {
      const res1 = validateProfileUpdate({ fullName: '' });
      expect(res1.isValid).toBe(false);
      expect(res1.errors.fullName).toBe('Họ và tên không được để trống');

      const res2 = validateProfileUpdate({ fullName: '   ' });
      expect(res2.isValid).toBe(false);
      expect(res2.errors.fullName).toBe('Họ và tên không được để trống');
    });

    it('fails when fullName exceeds 150 characters', () => {
      const longName = 'A'.repeat(151);
      const res = validateProfileUpdate({ fullName: longName });
      expect(res.isValid).toBe(false);
      expect(res.errors.fullName).toBe('Họ và tên tối đa 150 ký tự');
    });

    it('fails when department exceeds 100 characters', () => {
      const longDept = 'D'.repeat(101);
      const res = validateProfileUpdate({
        fullName: 'Nguyễn Văn A',
        department: longDept,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.department).toBe('Khoa tối đa 100 ký tự');
    });

    it('passes with valid fullName and optional department', () => {
      const res1 = validateProfileUpdate({ fullName: 'Nguyễn Văn A' });
      expect(res1.isValid).toBe(true);
      expect(res1.errors.fullName).toBeUndefined();

      const res2 = validateProfileUpdate({
        fullName: 'Nguyễn Văn A',
        department: 'Khoa CNTT',
      });
      expect(res2.isValid).toBe(true);
      expect(res2.errors.department).toBeUndefined();
    });
  });

  describe('validatePasswordChange', () => {
    it('fails when current password is empty', () => {
      const res = validatePasswordChange({
        oldPassword: '',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.oldPassword).toBe('Vui lòng nhập mật khẩu hiện tại');
    });

    it('fails when new password is too short (< 8 chars)', () => {
      const res = validatePasswordChange({
        oldPassword: 'oldpassword123',
        newPassword: 'short',
        confirmPassword: 'short',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.newPassword).toBe('Mật khẩu mới phải từ 8 đến 72 ký tự');
    });

    it('fails when new password is too long (> 72 chars)', () => {
      const longPass = 'p'.repeat(73);
      const res = validatePasswordChange({
        oldPassword: 'oldpassword123',
        newPassword: longPass,
        confirmPassword: longPass,
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.newPassword).toBe('Mật khẩu mới phải từ 8 đến 72 ký tự');
    });

    it('fails when confirm password does not match new password', () => {
      const res = validatePasswordChange({
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.confirmPassword).toBe('Mật khẩu nhập lại không khớp');
    });

    it('passes when all 3 fields are valid and match', () => {
      const res = validatePasswordChange({
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual({});
    });
  });

  describe('resolvePasswordError', () => {
    it('maps 401 INVALID_CREDENTIALS to oldPassword field error', () => {
      const apiErr = new ApiError({
        status: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
      const resolved = resolvePasswordError(apiErr);
      expect(resolved.fieldErrors?.oldPassword).toBe('Mật khẩu hiện tại không đúng');
    });

    it('maps fieldErrors from details when present', () => {
      const apiErr = new ApiError({
        status: 400,
        error: 'VALIDATION_FAILED',
        message: 'Validation failed',
        fieldErrors: [
          {
            field: 'newPassword',
            error: 'SIZE',
            message: 'Size must be between 8 and 72',
          },
        ],
      });
      const resolved = resolvePasswordError(apiErr);
      expect(resolved.fieldErrors?.newPassword).toBe(
        'Size must be between 8 and 72',
      );
    });

    it('returns general error for generic ApiError without field errors', () => {
      const apiErr = new ApiError({
        status: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      });
      const resolved = resolvePasswordError(apiErr);
      expect(resolved.generalError).toBe('Không thể đổi mật khẩu. Vui lòng thử lại.');
    });

    it('returns network error message for non-ApiError', () => {
      const resolved = resolvePasswordError(new Error('Network failure'));
      expect(resolved.generalError).toBe(
        'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.',
      );
    });
  });

  describe('NOTIFICATION_PREF_ITEMS', () => {
    it('contains all 4 notification preference keys', () => {
      const keys = NOTIFICATION_PREF_ITEMS.map(i => i.key);
      expect(keys).toEqual([
        'bookingConfirmed',
        'bookingDeclined',
        'reminders',
        'waitlistOffer',
      ]);
    });
  });
});

describe('helpData', () => {
  it('defines 4 frequently asked questions with questions and answers', () => {
    expect(FAQS).toHaveLength(4);
    for (const faq of FAQS) {
      expect(faq.id).toBeTruthy();
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
    }
  });

  it('defines privacy policy principles', () => {
    expect(PRIVACY_POINTS.length).toBeGreaterThanOrEqual(4);
    expect(
      PRIVACY_POINTS.some(p => p.includes('15 phút') && p.includes('khung giờ hẹn')),
    ).toBe(true);
    expect(PRIVACY_POINTS.some(p => p.includes('Realtime Database'))).toBe(true);
  });

  it('defines correct app info and OpenStreetMap copyright', () => {
    expect(APP_INFO.version).toBe('0.1.0 (beta)');
    expect(APP_INFO.mapAttribution).toContain('OpenStreetMap');
    expect(APP_INFO.mapAttribution).toContain('ODbL 1.0');
    expect(APP_INFO.mapUrl).toBe('https://www.openstreetmap.org/copyright');
    expect(APP_INFO.footer).toBe('officehours · EIU · CSW434');
  });
});
