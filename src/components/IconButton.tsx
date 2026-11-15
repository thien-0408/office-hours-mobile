import type { ComponentType, ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { PressableScale } from './motion/PressableScale';
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
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
        },
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
    </PressableScale>
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
  disabled: {
    opacity: 0.38,
  },
});
