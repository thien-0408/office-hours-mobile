import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  departmentLabel,
  FALLBACK_DEPARTMENTS,
} from '../src/api/departments';
import { ApiError } from '../src/api/errors';
import { DepartmentPicker } from '../src/components/DepartmentPicker';
import { classifyRegisterError } from '../src/features/auth/authErrors';
import { meetingModeTag, meetingModeText } from '../src/features/booking/slots/slotLogic';
import { suggestionWhen } from '../src/features/dashboard/dashboardLogic';

describe('departmentLabel', () => {
  test('maps codes (any case) to the Vietnamese label', () => {
    expect(departmentLabel('CIT')).toBe('Công nghệ Thông tin');
    expect(departmentLabel(' nur ')).toBe('Điều dưỡng');
  });
  test('keeps legacy free text and hides empty values', () => {
    expect(departmentLabel('Computer Science')).toBe('Computer Science');
    expect(departmentLabel(null)).toBeNull();
    expect(departmentLabel('  ')).toBeNull();
  });
  test('uses the server list when given', () => {
    expect(
      departmentLabel('NEW', [{ code: 'NEW', labelVi: 'Khoa mới', labelEn: 'New' }]),
    ).toBe('Khoa mới');
  });
  test('fallback list matches the backend enum codes', () => {
    expect(FALLBACK_DEPARTMENTS.map(d => d.code)).toEqual([
      'CIT',
      'ENG',
      'BUS',
      'NUR',
      'LANG',
      'SCI',
      'OTHER',
    ]);
  });
});

describe('classifyRegisterError department', () => {
  test('422 on department becomes a Vietnamese field error', () => {
    const e = new ApiError({
      status: 422,
      error: 'VALIDATION_FAILED',
      message: 'Validation failed',
      fieldErrors: [{ field: 'department', error: 'FIELD_INVALID', message: 'x' }],
    });
    const f = classifyRegisterError(e);
    expect(f.fields.department).toBe('Khoa không hợp lệ. Chọn lại từ danh sách.');
    expect(f.form).toBeUndefined();
  });
});

describe('meeting mode text', () => {
  test('online, in person and unknown', () => {
    expect(meetingModeText(true, '306.B11')).toBe('Online qua link họp (Meet, Zoom…)');
    expect(meetingModeText(false, '306.B11')).toBe('Trực tiếp tại 306.B11');
    expect(meetingModeText(false, null)).toBe('Trực tiếp');
    expect(meetingModeText(undefined, '306.B11')).toBe('Phòng 306.B11');
    expect(meetingModeTag(true)).toBe('Online');
    expect(meetingModeTag(false)).toBe('Tại phòng');
  });
  test('suggestion line marks online slots', () => {
    const startAt = '2026-11-16T02:30:00Z'; // Monday 09:30 in Vietnam
    expect(suggestionWhen({ startAt })).toBe('Thứ Hai · 09:30');
    expect(suggestionWhen({ startAt, online: true })).toBe('Thứ Hai · 09:30 · Online');
  });
});

describe('DepartmentPicker', () => {
  const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
    r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

  async function render(value: string | null, onChange: (c: string | null) => void) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, enabled: false } },
    });
    let r!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      r = ReactTestRenderer.create(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { top: 47, left: 0, right: 0, bottom: 34 },
          }}
        >
          <QueryClientProvider client={client}>
            <DepartmentPicker value={value} onChange={onChange} />
          </QueryClientProvider>
        </SafeAreaProvider>,
      );
    });
    return r;
  }

  test('shows the label of the selected code, or a prompt', async () => {
    expect(texts(await render('CIT', () => {}))).toContain('Công nghệ Thông tin');
    expect(texts(await render(null, () => {}))).toContain('Chọn khoa');
  });

  test('opens the list and returns the picked code', async () => {
    const onChange = jest.fn();
    const r = await render(null, onChange);
    const trigger = r.root.findAll(
      n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function',
    )[0];
    await ReactTestRenderer.act(async () => {
      trigger.props.onPress();
    });
    const option = r.root.findAll(
      n =>
        n.props.accessibilityRole === 'radio' &&
        typeof n.props.onPress === 'function' &&
        n.findAllByType(Text).some(t => t.props.children === 'Điều dưỡng'),
    )[0];
    await ReactTestRenderer.act(async () => {
      option.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('NUR');
  });

  test('"Không chọn" clears the value', async () => {
    const onChange = jest.fn();
    const r = await render('CIT', onChange);
    const trigger = r.root.findAll(
      n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function',
    )[0];
    await ReactTestRenderer.act(async () => {
      trigger.props.onPress();
    });
    const none = r.root.findAll(
      n =>
        n.props.accessibilityRole === 'radio' &&
        typeof n.props.onPress === 'function' &&
        n.findAllByType(Text).some(t => t.props.children === 'Không chọn'),
    )[0];
    await ReactTestRenderer.act(async () => {
      none.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
