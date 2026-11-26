import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, glowConfigs, GlowTone } from '../theme/tokens';

export type GlowPosition = 'tl' | 'tr' | 'c' | 'dual-auth';

interface GlowBackgroundProps {
  tone?: GlowTone;
  position?: GlowPosition;
  opacityOverride?: number;
}

export function GlowBackground({
  tone = 'brand',
  position = 'tl',
  opacityOverride,
}: GlowBackgroundProps) {
  const cfg = glowConfigs[tone];
  const op = opacityOverride ?? cfg.opacity;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {position === 'dual-auth' ? (
        <>
          <GlowOrb
            color={glowConfigs.indigo.color}
            opacity={glowConfigs.indigo.opacity}
            cx="15%"
            cy="8%"
          />
          <GlowOrb
            color={glowConfigs.brand.color}
            opacity={glowConfigs.brand.opacity}
            cx="88%"
            cy="10%"
          />
        </>
      ) : (
        <GlowOrb
          color={cfg.color}
          opacity={op}
          cx={position === 'tl' ? '15%' : position === 'tr' ? '85%' : '50%'}
          cy="6%"
        />
      )}
    </View>
  );
}

function GlowOrb({
  color,
  opacity,
  cx,
  cy,
}: {
  color: string;
  opacity: number;
  cx: string;
  cy: string;
}) {
  const gradId = `glow-${color.replace('#', '')}-${cx}`;
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={gradId} cx={cx} cy={cy} rx="65%" ry="38%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="55%" stopColor={color} stopOpacity={opacity * 0.35} />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
    </Svg>
  );
}