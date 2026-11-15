import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  PixelRatio,
  Platform,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { AmbientBackground } from './AmbientBackground';
import { colors } from '../../theme';

export type GlassLevel = 'high' | 'low' | 'solid';
export type GlassQuality = 'auto' | GlassLevel;
type TargetNode = ComponentRef<typeof View>;

/**
 * Picks the level Glass really renders at. Pure so it can be tested.
 * - Without a registered blur target, or when the device cannot blur,
 *   everything degrades to `solid`.
 * - Otherwise a forced `high`/`low` wins; auto gives `high` on a pixel
 *   ratio >= 3 screen and `low` below that.
 * - Capable = iOS, or Android API >= 31.
 */
export function resolveGlassLevel(opts: {
  quality: GlassQuality;
  os: string;
  apiLevel: number | string;
  pixelRatio: number;
  hasTarget: boolean;
}): GlassLevel {
  const { quality, os, apiLevel, pixelRatio, hasTarget } = opts;
  if (quality === 'solid' || !hasTarget) {
    return 'solid';
  }
  const canBlur = os === 'ios' || (os === 'android' && Number(apiLevel) >= 31);
  if (!canBlur) {
    return 'solid';
  }
  if (quality === 'high' || quality === 'low') {
    return quality;
  }
  return pixelRatio >= 3 ? 'high' : 'low';
}

type GlassContextValue = {
  quality: GlassQuality;
  setQuality: (quality: GlassQuality) => void;
  targetRef: RefObject<TargetNode | null>;
  hasTarget: boolean;
  attachTarget: (node: TargetNode) => void;
  detachTarget: (node: TargetNode) => void;
};

const noop = () => {};
const GlassContext = createContext<GlassContextValue>({
  quality: 'auto',
  setQuality: noop,
  targetRef: { current: null },
  hasTarget: false,
  attachTarget: noop,
  detachTarget: noop,
});

export function GlassProvider({
  initialQuality = 'auto',
  children,
}: {
  initialQuality?: GlassQuality;
  children: ReactNode;
}) {
  const [quality, setQuality] = useState<GlassQuality>(initialQuality);
  const [hasTarget, setHasTarget] = useState(false);
  const targetRef = useRef<TargetNode | null>(null);

  const attachTarget = useCallback((node: TargetNode) => {
    targetRef.current = node;
    setHasTarget(true);
  }, []);
  // Only clear when the node going away is still the registered one, so a
  // newly focused screen's target is not wiped by the old screen unmounting.
  const detachTarget = useCallback((node: TargetNode) => {
    if (targetRef.current === node) {
      targetRef.current = null;
      setHasTarget(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      quality,
      setQuality,
      targetRef,
      hasTarget,
      attachTarget,
      detachTarget,
    }),
    [quality, hasTarget, attachTarget, detachTarget],
  );
  return (
    <GlassContext.Provider value={value}>{children}</GlassContext.Provider>
  );
}

export function useGlass() {
  return useContext(GlassContext);
}

/** Level that Glass renders at right now, given provider state + device. */
export function useGlassLevel(forced?: GlassQuality): GlassLevel {
  const { quality, hasTarget } = useGlass();
  return resolveGlassLevel({
    quality: forced ?? quality,
    os: Platform.OS,
    apiLevel: Platform.Version,
    pixelRatio: PixelRatio.get(),
    hasTarget,
  });
}

/**
 * Wrap a screen's scrollable content in this. Glass (nav pill, toast...)
 * blurs whatever is inside. `active={false}` keeps a background tab from
 * stealing the registration (pass `useIsFocused()` under tabs). Do not wrap
 * a GLView: Glass over it falls back to solid when nothing is registered.
 */
export function BlurTarget({
  active = true,
  style,
  children,
  ...props
}: ViewProps & { active?: boolean }) {
  const { attachTarget, detachTarget } = useGlass();
  const ref = useCallback(
    (node: TargetNode | null) => {
      if (!active || !node) {
        return undefined;
      }
      attachTarget(node);
      return () => detachTarget(node);
    },
    [active, attachTarget, detachTarget],
  );
  // flex: 1 by default: a screen root that forgets the style collapses to 0 px
  // and renders black (MySchedule / Availability did).
  // The ambient glows live INSIDE the target (opaque black under them) so
  // glass blurs them; identical phase to the screen surface behind it.
  return (
    <BlurTargetView
      ref={ref}
      style={[styles.fill, style, styles.opaque]}
      {...props}
    >
      <AmbientBackground />
      {children}
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  opaque: { backgroundColor: colors.bg },
});
