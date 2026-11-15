import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the OS "remove animations" setting is on. Live-updating. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      ?.then(v => alive && setReduce(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v =>
      setReduce(!!v),
    );
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}
