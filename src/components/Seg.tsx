import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, glass, ls, radius, springs } from '../theme';
import { haptic } from './motion/haptics';

export interface SegOption {
  value: string;
  label: string;
}

export interface SegProps {
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

const PAD = 4;

/**
 * Segmented control. The selected pill glides between options on the
 * indicator spring instead of jumping, and a change ticks the haptics.
 */
export function Seg({ options, value, onChange, style }: SegProps) {
  const index = Math.max(
    0,
    options.findIndex(o => o.value === value),
  );
  const [width, setWidth] = useState(0);
  const pos = useSharedValue(index);
  const itemW = useSharedValue(0);

  useEffect(() => {
    pos.value = withSpring(index, springs.indicator);
  }, [index, pos]);

  const count = options.length;
  useEffect(() => {
    itemW.value = width > 0 ? (width - PAD * 2) / Math.max(1, count) : 0;
  }, [width, count, itemW]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const thumb = useAnimatedStyle(() => ({
    width: itemW.value,
    transform: [{ translateX: pos.value * itemW.value }],
  }));

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.thumb, thumb]} />
      ) : null}
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (!isSelected) {
                haptic.selection();
              }
              onChange(option.value);
            }}
            style={[
              styles.item,
              // Until measured, the selected item draws its own pill.
              isSelected && width === 0 ? styles.itemSelected : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.pill,
    backgroundColor: glass.highlight,
    borderWidth: 1,
    borderColor: glass.outline,
  },
  item: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemSelected: {
    backgroundColor: glass.highlight,
    borderColor: glass.outline,
  },
  label: {
    fontSize: 14,
    letterSpacing: ls(14, -0.02),
  },
  labelSelected: {
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  labelUnselected: {
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
});
