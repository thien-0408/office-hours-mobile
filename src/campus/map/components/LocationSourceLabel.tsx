import { StyleSheet, Text, View } from 'react-native';
import type { FloorSource } from '../../geo';
import { colors, fonts, ls } from '../../../theme';

/** STYLE-MOCHY 8.10: estimated floor = dashed border; manual / real room = solid. */
export function labelBorderStyle(
  source: FloorSource | 'room' | undefined,
): 'dashed' | 'solid' {
  return source === 'baro' || source === undefined || source === null
    ? 'dashed'
    : 'solid';
}

export type LocationSourceLabelProps = {
  /** From locationLabel(): "B11 · tầng 2 (ước lượng)". */
  text: string;
  source?: FloorSource | 'room';
};

export function LocationSourceLabel({
  text,
  source,
}: LocationSourceLabelProps) {
  return (
    <View
      style={[styles.box, { borderStyle: labelBorderStyle(source) }]}
      testID="location-source-label"
    >
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(12.5, -0.01),
    color: colors.fg2,
  },
});
