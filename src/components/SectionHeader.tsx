import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, ls } from '../theme';
import { Icon } from './Icon';

export interface SectionHeaderProps {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
  more?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function SectionHeader({
  title,
  children,
  onPress,
  more,
  style,
  textStyle,
}: SectionHeaderProps) {
  const content = (
    <>
      <Text style={[styles.title, textStyle]}>{title ?? children}</Text>
      {more ? <Text style={styles.more}>{more}</Text> : null}
      {onPress ? <Icon as={ChevronRight} size={18} level="muted" /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 26,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    letterSpacing: ls(18, -0.045),
    color: colors.fg,
  },
  more: {
    marginLeft: 'auto',
    fontSize: 13,
    fontFamily: fonts.semibold,
    letterSpacing: ls(13, -0.01),
    color: colors.fg3,
    marginRight: 2,
  },
});
