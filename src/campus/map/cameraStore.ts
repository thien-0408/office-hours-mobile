import {
  clampCamera,
  panCamera,
  pinchCamera,
  rotateCamera,
  type Bounds,
  type CameraState,
} from './mapMath';

/**
 * Tiny mutable camera holder. Gestures write to it, the r3f rig subscribes and
 * invalidates the demand-mode canvas. Kept outside React state so a drag does
 * not re-render the screen on every touch event.
 */
export type CameraStore = {
  get(): CameraState;
  set(next: CameraState): void;
  pan(dxPx: number, dyPx: number, viewHeightPx: number): void;
  pinch(scaleChange: number): void;
  rotate(rotationChange: number): void;
  subscribe(listener: () => void): () => void;
};

export function createCameraStore(
  initial: CameraState,
  bounds: Bounds,
): CameraStore {
  let state = clampCamera(initial, bounds);
  const listeners = new Set<() => void>();
  const commit = (next: CameraState) => {
    state = clampCamera(next, bounds);
    listeners.forEach(l => l());
  };
  return {
    get: () => state,
    set: commit,
    pan: (dx, dy, h) => commit(panCamera(state, dx, dy, h)),
    pinch: s => commit(pinchCamera(state, s)),
    rotate: r => commit(rotateCamera(state, r)),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
