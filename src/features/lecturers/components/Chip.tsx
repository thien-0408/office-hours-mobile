import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, ls, radius } from '../../../theme';

export type ChipProps = {
  label: string;
  on?: boolean;
  onPress: () => void;
};

/** Text-only filter chip (STYLE-MOCHY 8.3: filters are words, no icons). */
export function Chip({ label, on = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.fg, borderColor: colors.fg },
  label: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(13.5, -0.01),
    color: colors.fg2,
  },
  labelOn: { color: '#000', fontFamily: fonts.semibold },
});
