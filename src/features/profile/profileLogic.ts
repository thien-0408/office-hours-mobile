import type { NotificationPrefs, UserRole } from '../../api/types';
import { ApiError } from '../../api/errors';
import { fieldErrorText } from '../../api/errorText';

export type ProfileValidationResult = {
  isValid: boolean;
  errors: {
    fullName?: string;
    department?: string;
  };
};

export function validateProfileUpdate(payload: {
  fullName: string;
  department?: string | null;
}): ProfileValidationResult {
  const errors: { fullName?: string; department?: string } = {};

  const trimmedName = payload.fullName.trim();
  if (!trimmedName) {
    errors.fullName = 'Họ và tên không được để trống';
  } else if (trimmedName.length > 150) {
    errors.fullName = 'Họ và tên tối đa 150 ký tự';
  }

  if (payload.department && payload.department.length > 100) {
    errors.department = 'Khoa tối đa 100 ký tự';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export type PasswordValidationResult = {
  isValid: boolean;
  errors: {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
};

export function validatePasswordChange(payload: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): PasswordValidationResult {
  const errors: {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  if (!payload.oldPassword) {
    errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
  }

  if (!payload.newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới';
  } else if (
    payload.newPassword.length < 8 ||
    payload.newPassword.length > 72
  ) {
    errors.newPassword = 'Mật khẩu mới phải từ 8 đến 72 ký tự';
  }

  if (!payload.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
  } else if (
    payload.newPassword &&
    payload.newPassword !== payload.confirmPassword
  ) {
    errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatRole(role?: UserRole | null): string {
  switch (role) {
    case 'STUDENT':
      return 'Sinh viên';
    case 'LECTURER':
      return 'Giảng viên';
    case 'ADMIN':
      return 'Quản trị viên';
    default:
      return '';
  }
}

export type NotificationPrefItem = {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
};

export const NOTIFICATION_PREF_ITEMS: NotificationPrefItem[] = [
  {
    key: 'bookingConfirmed',
    label: 'Xác nhận lịch hẹn',
    description: 'Khi giảng viên chấp nhận yêu cầu của bạn',
  },
  {
    key: 'bookingDeclined',
    label: 'Từ chối lịch hẹn',
    description: 'Khi lịch hẹn bị từ chối hoặc hủy',
  },
  {
    key: 'reminders',
    label: 'Nhắc trước buổi hẹn',
    description: '60 phút và 10 phút trước giờ hẹn',
  },
  {
    key: 'waitlistOffer',
    label: 'Có slot từ hàng đợi',
    description: 'Khi có slot trống mới dành cho bạn',
  },
];

export type PasswordErrorResolution = {
  fieldErrors?: Record<string, string>;
  generalError?: string;
};

export function resolvePasswordError(err: unknown): PasswordErrorResolution {
  if (err instanceof ApiError) {
    if (err.is(401, 'INVALID_CREDENTIALS')) {
      return {
        fieldErrors: {
          oldPassword: 'Mật khẩu hiện tại không đúng',
        },
      };
    }

    if (err.fieldErrors && err.fieldErrors.length > 0) {
      const fieldErrors: Record<string, string> = {};
      for (const fe of err.fieldErrors) {
        fieldErrors[fe.field] = fieldErrorText(fe);
      }
      return { fieldErrors };
    }

    return {
      generalError: 'Không thể đổi mật khẩu. Vui lòng thử lại.',
    };
  }

  return {
    generalError: 'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.',
  };
}
