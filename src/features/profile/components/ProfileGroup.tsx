import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../../theme';

export interface ProfileGroupProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ProfileGroup({ children, style, testID }: ProfileGroupProps) {
  return (
    <View testID={testID} style={[styles.group, style]}>
      {children}
    </View>
  );
}

export interface SectionLabelProps {
  title: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function SectionLabel({ title, style, textStyle }: SectionLabelProps) {
  return (
    <View style={[styles.labelContainer, style]}>
      <Text style={[styles.labelText, textStyle]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.s1,
    borderRadius: radius.card, // 20
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  labelContainer: {
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 12.5,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    letterSpacing: -0.1,
  },
});
