import { forwardRef, useCallback, type ComponentRef } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { press3D, springs } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `surface`: buttons, rows, cards. Scale to 0.97 and dip opacity on a fast
 * no-bounce spring, spring back with a tiny overshoot.
 * `icon`: round icon buttons. Shrink to 0.86 and bounce back, one lively
 * spring both ways (Mochy's transport buttons).
 */
export type PressFeedbackKind = 'surface' | 'icon';

/**
 * The one press feedback of the app (Button, IconButton, tab items,
 * PressableCard share it). `progress` runs 0..1 on the UI thread.
 */
export function usePressFeedback(
  disabled?: boolean,
  kind: PressFeedbackKind = 'surface',
) {
  const progress = useSharedValue(0);
  const icon = kind === 'icon';
  const pressedScale = icon ? press3D.iconPressedScale : press3D.pressedScale;
  const pressedOpacity = icon ? 1 : press3D.pressedOpacity;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, pressedOpacity]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, pressedScale]) },
    ],
  }));
  const pressIn = useCallback(() => {
    if (!disabled) {
      progress.value = withSpring(1, icon ? springs.pressIcon : springs.press);
    }
  }, [disabled, icon, progress]);
  const pressOut = useCallback(() => {
    progress.value = withSpring(0, icon ? springs.pressIcon : springs.release);
  }, [icon, progress]);
  return { style, pressIn, pressOut };
}

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  feedback?: PressFeedbackKind;
};

/** Pressable with the shared press feedback. `style` is static (no function form). */
export const PressableScale = forwardRef<
  ComponentRef<typeof Pressable>,
  PressableScaleProps
>(function PressableScaleView(
  { style, disabled, onPressIn, onPressOut, feedback = 'surface', ...rest },
  ref,
) {
  const fb = usePressFeedback(disabled ?? undefined, feedback);
  return (
    <AnimatedPressable
      ref={ref}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        fb.pressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        fb.pressOut();
        onPressOut?.(e);
      }}
      style={[style, fb.style]}
      {...rest}
    />
  );
});
