/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sheet, SheetRecede, useSheetItem } from '../src/components/motion';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    r = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>{el}</SafeAreaProvider>,
    );
  });
  return r;
}

const backdrop = (r: ReactTestRenderer.ReactTestRenderer, label: string) =>
  r.root.find(
    n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );

describe('Sheet', () => {
  it('shows its title and content while visible', async () => {
    const r = await render(
      <Sheet visible title="Khung giờ mới" onClose={() => {}}>
        <Text>nội dung</Text>
      </Sheet>,
    );
    expect(texts(r)).toEqual(expect.arrayContaining(['Khung giờ mới', 'nội dung']));
  });

  it('backdrop asks to close, unless not dismissable', async () => {
    const onClose = jest.fn();
    const r = await render(
      <Sheet visible onClose={onClose} backdropLabel="Đóng bảng">
        <Text>x</Text>
      </Sheet>,
    );
    await act(() => backdrop(r, 'Đóng bảng').props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);

    const busy = jest.fn();
    const r2 = await render(
      <Sheet visible dismissable={false} onClose={busy} backdropLabel="Đóng bảng">
        <Text>x</Text>
      </Sheet>,
    );
    await act(() => backdrop(r2, 'Đóng bảng').props.onPress());
    expect(busy).not.toHaveBeenCalled();
  });

  it('unmounts its content once hidden', async () => {
    const view = (visible: boolean) => (
      <SafeAreaProvider initialMetrics={metrics}>
        <Sheet visible={visible} onClose={() => {}}>
          <Text>nội dung</Text>
        </Sheet>
      </SafeAreaProvider>
    );
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      r = ReactTestRenderer.create(view(true));
    });
    expect(texts(r)).toContain('nội dung');
    await act(() => r.update(view(false)));
    expect(texts(r)).not.toContain('nội dung');
  });

  it('SheetRecede renders its children', async () => {
    const r = await render(
      <SheetRecede>
        <Text>app</Text>
      </SheetRecede>,
    );
    expect(texts(r)).toEqual(['app']);
  });
});

describe('useSheetItem', () => {
  function Probe({ item }: { item: string | null }) {
    const kept = useSheetItem(item);
    return <Text>{kept ?? 'none'}</Text>;
  }

  it('keeps the last item after it is cleared', async () => {
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      r = ReactTestRenderer.create(<Probe item={null} />);
    });
    expect(texts(r)).toEqual(['none']);
    await act(() => r.update(<Probe item="u1" />));
    expect(texts(r)).toEqual(['u1']);
    await act(() => r.update(<Probe item={null} />));
    expect(texts(r)).toEqual(['u1']);
    await act(() => r.update(<Probe item="u2" />));
    expect(texts(r)).toEqual(['u2']);
  });
});
