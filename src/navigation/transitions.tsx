import type { ReactElement, ReactNode } from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { AmbientSurface } from '../components/motion';
import { motion } from '../theme';

/**
 * Shared screen-transition config for every navigator.
 *
 * Every stack screen is wrapped in an AmbientSurface (opaque black + the
 * drifting glows, see withAmbient) so a screen sliding in never shows the
 * previous one through it, and the screen roots themselves are transparent.
 */

/**
 * Stack: iOS-style push. On Android `ios_from_right` also slides the screen
 * underneath back with parallax, so the old page recedes instead of
 * sitting still (closest native match to Mochy's receding container).
 */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'ios_from_right',
  animationDuration: motion.screen,
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  // Transparent: the AmbientSurface from withAmbient paints the background.
  contentStyle: { backgroundColor: 'transparent' },
};

/** Modal-like screens: rise from the bottom while fading in. */
export const modalOptions: NativeStackNavigationOptions = {
  animation: 'fade_from_bottom',
  animationDuration: motion.modal,
};

/** Screens that use modalOptions (names from roleConfig). */
export const MODAL_SCREENS: ReadonlySet<string> = new Set([
  'BookSlot',
  'LocationConsent',
]);

/** Tabs: short crossfade instead of a hard cut. */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  animation: 'fade',
  transitionSpec: {
    animation: 'timing',
    config: { duration: motion.tabFade },
  },
  sceneStyle: { backgroundColor: 'transparent' },
};

/** `screenLayout` for native stacks: ambient surface behind each screen. */
export function withAmbient({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <AmbientSurface>{children}</AmbientSurface>;
}
