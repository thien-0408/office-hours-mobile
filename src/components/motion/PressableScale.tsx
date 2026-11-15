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
 * The one press feedback of the app (Button, IconButton, tab items,
 * PressableCard share it): scale to press3D.pressedScale and dip opacity
 * on a fast no-bounce spring, spring back with a tiny overshoot.
 * `progress` runs 0..1 on the UI thread.
 */
export function usePressFeedback(disabled?: boolean) {
  const progress = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, press3D.pressedOpacity]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, press3D.pressedScale]) },
    ],
  }));
  const pressIn = useCallback(() => {
    if (!disabled) {
      progress.value = withSpring(1, springs.press);
    }
  }, [disabled, progress]);
  const pressOut = useCallback(() => {
    progress.value = withSpring(0, springs.release);
  }, [progress]);
  return { style, pressIn, pressOut };
}

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/** Pressable with the shared press feedback. `style` is static (no function form). */
export const PressableScale = forwardRef<
  ComponentRef<typeof Pressable>,
  PressableScaleProps
>(function PressableScaleView(
  { style, disabled, onPressIn, onPressOut, ...rest },
  ref,
) {
  const fb = usePressFeedback(disabled ?? undefined);
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
