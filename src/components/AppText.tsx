import type { TextProps } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { text, type TextVariant } from '../theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
  tabular?: boolean;
}

export function AppText({
  variant = 'sub',
  color,
  center,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const baseStyle = text[variant];
  return (
    <Text
      style={[
        baseStyle,
        color != null && { color },
        center && styles.center,
        tabular && styles.tabular,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
