import { useCallback, useRef, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import {
  GestureDetector,
  GestureStateManager,
  useManualGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { press3D, springs } from '../../theme';

const PERSPECTIVE = 700;
// Finger travel (px) after which the touch is a scroll/drag, not a tap.
const TAP_SLOP = 10;

export type PressableCardProps = {
  onPress?: () => void;
  disabled?: boolean;
  /** Max tilt in degrees; defaults to press3D.maxTilt. */
  tilt?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * press3D: tilts toward the finger and shrinks while pressed.
 *
 * Uses a *Manual* gesture: it only observes raw touches and never
 * activates, so it never claims the touch from a parent ScrollView/FlashList.
 * If the finger moves more than TAP_SLOP or the system cancels the touch
 * (scroll started), the card springs back and onPress is not fired.
 * All animation runs on the UI thread; idle cost is one shared-value set.
 */
export function PressableCard({
  onPress,
  disabled,
  tilt = press3D.maxTilt,
  style,
  children,
  accessibilityLabel,
  testID,
}: PressableCardProps) {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const scale = useSharedValue(1);
  const w = useSharedValue(1);
  const h = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const pressing = useSharedValue(false);

  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const firePress = useCallback(() => onPressRef.current?.(), []);
  const hapticIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const gesture = useManualGesture({
    enabled: !disabled,
    onTouchesDown: e => {
      'worklet';
      const t = e.changedTouches[0];
      if (!t) {
        return;
      }
      startX.value = t.x;
      startY.value = t.y;
      pressing.value = true;
      const nx = (t.x / w.value) * 2 - 1;
      const ny = (t.y / h.value) * 2 - 1;
      rx.value = withSpring(-ny * tilt, springs.press);
      ry.value = withSpring(nx * tilt, springs.press);
      scale.value = withSpring(press3D.pressedScale, springs.press);
      scheduleOnRN(hapticIn);
    },
    onTouchesMove: e => {
      'worklet';
      const t = e.allTouches[0];
      if (!t || !pressing.value) {
        return;
      }
      if (
        Math.abs(t.x - startX.value) > TAP_SLOP ||
        Math.abs(t.y - startY.value) > TAP_SLOP
      ) {
        pressing.value = false;
        rx.value = withSpring(0, springs.release);
        ry.value = withSpring(0, springs.release);
        scale.value = withSpring(1, springs.release);
        return;
      }
      const nx = Math.max(-1, Math.min(1, (t.x / w.value) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (t.y / h.value) * 2 - 1));
      rx.value = withSpring(-ny * tilt, springs.press);
      ry.value = withSpring(nx * tilt, springs.press);
    },
    onTouchesUp: e => {
      'worklet';
      const wasPressing = pressing.value;
      pressing.value = false;
      rx.value = withSpring(0, springs.release);
      ry.value = withSpring(0, springs.release);
      scale.value = withSpring(1, springs.release);
      GestureStateManager.fail(e.handlerTag);
      if (wasPressing) {
        scheduleOnRN(firePress);
      }
    },
    onTouchesCancel: e => {
      'worklet';
      pressing.value = false;
      rx.value = withSpring(0, springs.release);
      ry.value = withSpring(0, springs.release);
      scale.value = withSpring(1, springs.release);
      GestureStateManager.fail(e.handlerTag);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scale.value,
      [press3D.pressedScale, 1],
      [press3D.pressedOpacity, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      { perspective: PERSPECTIVE },
      { rotateX: `${rx.value}deg` },
      { rotateY: `${ry.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[style, animatedStyle]}
        onLayout={e => {
          w.value = Math.max(1, e.nativeEvent.layout.width);
          h.value = Math.max(1, e.nativeEvent.layout.height);
        }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        onAccessibilityTap={disabled ? undefined : firePress}
        testID={testID}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
