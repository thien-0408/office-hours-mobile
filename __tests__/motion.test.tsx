/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  BlurTarget,
  Glass,
  GlassProvider,
  Glow,
  Odometer,
  PressableCard,
  Reveal,
  Skeleton,
  claimReveal,
  navPillTabX,
  resetReveal,
  burstDelay,
  Loadable,
  resolveGlassLevel,
  revealDelay,
  splitOdometer,
} from '../src/components/motion';

const render = async (el: React.ReactElement) => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    r = ReactTestRenderer.create(el);
  });
  return r;
};
// expo-blur is mocked as a plain View; BlurView is the only one with blurMethod.
const hasBlur = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => n.props.blurMethod === 'dimezisBlurViewSdk31Plus')
    .length > 0;

describe('resolveGlassLevel', () => {
  const base = {
    quality: 'auto' as const,
    os: 'ios',
    apiLevel: 17,
    pixelRatio: 3,
    hasTarget: true,
  };
  it('auto: high on capable hi-dpi, low on lower dpi', () => {
    expect(resolveGlassLevel(base)).toBe('high');
    expect(resolveGlassLevel({ ...base, pixelRatio: 2 })).toBe('low');
    expect(resolveGlassLevel({ ...base, os: 'android', apiLevel: 31 })).toBe(
      'high',
    );
  });
  it('falls back to solid when no target, forced solid or old Android', () => {
    expect(resolveGlassLevel({ ...base, hasTarget: false })).toBe('solid');
    expect(resolveGlassLevel({ ...base, quality: 'solid' })).toBe('solid');
    expect(resolveGlassLevel({ ...base, os: 'android', apiLevel: 30 })).toBe(
      'solid',
    );
    expect(
      resolveGlassLevel({ ...base, quality: 'high', hasTarget: false }),
    ).toBe('solid');
  });
});

describe('Glass', () => {
  it('renders solid (no BlurView) without a registered target', async () => {
    const r = await render(
      <GlassProvider>
        <Glass>
          <Text>x</Text>
        </Glass>
      </GlassProvider>,
    );
    expect(hasBlur(r)).toBe(false);
  });

  it('blurs once a BlurTarget is registered, unless forced solid', async () => {
    const blur = await render(
      <GlassProvider>
        <BlurTarget />
        <Glass level="high" />
      </GlassProvider>,
    );
    expect(hasBlur(blur)).toBe(true);

    const forced = await render(
      <GlassProvider initialQuality="solid">
        <BlurTarget />
        <Glass />
      </GlassProvider>,
    );
    expect(hasBlur(forced)).toBe(false);
  });
});

describe('Reveal', () => {
  beforeEach(() => resetReveal());

  it('claimReveal is true once per id', () => {
    expect(claimReveal('a')).toBe(true);
    expect(claimReveal('a')).toBe(false);
    expect(claimReveal('b')).toBe(true);
  });

  it('staggers 55ms per index, capped at 6 steps', () => {
    expect(revealDelay(0)).toBe(0);
    expect(revealDelay(3)).toBe(165);
    expect(revealDelay(40)).toBe(330);
  });

  it('cascades reveals that mount together, restarts after a pause', () => {
    expect(burstDelay(1000)).toBe(0);
    expect(burstDelay(1010)).toBe(55);
    expect(burstDelay(1020)).toBe(110);
    expect(burstDelay(2000)).toBe(0);
  });

  it('second mount with the same id skips the entering animation', async () => {
    const entering = (r: ReactTestRenderer.ReactTestRenderer) =>
      r.root.findAll(n => 'entering' in n.props && n.props.testID === 'rv')[0]
        ?.props.entering;
    const first = await render(<Reveal id="card-1" />);
    expect(
      first.root.findAll(n => n.props.entering != null).length,
    ).toBeGreaterThan(0);
    const second = await render(<Reveal id="card-1" />);
    expect(second.root.findAll(n => n.props.entering != null).length).toBe(0);
    expect(entering(second)).toBeUndefined();
  });
});

describe('Loadable', () => {
  const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
    r.root.findAllByType(Text).map(t => t.props.children);
  const view = (loading: boolean) => (
    <Loadable loading={loading} skeleton={<Text>bones</Text>}>
      <Text>data</Text>
    </Loadable>
  );

  it('shows the skeleton, then reveals the content', async () => {
    const r = await render(view(true));
    expect(texts(r)).toEqual(['bones']);
    await act(() => r.update(view(false)));
    expect(texts(r)).toEqual(['data']);
    expect(r.root.findAll(n => n.props.entering != null).length).toBeGreaterThan(0);
  });

  it('content cached at mount appears without animating', async () => {
    const r = await render(view(false));
    expect(texts(r)).toEqual(['data']);
    expect(r.root.findAll(n => n.props.entering != null).length).toBe(0);
  });
});

describe('splitOdometer', () => {
  it('splits ints into digits', () => {
    expect(
      splitOdometer(407).map(t => (t.kind === 'digit' ? t.digit : t.char)),
    ).toEqual([4, 0, 7]);
    expect(splitOdometer(-3).length).toBe(1);
  });
  it('splits mm:ss with padding and a separator', () => {
    expect(
      splitOdometer(125, 'mm:ss').map(t =>
        t.kind === 'digit' ? t.digit : t.char,
      ),
    ).toEqual([0, 2, ':', 0, 5]);
    expect(splitOdometer(5, 'mm:ss').length).toBe(5);
  });
  it('keys columns from the right so they survive growth', () => {
    expect(splitOdometer(99)[1].key).toBe(splitOdometer(199)[2].key);
  });
});

describe('navPillTabX', () => {
  it('places tabs left to right and widens the active slot', () => {
    const a = navPillTabX(0, 0, 3, 358);
    const b = navPillTabX(1, 0, 3, 358);
    expect(b.x - a.x).toBe(a.activeW);
    const c = navPillTabX(1, 1, 3, 358);
    expect(c.x - a.x).toBe(48);
  });
});

describe('rendering', () => {
  it('renders Odometer, Skeleton, Glow, PressableCard', async () => {
    await render(
      <GestureHandlerRootView>
        <Odometer value={75} format="mm:ss" />
        <Odometer value={12} />
        <Skeleton />
        <Glow tone="brand" position="c" />
        <PressableCard onPress={() => {}}>
          <Text>card</Text>
        </PressableCard>
      </GestureHandlerRootView>,
    );
  });
});
