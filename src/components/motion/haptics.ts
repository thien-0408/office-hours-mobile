import * as Haptics from 'expo-haptics';

// Never let a missing vibrator, a denied permission or a test mock break a tap.
function fire(run: () => unknown) {
  try {
    Promise.resolve(run()).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * The app's few haptic moments. Kept rare on purpose: a tick when a choice
 * changes, a light tap on card press, one buzz when something important
 * succeeds or fails.
 */
export const haptic = {
  /** A choice changed: segment, tab, picker row, toggle. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** Finger down on a card. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Booking sent, check-in done. */
  success: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  /** A destructive action confirmed (cancel, decline, delete). */
  warning: () =>
    fire(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
  error: () =>
    fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
