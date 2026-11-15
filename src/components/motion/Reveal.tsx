import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { motion, revealEasing } from '../../theme';
import { useReduceMotion } from './reduceMotion';

const STAGGER_MS = motion.stagger;
const DURATION_MS = motion.revealDuration;
const OFFSET_Y = motion.revealOffsetY;
// Reveals that start within this window count as one burst and take turns.
const BURST_WINDOW_MS = 120;

// Ids already revealed in this app session. Module level so remounts and
// recycled FlashList cells never replay the animation.
const revealed = new Set<string>();
let burstStartedAt = -Infinity;
let burstCount = 0;

/** True the first time an id is seen this session, false afterwards. */
export function claimReveal(id: string): boolean {
  if (revealed.has(id)) {
    return false;
  }
  revealed.add(id);
  return true;
}

/** Test helper: forget every revealed id and the current burst. */
export function resetReveal() {
  revealed.clear();
  burstStartedAt = -Infinity;
  burstCount = 0;
}

/** Entering delay for an explicit list index (capped so the last rows never wait long). */
export const revealDelay = (index: number) =>
  Math.min(Math.max(index, 0), motion.staggerMax) * STAGGER_MS;

/**
 * Delay for a reveal without an explicit index: a whole page of rows that
 * mounts at once goes one after another, in mount order (Mochy's burst
 * cascade). A lone reveal later on starts at once.
 */
export function burstDelay(now: number = Date.now()): number {
  if (now - burstStartedAt > BURST_WINDOW_MS) {
    burstStartedAt = now;
    burstCount = 0;
  }
  return revealDelay(burstCount++);
}

/** Extra delay for reveals inside a <Loadable> (they wait for the skeleton to leave). */
const RevealBaseDelay = createContext(0);

/** Fade + rise entering animation on the reveal curve. */
function revealEntering(delay: number, rise: number, duration = DURATION_MS) {
  return () => {
    'worklet';
    const timing = {
      duration,
      easing: Easing.bezier(
        revealEasing[0],
        revealEasing[1],
        revealEasing[2],
        revealEasing[3],
      ),
    };
    return {
      initialValues: {
        opacity: 0,
        transform: [{ translateY: rise }],
      },
      animations: {
        opacity: withDelay(delay, withTiming(1, timing)),
        transform: [{ translateY: withDelay(delay, withTiming(0, timing)) }],
      },
    };
  };
}

export type RevealProps = {
  /** Stable identity (e.g. item id); the animation runs once per id. */
  id: string;
  /**
   * Explicit order. Leave it out in lists: rows that mount together are
   * cascaded automatically.
   */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
};

/** Fade + slide up entering animation, once per id per session. */
export function Reveal({ id, index, style, children, testID }: RevealProps) {
  // Decided at mount: recycled cells keep their first decision, and the
  // `entering` prop only matters at mount anyway.
  const reduce = useReduceMotion();
  const base = useContext(RevealBaseDelay);
  const [claimed] = useState(() => claimReveal(id));
  const animate = claimed && !reduce;
  const [delay] = useState(() =>
    !claimed ? 0 : base + (index == null ? burstDelay() : revealDelay(index)),
  );
  const entering = useMemo(
    () => (animate ? revealEntering(delay, OFFSET_Y) : undefined),
    [animate, delay],
  );
  return (
    <Animated.View entering={entering} style={style} testID={testID}>
      {children}
    </Animated.View>
  );
}

/** How long content waits after the skeleton starts fading out. */
export const LOADABLE_DELAY = motion.skeletonOut * 0.5 + motion.contentGap;

export type LoadableProps = {
  loading: boolean;
  /** Shown while loading; fades out when the data lands. */
  skeleton: ReactNode;
  children?: ReactNode;
  /**
   * Also rise the content (default). Turn off when the children are rows
   * with their own <Reveal>, so they cascade in instead.
   */
  rise?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Skeleton -> content, the way Mochy lands a page: the skeleton fades out,
 * a short beat, then the content fades (and rises) in. Only the
 * loading -> loaded switch animates; content that was already cached at
 * mount appears at once and later refreshes swap in place.
 */
export function Loadable({
  loading,
  skeleton,
  children,
  rise = true,
  style,
}: LoadableProps) {
  const reduce = useReduceMotion();
  const sawSkeleton = useRef(loading);
  if (loading) {
    sawSkeleton.current = true;
  }
  const animate = sawSkeleton.current && !reduce;
  const entering = useMemo(
    () =>
      animate
        ? revealEntering(LOADABLE_DELAY, rise ? OFFSET_Y : 0)
        : undefined,
    [animate, rise],
  );
  if (loading) {
    return (
      <Animated.View
        key="skeleton"
        exiting={reduce ? undefined : FadeOut.duration(motion.skeletonOut)}
        style={style}
      >
        {skeleton}
      </Animated.View>
    );
  }
  return (
    <RevealBaseDelay.Provider value={animate ? LOADABLE_DELAY : 0}>
      <Animated.View key="content" entering={entering} style={style}>
        {children}
      </Animated.View>
    </RevealBaseDelay.Provider>
  );
}

/**
 * Wrap loaded content that replaces a Skeleton: it fades in while the
 * skeleton (wrap it in this too) fades out, instead of popping.
 * Prefer <Loadable>, which also sequences the two.
 */
export function ContentFade({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(motion.contentFade)}
      exiting={FadeOut.duration(motion.contentFade / 2)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

// One full breath every 2 s, the same period as Mochy's bone wave. Every
// skeleton starts from wall-clock phase, so a page of them breathes together.
const PULSE_HALF_MS = 1000;

/** Placeholder block (#D9D9D9 at 22%) with a slow opacity pulse. */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const reduce = useReduceMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (reduce) {
      pulse.value = 0.8;
      return;
    }
    const ease = { duration: PULSE_HALF_MS, easing: Easing.inOut(Easing.sin) };
    const phase = Date.now() % (PULSE_HALF_MS * 2);
    // Join the shared rhythm, then loop.
    const firstLeg = phase < PULSE_HALF_MS;
    pulse.value = firstLeg ? 1 : 0.45;
    pulse.value = withSequence(
      withTiming(firstLeg ? 0.45 : 1, {
        ...ease,
        duration: PULSE_HALF_MS - (phase % PULSE_HALF_MS),
      }),
      withRepeat(
        withSequence(
          withTiming(firstLeg ? 1 : 0.45, ease),
          withTiming(firstLeg ? 0.45 : 1, ease),
        ),
        -1,
      ),
    );
  }, [pulse, reduce]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animated,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: 'rgba(217,217,217,0.22)' },
});
