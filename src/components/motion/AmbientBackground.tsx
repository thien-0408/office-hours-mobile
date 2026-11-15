import {
  memo,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { NavigationContext } from '@react-navigation/native';
import {
  AppState,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../theme';
import { useReduceMotion } from './reduceMotion';

type BlobSpec = {
  color: string;
  opacity: number;
  /** Diameter as a fraction of the screen width. */
  size: number;
  /** Centre as a fraction of screen width / height. */
  cx: number;
  cy: number;
  /** Full drift loop, ms. */
  period: number;
  /** Drift radius in dp. */
  ax: number;
  ay: number;
  /** Phase offset (0..1) so blobs never move in lockstep. */
  phase: number;
};

// Deep indigo / blue / violet only, kept low so text contrast stays high.
export const AMBIENT_BLOBS: readonly BlobSpec[] = [
  {
    color: '#4b47a0',
    opacity: 0.55,
    size: 1.5,
    cx: 0.0,
    cy: 0.1,
    period: 32000,
    ax: 70,
    ay: 90,
    phase: 0,
  },
  {
    color: '#3465e0',
    opacity: 0.4,
    size: 1.4,
    cx: 1.0,
    cy: 0.5,
    period: 40000,
    ax: 80,
    ay: 70,
    phase: 0.33,
  },
  {
    color: '#6a3fb0',
    opacity: 0.42,
    size: 1.6,
    cx: 0.1,
    cy: 0.95,
    period: 26000,
    ax: 90,
    ay: 60,
    phase: 0.66,
  },
];

const TWO_PI = Math.PI * 2;

/** True while the app is in the foreground (drift is paused otherwise). */
function useAppActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', s =>
      setActive(s === 'active'),
    );
    return () => sub.remove();
  }, []);
  return active;
}

function Blob({
  spec,
  running,
  width,
  height,
}: {
  spec: BlobSpec;
  running: boolean;
  width: number;
  height: number;
}) {
  const id = `amb-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const d = spec.size * width;
  // Loop position, derived from wall-clock so every instance (one per screen
  // surface) drifts in sync and the surfaces stay seamless.
  const t = useSharedValue(0);
  const started = useRef(false);

  useEffect(() => {
    if (!running) {
      cancelAnimation(t);
      return;
    }
    // First start joins the wall-clock loop; a resume (screen focused
    // again, app foregrounded) continues from where it paused, no jump.
    const start = started.current
      ? t.value % 1
      : (Date.now() % spec.period) / spec.period;
    started.current = true;
    t.value = start;
    t.value = withRepeat(
      withTiming(start + 1, { duration: spec.period, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(t);
  }, [running, spec.period, t]);

  const style = useAnimatedStyle(() => {
    const a = (t.value + spec.phase) * TWO_PI;
    return {
      transform: [
        { translateX: Math.sin(a) * spec.ax },
        { translateY: Math.cos(a) * spec.ay },
        { scale: 1 + 0.06 * Math.sin(a * 2) },
      ],
    };
  });

  const place: ViewStyle = {
    left: spec.cx * width - d / 2,
    top: spec.cy * height - d / 2,
    width: d,
    height: d,
  };
  return (
    <Animated.View pointerEvents="none" style={[styles.blob, place, style]}>
      <Svg width={d} height={d}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop
              offset="0"
              stopColor={spec.color}
              stopOpacity={spec.opacity}
            />
            <Stop
              offset="0.5"
              stopColor={spec.color}
              stopOpacity={spec.opacity * 0.45}
            />
            <Stop
              offset="0.8"
              stopColor={spec.color}
              stopOpacity={spec.opacity * 0.1}
            />
            <Stop offset="1" stopColor={spec.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={d} height={d} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * True while the surrounding navigator screen is focused (always true
 * outside navigation). Screens covered by a pushed screen stop drifting.
 */
function useScreenFocused() {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => nav?.isFocused() ?? true);
  useEffect(() => {
    if (!nav) {
      return;
    }
    setFocused(nav.isFocused());
    const offFocus = nav.addListener('focus', () => setFocused(true));
    const offBlur = nav.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [nav]);
  return focused;
}

/**
 * Slowly drifting indigo / blue / violet glows. Fills its parent, never
 * takes touches. Drift runs on the UI thread, pauses while the app is
 * backgrounded or the screen is covered, and is static under "reduce motion".
 */
export const AmbientBackground = memo(function AmbientBackgroundView() {
  const { width, height } = useWindowDimensions();
  const active = useAppActive();
  const focused = useScreenFocused();
  const reduce = useReduceMotion();
  return (
    <View pointerEvents="none" style={styles.fill}>
      {AMBIENT_BLOBS.map(spec => (
        <Blob
          key={spec.color}
          spec={spec}
          running={active && focused && !reduce}
          width={width}
          height={height}
        />
      ))}
    </View>
  );
});

/**
 * Opaque black + the ambient glows, behind `children`. Used as a screen
 * surface (so stack transitions never show the previous screen through a
 * transparent one) and inside BlurTarget (so glass blurs the glows).
 */
export function AmbientSurface({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.surface}>
      <AmbientBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  blob: { position: 'absolute' },
  surface: { flex: 1, backgroundColor: colors.bg },
});
