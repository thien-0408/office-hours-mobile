import { useCallback, useEffect, useState } from 'react';

/** Seconds left until `endsAt` (epoch ms), never negative. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** Live countdown. `start(seconds)` begins one; `remaining` ticks to 0. */
export function useCountdown(): {
  remaining: number;
  start: (seconds: number) => void;
} {
  const [endsAt, setEndsAt] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (endsAt === 0) {
      return;
    }
    const tick = () => {
      const left = secondsLeft(endsAt, Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
      }
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [endsAt]);

  const start = useCallback((seconds: number) => {
    const s = Math.max(0, Math.ceil(seconds));
    setRemaining(s);
    setEndsAt(Date.now() + s * 1000);
  }, []);

  return { remaining, start };
}
