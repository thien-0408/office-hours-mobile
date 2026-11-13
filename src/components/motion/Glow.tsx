import { useId } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { glow } from '../../theme';

export type GlowPosition = 'tl' | 'tr' | 'c';

// Mirrors .glow.tl / .tr / .c in mochy.css (px = dp).
const BOX: Record<GlowPosition, { w: number; h: number; place: ViewStyle }> = {
  tl: { w: 300, h: 260, place: { left: -120, top: -110 } },
  tr: { w: 300, h: 260, place: { right: -130, top: -100 } },
  c: { w: 360, h: 320, place: { left: '50%', marginLeft: -180, top: -120 } },
};

export type GlowProps = {
  tone: keyof typeof glow;
  position?: GlowPosition;
};

/**
 * Soft coloured ambient blob behind a screen header. RN has no CSS blur,
 * so this is an elliptical radial gradient (colour -> transparent) that
 * approximates a 70px-blurred blob. Place it first inside the screen's
 * relatively positioned container.
 */
export function Glow({ tone, position = 'tl' }: GlowProps) {
  const id = `glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { color, opacity } = glow[tone];
  const { w, h, place } = BOX[position];
  return (
    <Svg pointerEvents="none" width={w} height={h} style={[styles.abs, place]}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.5} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={w} height={h} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
