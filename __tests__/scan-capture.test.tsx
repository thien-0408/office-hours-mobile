import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ScanCapture } from '../src/features/schedule/scan/ScanCapture';
import { requestCamera, openSettings } from '../src/platform/permissions';

jest.mock('../src/platform/permissions', () => ({
  requestCamera: jest.fn(),
  openSettings: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockedRequest = requestCamera as jest.Mock;

async function render(busy = false) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    r = ReactTestRenderer.create(
      <ScanCapture
        busy={busy}
        onCaptured={jest.fn()}
        onCaptureFailed={jest.fn()}
        onClose={jest.fn()}
        onManual={jest.fn()}
      />,
    );
  });
  return r;
}

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root
    .findAllByType('Text' as never)
    .map(n => [n.props.children].flat().join(''));

describe('ScanCapture permission flow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('granted: shows the guide text and the shutter', async () => {
    mockedRequest.mockResolvedValue('granted');
    const r = await render();
    expect(texts(r).join('|')).toContain('Đặt cả thời khóa biểu vào khung');
    expect(
      r.root.findAll(
        n => n.props.accessibilityLabel === 'Chụp ảnh thời khóa biểu',
      ).length,
    ).toBeGreaterThan(0);
  });

  it('shows "Đang đọc…" while busy', async () => {
    mockedRequest.mockResolvedValue('granted');
    const r = await render(true);
    expect(texts(r)).toContain('Đang đọc…');
  });

  it('denied: explains and offers to ask again', async () => {
    mockedRequest.mockResolvedValue('denied');
    const r = await render();
    const t = texts(r);
    expect(t).toContain('Cần quyền dùng camera');
    expect(t).toContain('Cho phép camera');
  });

  it('blocked: offers system settings', async () => {
    mockedRequest.mockResolvedValue('blocked');
    const r = await render();
    expect(texts(r)).toContain('Mở cài đặt');
    const btn = r.root.findAll(
      n =>
        !!n.props.onPress &&
        n.findAllByType('Text' as never).some(
          x => [x.props.children].flat().join('') === 'Mở cài đặt',
        ),
    )[0];
    await ReactTestRenderer.act(async () => {
      btn.props.onPress();
    });
    expect(openSettings).toHaveBeenCalled();
  });
});
