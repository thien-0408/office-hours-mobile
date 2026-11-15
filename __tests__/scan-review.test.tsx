import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ApiError } from '../src/api/errors';
import { ERR } from '../src/api/errorCodes';
import { ScanReview } from '../src/features/schedule/scan/ScanReview';
import { ScanRowCard } from '../src/features/schedule/scan/ScanRowCard';
import type { ScanRow } from '../src/features/schedule/scan/rows';

const mockMutate = jest.fn();
jest.mock('../src/api/hooks', () => ({
  useActiveSemester: () => ({
    data: { id: 'sem-1', name: 'HK1' },
    isError: false,
    refetch: jest.fn(),
  }),
  useImportSchedule: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const row = (key: string, over: Partial<ScanRow> = {}): ScanRow => ({
  key,
  dayOfWeek: 1,
  startTime: '07:30',
  endTime: '09:30',
  title: `Môn ${key}`,
  room: '',
  confidence: 'high',
  ...over,
});

async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(el);
  });
  return r;
}

function texts(r: ReactTestRenderer.ReactTestRenderer): string[] {
  return r.root
    .findAllByType('Text' as never)
    .map(n => [n.props.children].flat().join(''));
}

function press(r: ReactTestRenderer.ReactTestRenderer, label: string) {
  const btn = r.root.findAll(
    n =>
      !!n.props.onPress &&
      (n.props.accessibilityLabel === label ||
        n.findAllByType('Text' as never).some(
          x => [x.props.children].flat().join('') === label,
        )),
  )[0];
  return ReactTestRenderer.act(async () => {
    btn.props.onPress();
  });
}

beforeEach(() => mockMutate.mockReset());

describe('ScanRowCard', () => {
  it('flags low-confidence rows in text and shows errors', async () => {
    const r = await render(
      <ScanRowCard
        row={row('a', { confidence: 'low', endTime: '' })}
        index={0}
        errors={{ endTime: 'Giờ kết thúc chưa đúng (HH:mm).' }}
        onChange={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    const t = texts(r).join('|');
    expect(t).toContain('Máy đọc chưa chắc');
    expect(t).toContain('Giờ kết thúc chưa đúng');
  });

  it('editing reports a patch that clears the low flag', async () => {
    const onChange = jest.fn();
    const r = await render(
      <ScanRowCard
        row={row('a', { confidence: 'low' })}
        index={0}
        errors={{}}
        onChange={onChange}
        onDelete={jest.fn()}
      />,
    );
    const inputs = r.root.findAllByType('TextInput' as never);
    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('Mạng máy tính');
    });
    expect(onChange).toHaveBeenCalledWith('a', {
      title: 'Mạng máy tính',
      confidence: 'high',
    });
  });
});

describe('ScanReview', () => {
  it('shows counts, the mode hint and submits the exact DTO', async () => {
    const onDone = jest.fn();
    const r = await render(
      <ScanReview
        initialRows={[row('a'), row('b', { confidence: 'low', dayOfWeek: 7 })]}
        onBack={jest.fn()}
        onDone={onDone}
      />,
    );
    const t = texts(r);
    expect(t).toContain('2 dòng · 1 đọc chưa chắc');
    expect(t.join('|')).toContain('Xóa lịch đã nhập từ PDF trước đó');
    expect(t).toContain('Lưu 2 dòng');

    await press(r, 'Gộp thêm');
    expect(texts(r).join('|')).toContain('chỉ thêm các dòng mới');

    await press(r, 'Lưu 2 dòng');
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const payload = mockMutate.mock.calls[0][0];
    expect(payload).toMatchObject({ semesterId: 'sem-1', mode: 'MERGE' });
    expect(payload.rows[1]).toMatchObject({ day: 'Chủ Nhật', date: null });
  });

  it('does not submit while a row is invalid', async () => {
    const r = await render(
      <ScanReview
        initialRows={[row('a', { endTime: '07:00' })]}
        onBack={jest.fn()}
        onDone={jest.fn()}
      />,
    );
    expect(texts(r)).toContain('1 dòng · 1 cần sửa');
    expect(texts(r)).toContain('Giờ kết thúc phải sau giờ bắt đầu.');
    await press(r, 'Lưu 1 dòng');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('maps a 422 back to the right card by rowIndex', async () => {
    const r = await render(
      <ScanReview
        initialRows={[row('a'), row('b'), row('c')]}
        onBack={jest.fn()}
        onDone={jest.fn()}
      />,
    );
    await press(r, 'Lưu 3 dòng');
    const err = new ApiError({
      status: 422,
      error: ERR.SCHEDULE_BATCH_INVALID,
      message: 'Invalid timetable batch',
      details: {
        errors: [{ rowIndex: 1, field: 'room', message: 'Must be at most 100' }],
      },
    });
    await ReactTestRenderer.act(async () => {
      mockMutate.mock.calls[0][1].onError(err);
    });
    const t = texts(r);
    expect(t).toContain('Phòng chưa hợp lệ.');
    expect(t.filter(x => x === 'Phòng chưa hợp lệ.')).toHaveLength(1);
    expect(t.join('|')).toContain('Máy chủ báo 1 dòng chưa hợp lệ');
    expect(t.join('|')).not.toContain('Must be');
  });

  it('can add and delete rows', async () => {
    const r = await render(
      <ScanReview initialRows={[]} onBack={jest.fn()} onDone={jest.fn()} />,
    );
    expect(texts(r).join('|')).toContain('Chưa có dòng nào');
    await press(r, 'Thêm dòng');
    expect(texts(r)).toContain('Dòng 1');
    await press(r, 'Xóa dòng 1');
    expect(texts(r).join('|')).toContain('Chưa có dòng nào');
  });
});
