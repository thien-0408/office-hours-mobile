import { useSyncExternalStore } from 'react';

/** Height of the floating now-card (.nowcard in the mock) and its gap above the pill. */
export const NOW_CARD_HEIGHT = 66;
export const NOW_CARD_GAP = 10;
/** Extra bottom padding screens need while the now-card is shown. */
export const NOW_CARD_SPACE = NOW_CARD_HEIGHT + NOW_CARD_GAP;

// Tiny external store: the card reports whether it is on screen, screens read it through
// useFloatingSpace / useTabBarSpace so content never hides behind the card.
let visible = false;
const listeners = new Set<() => void>();

export function setNowCardVisible(next: boolean) {
  if (visible === next) {
    return;
  }
  visible = next;
  listeners.forEach(l => l());
}

export function isNowCardVisible() {
  return visible;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Extra bottom padding for the floating card: NOW_CARD_SPACE while it shows, else 0. */
export function useFloatingSpace(): number {
  const shown = useSyncExternalStore(
    subscribe,
    () => visible,
    () => false,
  );
  return shown ? NOW_CARD_SPACE : 0;
}
