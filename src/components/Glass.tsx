import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, glassHairline, squircle } from '../theme/tokens';

export type GlassQuality = 'high' | 'low' | 'solid';

interface GlassProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  quality?: GlassQuality;
  intensity?: number;
}

export function Glass({
  children,
  style,
  borderRadius = 20,
  quality = Platform.OS === 'ios' ? 'high' : 'solid',
  intensity = 32,
}: GlassProps) {
  const shapeStyle = squircle(borderRadius);

  if (quality === 'solid') {
    return (
      <View
        style={[
          styles.base,
          shapeStyle,
          { backgroundColor: colors.glassSolid },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const blurIntensity = quality === 'high' ? intensity : Math.round(intensity * 0.5);

  return (
    <View style={[styles.base, shapeStyle, styles.blurWrap, style]}>
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: glassHairline,
    borderColor: colors.glassLine,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  blurWrap: {
    overflow: 'hidden',
  },
});