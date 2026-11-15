import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { motion } from '../../theme';
import { useReduceMotion } from './reduceMotion';

const STAGGER_MS = motion.stagger;
const DURATION_MS = motion.revealDuration;
const OFFSET_Y = motion.revealOffsetY;

// Ids already revealed in this app session. Module level so remounts and
// recycled FlashList cells never replay the animation.
const revealed = new Set<string>();

/** True the first time an id is seen this session, false afterwards. */
export function claimReveal(id: string): boolean {
  if (revealed.has(id)) {
    return false;
  }
  revealed.add(id);
  return true;
}

/** Test helper: forget every revealed id. */
export function resetReveal() {
  revealed.clear();
}

/** Entering delay for a list index. */
// Capped so long lists never make the last rows wait.
export const revealDelay = (index: number) => Math.min(index, 12) * STAGGER_MS;

export type RevealProps = {
  /** Stable identity (e.g. item id); the animation runs once per id. */
  id: string;
  /** Position in the list, 40ms stagger per index. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Fade + slide up entering animation, once per id per session. */
export function Reveal({ id, index = 0, style, children }: RevealProps) {
  // Decided at mount: recycled cells keep their first decision, and the
  // `entering` prop only matters at mount anyway.
  const reduce = useReduceMotion();
  const [claimed] = useState(() => claimReveal(id));
  const animate = claimed && !reduce;
  const delay = revealDelay(index);
  const entering = useMemo(
    () =>
      animate
        ? () => {
            'worklet';
            const timing = {
              duration: DURATION_MS,
              easing: Easing.bezier(0.22, 1, 0.36, 1),
            };
            return {
              initialValues: {
                opacity: 0,
                transform: [{ translateY: OFFSET_Y }],
              },
              animations: {
                opacity: withDelay(delay, withTiming(1, timing)),
                transform: [
                  { translateY: withDelay(delay, withTiming(0, timing)) },
                ],
              },
            };
          }
        : undefined,
    [animate, delay],
  );
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

/**
 * Wrap loaded content that replaces a Skeleton: it fades in while the
 * skeleton (wrap it in this too) fades out, instead of popping.
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

/** Placeholder block (#D9D9D9 at 22%) with a slow opacity pulse. */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [pulse]);
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
