import type { ComponentType, ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import type { LucideProps } from 'lucide-react-native';
import { colors, radius, size as themeSize } from '../theme';
import { Icon, type IconLevel } from './Icon';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  accessibilityLabel: string;
  icon?: ComponentType<LucideProps>;
  iconSize?: number;
  iconLevel?: IconLevel;
  size?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  accessibilityLabel,
  icon,
  iconSize = 20,
  iconLevel = 'normal',
  size = themeSize.iconButton,
  children,
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...rest}
    >
      {icon ? (
        <Icon as={icon} size={iconSize} level={iconLevel} />
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.s3,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.38,
  },
});
