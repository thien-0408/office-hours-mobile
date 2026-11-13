import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, glass, ls, radius } from '../theme';

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

export function Seg({ options, value, onChange, style }: SegProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              isSelected ? styles.itemSelected : styles.itemUnselected,
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
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  item: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  itemSelected: {
    backgroundColor: glass.highlight,
    borderWidth: 1,
    borderColor: glass.outline,
  },
  itemUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
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
