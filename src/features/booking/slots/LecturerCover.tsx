import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memojiFor } from '../../../components';
import { tintPairs } from '../../../theme';

export const COVER_HEIGHT = 430;

/** Stable 0..3 index from an id, picks the tinted gradient of the memoji fallback. */
export function tintIndexFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h) % tintPairs.length;
}

export type LecturerCoverProps = {
  id: string;
  photoUrl?: string | null;
  height?: number;
  /** Extra darkening, used behind bottom sheets. */
  dim?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Cover art" header (STYLE-MOCHY 8.2): the lecturer photo full-bleed, fading to black.
 * Without a photo: memoji over a tinted gradient. Absolutely positioned at the top of its parent.
 */
export function LecturerCover({
  id,
  photoUrl,
  height = COVER_HEIGHT,
  dim,
  style,
}: LecturerCoverProps) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = !!photoUrl && !failed;
  const [tintTop, tintBottom] = tintPairs[tintIndexFor(id)];

  return (
    <View pointerEvents="none" style={[styles.root, { height }, style]}>
      {hasPhoto ? (
        <Image
          source={{ uri: photoUrl as string }}
          contentFit="cover"
          contentPosition={{ top: '22%', left: '50%' }}
          style={StyleSheet.absoluteFill}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <>
          <LinearGradient
            colors={[tintTop, tintBottom]}
            style={StyleSheet.absoluteFill}
          />
          <Image
            source={memojiFor(id)}
            contentFit="contain"
            style={[styles.memoji, { top: height * 0.1 }]}
          />
        </>
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', '#000']}
        locations={[0, 0.28, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />
      {dim ? <View style={styles.dim} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  memoji: {
    position: 'absolute',
    alignSelf: 'center',
    width: 230,
    height: 230,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.64)',
  },
});
