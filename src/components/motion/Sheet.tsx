import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  Extrapolation,
  makeMutable,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, motion, radius, space, springs } from '../../theme';
import { useReduceMotion } from './reduceMotion';

/**
 * 0..1: how far the front-most sheet is open. The app root (SheetRecede)
 * zooms out and rounds its corners by it, so every sheet gets Mochy's
 * "app sinks back behind the popup" for free.
 */
export const sheetPresence = makeMutable(0);
// Only the first sheet of a stack drives the recede; a picker opened from
// inside a sheet leaves the app where it is.
let openSheets = 0;

// Pulling up past the open position moves this fraction of the finger.
const OVERDRAG = 0.18;

export type SheetProps = {
  visible: boolean;
  /** Asked to close: backdrop tap, back button, drag down or fling. */
  onClose: () => void;
  /** False while busy: no backdrop/back/drag close. Default true. */
  dismissable?: boolean;
  /** Draggable header text. Use `header` for a custom header. */
  title?: string;
  /** Custom draggable header, below the grabber. */
  header?: ReactNode;
  /** Accessibility label of the backdrop. */
  backdropLabel?: string;
  /** Default '90%' of the window. */
  maxHeight?: DimensionValue;
  /** Extra container style (padding, gap). */
  style?: StyleProp<ViewStyle>;
  /** Runs after the exit animation finished and the sheet unmounted. */
  onClosed?: () => void;
  children?: ReactNode;
  testID?: string;
};

/**
 * The app's bottom sheet. Physics only, one no-bounce spring for every move
 * (Mochy's PopupSheet): it rises on open, follows the finger on its
 * grabber/header, closes past 35% or on a fast fling (handing the finger's
 * velocity to the spring), and springs back otherwise. The backdrop dims
 * with it and the app behind recedes.
 */
export function Sheet({
  visible,
  onClose,
  dismissable = true,
  title,
  header,
  backdropLabel = 'Đóng',
  maxHeight = '90%',
  style,
  onClosed,
  children,
  testID,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);

  // offset: px below the open position. height: measured sheet height.
  const offset = useSharedValue(windowH);
  const height = useSharedValue(0);
  const velocity = useSharedValue(0);
  const opened = useRef(false);
  const releaseVelocity = useRef(0);
  const owner = useSharedValue(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  const springTo = useCallback(
    (target: number, v: number, done?: () => void) => {
      'worklet';
      const cb = (finished?: boolean) => {
        'worklet';
        if (finished && done) {
          scheduleOnRN(done);
        }
      };
      offset.value = reduce
        ? withTiming(target, { duration: 0 }, cb)
        : withSpring(target, { ...springs.sheet, velocity: v }, cb);
    },
    [offset, reduce],
  );

  const finishClose = useCallback(() => {
    opened.current = false;
    setMounted(false);
    onClosedRef.current?.();
  }, []);

  // Open / close on `visible`.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (opened.current && height.value > 0) {
        // Re-opened mid-exit: go back up from where it is.
        springTo(0, 0);
      }
      return;
    }
    if (!opened.current) {
      setMounted(false);
      return;
    }
    const v = releaseVelocity.current;
    releaseVelocity.current = 0;
    springTo(Math.max(height.value, 1), v, finishClose);
  }, [visible, springTo, finishClose, height]);

  // Recede ownership for this open period.
  useEffect(() => {
    if (!mounted) {
      return;
    }
    owner.value = openSheets === 0;
    openSheets += 1;
    return () => {
      openSheets = Math.max(0, openSheets - 1);
      if (owner.value) {
        sheetPresence.value = withTiming(0, { duration: 120 });
      }
      owner.value = false;
    };
  }, [mounted, owner]);

  useAnimatedReaction(
    () =>
      height.value > 0
        ? Math.min(1, Math.max(0, 1 - offset.value / height.value))
        : 0,
    p => {
      if (owner.value) {
        sheetPresence.value = p;
      }
    },
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    height.value = h;
    if (!opened.current && visible) {
      opened.current = true;
      cancelAnimation(offset);
      offset.value = h;
      springTo(0, 0);
    }
  };

  const requestClose = useCallback((v: number) => {
    releaseVelocity.current = v;
    onCloseRef.current();
  }, []);

  const pan = usePanGesture({
    enabled: dismissable,
    activeOffsetY: [-8, 8],
    onBegin: () => {
      'worklet';
      cancelAnimation(offset);
      velocity.value = 0;
    },
    onUpdate: e => {
      'worklet';
      const dy = e.translationY;
      offset.value = dy >= 0 ? dy : dy * OVERDRAG;
      velocity.value = e.velocityY;
    },
    onDeactivate: () => {
      'worklet';
      const h = Math.max(height.value, 1);
      const v = velocity.value;
      const close =
        v > motion.sheetFlingClose ||
        (v > -motion.sheetFlingClose && offset.value > h * motion.sheetDragClose);
      if (close) {
        scheduleOnRN(requestClose, v);
      } else {
        springTo(0, v);
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      height.value > 0
        ? interpolate(
            offset.value,
            [0, height.value],
            [1, 0],
            Extrapolation.CLAMP,
          )
        : 0,
  }));

  const close = () => {
    if (dismissable) {
      onClose();
    }
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={styles.fill}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable
              style={styles.fill}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={backdropLabel}
            />
          </Animated.View>
          <Animated.View
            onLayout={onLayout}
            testID={testID}
            style={[
              styles.sheet,
              {
                maxHeight,
                paddingBottom: Math.max(insets.bottom, 16) + space.md,
              },
              style,
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View style={styles.dragZone}>
                <View style={styles.grabber} />
                {header ??
                  (title ? (
                    <Text style={styles.title} accessibilityRole="header">
                      {title}
                    </Text>
                  ) : null)}
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/**
 * For sheets that show one item (`visible={!!item}`, closed by clearing it):
 * returns the last non-null item, so the sheet keeps its content while it
 * slides away instead of going blank mid-animation.
 */
export function useSheetItem<T>(item: T | null | undefined): T | null {
  const last = useRef<T | null>(item ?? null);
  if (item != null) {
    last.current = item;
  }
  return last.current;
}

/**
 * Wrap the app once (inside GestureHandlerRootView): zooms it out and
 * rounds its corners while a sheet is open.
 */
export function SheetRecede({ children }: { children?: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const p = sheetPresence.value;
    return {
      borderRadius: 28 * p,
      transform: [{ scale: 1 - motion.sheetRecede * p }],
    };
  });
  return <Animated.View style={[styles.recede, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.s1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line2,
    paddingHorizontal: space.gutter,
  },
  dragZone: { paddingTop: space.sm, paddingBottom: space.md, gap: space.md },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.fg4,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  recede: { flex: 1, overflow: 'hidden', backgroundColor: colors.bg },
});
