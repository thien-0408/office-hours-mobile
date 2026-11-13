import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { vnDateToInstant } from '../src/api/time';
import type { BookableSlot } from '../src/api/domainTypes';
import { SlotGrid } from '../src/features/booking/slots/SlotGrid';
import { LecturerCover } from '../src/features/booking/slots/LecturerCover';
import { WeekStrip } from '../src/features/booking/slots/WeekStrip';
import { weekInfo } from '../src/features/booking/slots/slotLogic';
import { LecturerRow } from '../src/features/lecturers/components/LecturerRow';

async function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

const mk = (id: string, hour: number, over: Partial<BookableSlot> = {}) => ({
  id,
  lecturerId: 'l1',
  startAt: vnDateToInstant(2026, 11, 18, hour).toISOString(),
  endAt: vnDateToInstant(2026, 11, 18, hour, 20).toISOString(),
  available: true,
  conflict: false,
  ...over,
});

function texts(r: ReactTestRenderer.ReactTestRenderer): string[] {
  return r.root
    .findAllByType('Text' as never)
    .map(n => [n.props.children].flat().join(''));
}

describe('SlotGrid', () => {
  const items = [
    { slot: mk('a', 9), state: 'available' as const },
    { slot: mk('b', 10, { available: false }), state: 'full' as const },
    { slot: mk('c', 11, { conflict: true }), state: 'conflict' as const },
  ];

  test('renders times and reports selection by state', async () => {
    const onSelect = jest.fn();
    const r = await render(<SlotGrid items={items} onSelect={onSelect} />);
    expect(texts(r)).toEqual(['09:00', '10:00', '11:00']);
    const pills = r.root.findAll(
      n => n.props.accessibilityRole === 'button' && !!n.props.onPress,
    );
    await ReactTestRenderer.act(async () => {
      pills[0].props.onPress();
      pills[1].props.onPress();
    });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect.mock.calls[0][1]).toBe('available');
    expect(onSelect.mock.calls[1][1]).toBe('full');
  });

  test('conflict slots are disabled; full slots too when not selectable', async () => {
    const r = await render(
      <SlotGrid items={items} onSelect={jest.fn()} fullSelectable={false} />,
    );
    const disabled = r.root
      .findAll(n => n.props.accessibilityRole === 'button' && !!n.props.onPress)
      .map(n => n.props.accessibilityState.disabled);
    expect(disabled).toEqual([false, true, true]);
  });
});

describe('WeekStrip', () => {
  test('shows week number, range and 7 days; prev disabled at the first week', async () => {
    const week = weekInfo(vnDateToInstant(2026, 11, 18).getTime(), 0);
    const onNext = jest.fn();
    const r = await render(
      <WeekStrip
        week={week}
        selectedKey="2026-11-18"
        daysWithSlots={new Set(['2026-11-18'])}
        canGoPrev={false}
        onPrev={jest.fn()}
        onNext={onNext}
        onSelectDay={jest.fn()}
      />,
    );
    const t = texts(r);
    expect(t).toContain('Tuần 47');
    expect(t).toContain('16–22/11');
    expect(t.filter(x => /^T[2-7]$|^CN$/.test(x))).toHaveLength(7);
    const prev = r.root.find(n => n.props.accessibilityLabel === 'Tuần trước');
    expect(prev.props.accessibilityState.disabled).toBe(true);
    const next = r.root.find(n => n.props.accessibilityLabel === 'Tuần sau');
    await ReactTestRenderer.act(async () => next.props.onPress());
    expect(onNext).toHaveBeenCalled();
  });
});

describe('LecturerCover and LecturerRow', () => {
  test('cover renders with and without a photo', async () => {
    await render(<LecturerCover id="l1" photoUrl="https://x/y.jpg" />);
    await render(<LecturerCover id="l1" photoUrl={null} dim />);
  });

  test('row shows name and department and fires onPress with the lecturer', async () => {
    const lecturer = {
      id: 'l1',
      slug: 'khoa',
      name: 'TS. Nguyễn Minh Khoa',
      department: 'CNTT',
      photoUrl: null,
      blurb: null,
    };
    const r = await render(
      <GestureHandlerRootView>
        <LecturerRow lecturer={lecturer} onPress={jest.fn()} />
      </GestureHandlerRootView>,
    );
    const t = texts(r);
    expect(t).toContain('TS. Nguyễn Minh Khoa');
    expect(t).toContain('CNTT');
  });
});
