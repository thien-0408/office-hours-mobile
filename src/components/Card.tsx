import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

export interface CardProps extends ViewProps {
  children?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressableProps?: Omit<PressableProps, 'onPress' | 'style' | 'children'>;
}

export function Card({
  children,
  onPress,
  style,
  pressableProps,
  ...rest
}: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          style,
        ]}
        {...pressableProps}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card, // 20
    borderCurve: 'continuous',
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
