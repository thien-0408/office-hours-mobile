import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { colors, iconOpacity, type IconOpacity } from '../theme';

export type IconLevel = keyof IconOpacity;

export interface IconProps extends Omit<LucideProps, 'as' | 'opacity'> {
  as: ComponentType<LucideProps>;
  size?: number;
  level?: IconLevel;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

export function Icon({
  as: Component,
  size = 20,
  level = 'normal',
  color = colors.fg,
  strokeWidth = 1.9,
  opacity,
  style,
  ...rest
}: IconProps) {
  const resolvedOpacity: number = opacity ?? iconOpacity[level];

  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      opacity={resolvedOpacity}
      style={[{ opacity: resolvedOpacity }, style]}
      {...rest}
    />
  );
}
