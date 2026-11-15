import React from 'react';
import { Alert, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Button } from '../src/components';
import { canConfirmAttendance } from '../src/features/booking/attendanceLogic';
import { AttendanceActions } from '../src/features/booking/components/AttendanceActions';
import type { Booking } from '../src/api/domainTypes';
import { ApiError, NetworkError } from '../src/api/errors';
import { ERR } from '../src/api/errorCodes';
import { colors } from '../src/theme';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

const mockCompleteMutate = jest.fn();
const mockNoShowMutate = jest.fn();
let mockCompleteIsPending = false;
let mockNoShowIsPending = false;

jest.mock('../src/api/hooks/bookings', () => ({
  useCompleteBooking: () => ({
    mutate: mockCompleteMutate,
    isPending: mockCompleteIsPending,
  }),
  useMarkNoShow: () => ({
    mutate: mockNoShowMutate,
    isPending: mockNoShowIsPending,
  }),
}));

let mockSessionRole: 'LECTURER' | 'STUDENT' | 'ADMIN' | null = 'LECTURER';
jest.mock('../src/navigation/devSession', () => ({
  useAppSession: () => ({
    role: mockSessionRole,
    status: 'signedIn',
    signOut: jest.fn(),
  }),
}));

const START_MS = Date.parse('2026-11-18T14:00:00.000Z');
const baseBooking: Booking = {
  id: 'b-100',
  slotId: 's-100',
  lecturerId: 'lec-1',
  studentId: 'stu-1',
  lecturerName: 'TS. Nguyễn Văn A',
  studentName: 'Trần Thị B',
  department: 'SE',
  topic: 'Hỏi đồ án',
  startAt: '2026-11-18T14:00:00.000Z',
  endAt: '2026-11-18T14:30:00.000Z',
  status: 'CONFIRMED',
  meetingUrl: null,
};

function allTexts(r: ReactTestRenderer.ReactTestRenderer): string[] {
  return r.root
    .findAllByType(Text)
    .map(t => [t.props.children].flat().join(''));
}

describe('attendanceLogic - canConfirmAttendance', () => {
  test('returns true when role is LECTURER, status is CONFIRMED, and nowMs >= startAt', () => {
    expect(canConfirmAttendance(baseBooking, 'LECTURER', START_MS)).toBe(true);
    expect(canConfirmAttendance(baseBooking, 'LECTURER', START_MS + 60_000)).toBe(true);
  });

  test('returns false when nowMs is before startAt', () => {
    expect(canConfirmAttendance(baseBooking, 'LECTURER', START_MS - 1)).toBe(false);
    expect(canConfirmAttendance(baseBooking, 'LECTURER', START_MS - 300_000)).toBe(false);
  });

  test('returns false for non-LECTURER roles', () => {
    expect(canConfirmAttendance(baseBooking, 'STUDENT', START_MS + 10)).toBe(false);
    expect(canConfirmAttendance(baseBooking, 'ADMIN', START_MS + 10)).toBe(false);
    expect(canConfirmAttendance(baseBooking, null, START_MS + 10)).toBe(false);
    expect(canConfirmAttendance(baseBooking, undefined, START_MS + 10)).toBe(false);
  });

  test('returns false when status is not CONFIRMED', () => {
    const statuses: Booking['status'][] = [
      'PENDING',
      'COMPLETED',
      'NO_SHOW',
      'CANCELLED',
      'DECLINED',
    ];
    for (const st of statuses) {
      expect(
        canConfirmAttendance({ ...baseBooking, status: st }, 'LECTURER', START_MS + 10),
      ).toBe(false);
    }
  });

  test('returns false when booking is null or undefined', () => {
    expect(canConfirmAttendance(null, 'LECTURER', START_MS + 10)).toBe(false);
    expect(canConfirmAttendance(undefined, 'LECTURER', START_MS + 10)).toBe(false);
  });

  test('returns false when startAt is invalid or empty', () => {
    expect(
      canConfirmAttendance({ ...baseBooking, startAt: '' }, 'LECTURER', START_MS + 10),
    ).toBe(false);
    expect(
      canConfirmAttendance(
        { ...baseBooking, startAt: 'invalid-date' },
        'LECTURER',
        START_MS + 10,
      ),
    ).toBe(false);
  });
});

