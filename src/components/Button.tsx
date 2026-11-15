import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { PressableScale } from './motion/PressableScale';
import { colors, fonts, ls, radius, size as themeSize, text } from '../theme';

export type ButtonVariant = 'primary' | 'ghost' | 'quiet';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  variant?: ButtonVariant;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  variant = 'primary',
  title,
  disabled = false,
  loading = false,
  leading,
  trailing,
  children,
  onPress,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const isQuiet = variant === 'quiet';
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || loading;

  const spinnerColor = isPrimary ? colors.onPrimary : isQuiet ? colors.fg2 : colors.fg;

  const resolvedTextColor = disabled
    ? 'rgba(255,255,255,0.42)'
    : isPrimary
    ? colors.onPrimary
    : isQuiet
    ? colors.fg2
    : colors.fg;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      style={[
        styles.base,
        isQuiet ? styles.heightQuiet : styles.heightNormal,
        isPrimary && styles.primaryBg,
        isGhost && styles.ghostBg,
        isQuiet && styles.quietBg,
        disabled && isPrimary && styles.disabledPrimaryBg,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : children ? (
        children
      ) : (
        <>
          {leading}
          {title ? (
            <Text
              style={[
                isQuiet ? styles.quietText : styles.normalText,
                { color: resolvedTextColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {trailing}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  heightNormal: {
    height: themeSize.button, // 54
  },
  heightQuiet: {
    height: themeSize.buttonQuiet, // 44
  },
  primaryBg: {
    backgroundColor: colors.primary,
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  quietBg: {
    backgroundColor: 'transparent',
  },
  disabledPrimaryBg: {
    backgroundColor: '#2a2a2a',
  },
  normalText: {
    ...text.button,
  },
  quietText: {
    fontSize: 14,
    letterSpacing: ls(14, -0.02),
    fontFamily: fonts.semibold,
  },
});
