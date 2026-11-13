import { StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass, radius } from '../../theme';
import { useGlass, useGlassLevel, type GlassQuality } from './GlassProvider';

export type GlassProps = ViewProps & {
  /** Force a level; otherwise the provider's quality + device decide. */
  level?: GlassQuality;
};

// expo-blur intensity is 1..100; glass.blur* are CSS-like radii.
const intensityFor = (blur: number) => Math.min(100, blur * 3);

/**
 * The only frosted surface in the app (nav pill, now-card, toast).
 * Blur is skipped (solid) when no BlurTarget is registered or the device
 * cannot blur. Put borderRadius in `style`.
 */
export function Glass({ level: forced, style, children, ...rest }: GlassProps) {
  const level = useGlassLevel(forced);
  const { targetRef } = useGlass();
  const flat = StyleSheet.flatten(style) ?? {};
  const borderRadius =
    typeof flat.borderRadius === 'number' ? flat.borderRadius : radius.card;

  return (
    <View {...rest} style={[styles.shadow, style, { borderRadius }]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.clip, { borderRadius }]}
      >
        {level !== 'solid' ? (
          <BlurView
            intensity={intensityFor(
              level === 'high' ? glass.blurHigh : glass.blurLow,
            )}
            tint="dark"
            blurTarget={targetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: level === 'solid' ? glass.solid : glass.tint },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.outline, { borderRadius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { boxShadow: glass.shadow },
  clip: { overflow: 'hidden' },
  outline: { borderWidth: 1, borderColor: glass.outline },
});