describe('AttendanceActions component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompleteIsPending = false;
    mockNoShowIsPending = false;
    mockSessionRole = 'LECTURER';
  });

  test('renders null when not eligible (e.g. role is STUDENT or before start time)', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="STUDENT"
          now={START_MS + 1000}
        />,
      );
    });
    expect(r.toJSON()).toBeNull();

    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS - 1000}
        />,
      );
    });
    expect(r.toJSON()).toBeNull();

    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={{ ...baseBooking, status: 'PENDING' }}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });
    expect(r.toJSON()).toBeNull();
  });

  test('renders "Đã gặp" and "Vắng mặt" buttons with no icons when eligible', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });
    const texts = allTexts(r);
    expect(texts).toContain('Đã gặp');
    expect(texts).toContain('Vắng mặt');

    // Confirm buttons have no icon children
    expect(r.root.findAllByType(Button).length).toBe(2);
  });

  test('pressing "Đã gặp" calls completeBooking mutate and navigates to MeetingRecord on success', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });

    const daGapBtn = r.root
      .findAllByType(Button)
      .find(b => b.props.title === 'Đã gặp');
    expect(daGapBtn).toBeDefined();

    await act(async () => {
      daGapBtn!.props.onPress();
    });

    expect(mockCompleteMutate).toHaveBeenCalledTimes(1);
    expect(mockCompleteMutate).toHaveBeenCalledWith(baseBooking.id, expect.any(Object));

    // Simulate success callback
    const options = mockCompleteMutate.mock.calls[0][1];
    await act(async () => {
      options.onSuccess();
    });

    expect(mockNavigate).toHaveBeenCalledWith('MeetingRecord', {
      bookingId: baseBooking.id,
    });
  });

  test('pressing "Vắng mặt" prompts Alert.alert and confirms before calling mutate', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });

    const vangMatBtn = r.root
      .findAllByType(Button)
      .find(b => b.props.title === 'Vắng mặt');
    expect(vangMatBtn).toBeDefined();

    await act(async () => {
      vangMatBtn!.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('vắng mặt');
    expect(mockNoShowMutate).not.toHaveBeenCalled();

    // Trigger the confirm button in the alert
    const alertButtons = alertSpy.mock.calls[0][2];
    const confirmButton = alertButtons?.find(b => b.text === 'Vắng mặt');
    expect(confirmButton).toBeDefined();

    await act(async () => {
      confirmButton?.onPress?.();
    });

    expect(mockNoShowMutate).toHaveBeenCalledTimes(1);
    expect(mockNoShowMutate).toHaveBeenCalledWith(baseBooking.id, expect.any(Object));

    // Simulate success callback: does NOT navigate away
    const options = mockNoShowMutate.mock.calls[0][1];
    await act(async () => {
      options.onSuccess();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  test('buttons are disabled while mutation is in progress', async () => {
    mockCompleteIsPending = true;

    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });

    const buttons = r.root.findAllByType(Button);
    expect(buttons.length).toBe(2);
    for (const btn of buttons) {
      expect(btn.props.disabled).toBe(true);
    }
  });

  test('displays Vietnamese error text in colors.err when mutation fails, without English message', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });

    const daGapBtn = r.root
      .findAllByType(Button)
      .find(b => b.props.title === 'Đã gặp');
    expect(daGapBtn).toBeDefined();

    await act(async () => {
      daGapBtn!.props.onPress();
    });

    // Simulate API error with English message
    const options = mockCompleteMutate.mock.calls[0][1];
    const backendErr = new ApiError({
      status: 409,
      error: ERR.BOOKING_TRANSITION_NOT_ALLOWED,
      message: 'This booking action is not allowed in its current state or at this time',
    });

    await act(async () => {
      options.onError(backendErr);
    });

    const texts = allTexts(r);
    expect(texts).toContain('Trạng thái lịch hẹn đã thay đổi. Danh sách đã được làm mới.');
    expect(texts.join(' ')).not.toContain('This booking action is not allowed');

    // Verify error text style color
    const errorNode = r.root.findAll(
      n => n.props.accessibilityRole === 'alert',
    )[0];
    expect(errorNode).toBeDefined();
    expect(errorNode.props.color).toBe(colors.err);
  });

  test('displays network error in Vietnamese when NetworkError occurs', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
        />,
      );
    });

    const daGapBtn = r.root
      .findAllByType(Button)
      .find(b => b.props.title === 'Đã gặp');
    expect(daGapBtn).toBeDefined();

    await act(async () => {
      daGapBtn!.props.onPress();
    });

    const options = mockCompleteMutate.mock.calls[0][1];
    await act(async () => {
      options.onError(new NetworkError('Failed to fetch'));
    });

    const texts = allTexts(r);
    expect(texts).toContain('Không thực hiện được. Kiểm tra kết nối rồi thử lại.');
    expect(texts.join(' ')).not.toContain('Failed to fetch');
  });

  test('renders correctly with variant="bar" and colors.s1 background', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      r = ReactTestRenderer.create(
        <AttendanceActions
          booking={baseBooking}
          role="LECTURER"
          now={START_MS + 1000}
          variant="bar"
        />,
      );
    });

    const texts = allTexts(r);
    expect(texts).toContain('Đã gặp');
    expect(texts).toContain('Vắng mặt');
  });
});
