import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { colors, size as themeSize } from '../theme';
import { memojiFor } from './memoji';

export type AvatarShape = 'round' | 'squircle';

export interface AvatarProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  id?: string;
  size?: number;
  shape?: AvatarShape;
}

export function Avatar({
  uri,
  id = '',
  size = themeSize.avatar, // 40
  shape = 'round',
  style,
  onError,
  accessibilityLabel = 'Avatar',
  ...rest
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const fallbackSource = memojiFor(id);
  const resolvedSource = uri && !hasError ? { uri } : fallbackSource;

  const shapeRadius = shape === 'round' ? size / 2 : 14;

  return (
    <Image
      source={resolvedSource}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      transition={150}
      onError={e => {
        setHasError(true);
        onError?.(e);
      }}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: shapeRadius,
        },
        shape === 'squircle' && styles.squircle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.s3,
    borderWidth: 1,
    borderColor: colors.line2,
    overflow: 'hidden',
  },
  squircle: {
    borderCurve: 'continuous',
  },
});
