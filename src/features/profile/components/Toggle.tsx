import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius, springs } from '../../../theme';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 30;
const KNOB_SIZE = 24;
const KNOB_PADDING = 3;
const TRAVEL_DISTANCE = TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING * 2; // 20

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel = 'Công tắc',
  style,
  testID,
}: ToggleProps) {
  const translateX = useSharedValue(value ? TRAVEL_DISTANCE : 0);

  useEffect(() => {
    translateX.value = withSpring(
      value ? TRAVEL_DISTANCE : 0,
      springs.indicator,
    );
  }, [value, translateX]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [0, TRAVEL_DISTANCE],
      [colors.s4, colors.fg],
    ),
  }));

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: interpolateColor(
      translateX.value,
      [0, TRAVEL_DISTANCE],
      ['#777777', '#000000'],
    ),
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.container, disabled && styles.disabled, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.track, animatedTrackStyle]}>
        <Animated.View style={[styles.knob, animatedKnobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    position: 'relative',
    overflow: 'hidden',
  },
  knob: {
    position: 'absolute',
    top: KNOB_PADDING,
    left: KNOB_PADDING,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
  },
  disabled: {
    opacity: 0.38,
  },
});
