import { createCameraStore } from '../src/campus/map/cameraStore';
import {
  groundPoint,
  isValidCamera,
  projectToScreen,
  scaleOutline,
  zoomCameraAt,
  polygonCentroid,
  boundsOf,
  type CameraState,
} from '../src/campus/map/mapMath';

const W = 400;
const H = 800;
const base: CameraState = { x: 50, z: 80, yaw: 0, distance: 300 };
const square: [number, number][] = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
  [0, 0],
];

describe('camera zoom / projection', () => {
  it('the screen centre looks at the camera target', () => {
    const g = groundPoint(W / 2, H / 2, W, H, base)!;
    expect(g.x).toBeCloseTo(50, 3);
    expect(g.z).toBeCloseTo(80, 3);
  });

  it('zoomAt keeps the ground point under the finger fixed', () => {
    const px = 300;
    const py = 200;
    const before = groundPoint(px, py, W, H, base)!;
    const next = zoomCameraAt(base, 1.8, px, py, W, H);
    const after = groundPoint(px, py, W, H, next)!;
    expect(next.distance).toBeCloseTo(300 / 1.8, 5);
    expect(after.x).toBeCloseTo(before.x, 3);
    expect(after.z).toBeCloseTo(before.z, 3);
  });

  it('zoomAt at the centre does not move the target and clamps distance', () => {
    const next = zoomCameraAt(base, 1000, W / 2, H / 2, W, H);
    expect(next.x).toBeCloseTo(50, 3);
    expect(next.z).toBeCloseTo(80, 3);
    expect(next.distance).toBe(60);
    expect(zoomCameraAt(base, 0, 1, 1, W, H)).toBe(base);
    expect(zoomCameraAt(base, NaN, 1, 1, W, H)).toBe(base);
  });

  it('projectToScreen is the inverse of groundPoint on the ground', () => {
    const p = projectToScreen(60, 90, 0, W, H, base)!;
    const g = groundPoint(p.x, p.y, W, H, base)!;
    expect(g.x).toBeCloseTo(60, 3);
    expect(g.z).toBeCloseTo(90, 3);
  });

  it('projectToScreen puts the target at the centre and a roof above it', () => {
    const c = projectToScreen(50, 80, 0, W, H, base)!;
    expect(c.x).toBeCloseTo(W / 2, 3);
    expect(c.y).toBeCloseTo(H / 2, 3);
    const roof = projectToScreen(50, 80, 20, W, H, base)!;
    expect(roof.y).toBeLessThan(c.y);
  });

  it('projectToScreen returns null behind the camera', () => {
    const near: CameraState = { ...base, distance: 60 };
    expect(projectToScreen(50, -5000, 0, W, H, near)).toBeNull();
  });

  it('the store rejects non-finite gesture input instead of going NaN', () => {
    const store = createCameraStore(base, boundsOf(square));
    store.pan(NaN, 5, H);
    store.pinch(NaN);
    store.rotate(NaN);
    store.zoomAt(NaN, 1, 1, W, H);
    expect(isValidCamera(store.get())).toBe(true);
    expect(store.get().distance).toBe(300);
  });

  it('the store notifies on zoomAt and rotate', () => {
    const store = createCameraStore(base, boundsOf(square));
    const spy = jest.fn();
    const off = store.subscribe(spy);
    store.zoomAt(2, 100, 100, W, H);
    store.rotate(0.3);
    off();
    store.rotate(0.3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(store.get().yaw).toBeCloseTo(-0.6, 5);
  });

  it('scaleOutline scales about the centroid', () => {
    const big = scaleOutline(square, 2);
    const c = polygonCentroid(big);
    expect(c.x).toBeCloseTo(50, 3);
    expect(boundsOf(big).maxX).toBeCloseTo(150, 3);
    expect(boundsOf(big).minZ).toBeCloseTo(-50, 3);
  });
});
