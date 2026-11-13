import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ls, radius } from '../theme';
import { StatusGlyph, statusGlyph } from './StatusGlyph';

export interface StatusPillProps {
  status: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function StatusPill({ status, label, style, textStyle }: StatusPillProps) {
  const glyph = statusGlyph(status);
  const isFullBrightness = glyph.opacity === 1;

  return (
    <View style={[styles.pill, style]}>
      <StatusGlyph
        kind={glyph.kind}
        size={15}
        opacity={glyph.opacity}
        style={styles.glyph}
      />
      <Text
        style={[
          styles.label,
          { color: isFullBrightness ? colors.fg : colors.fg2 },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  glyph: {
    marginLeft: -2,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    letterSpacing: ls(12, -0.01),
  },
});
