import { campus, type Block } from '../src/campus/campusData';
import { createCameraStore } from '../src/campus/map/cameraStore';
import { createGroundGeometry, createPrismGeometry } from '../src/campus/map/geometry';
import {
  CAMERA_PITCH,
  MAX_DISTANCE,
  MIN_DISTANCE,
  accuracyRingRadius,
  blockHeight,
  boundsOf,
  cameraPose,
  clampCamera,
  dotRadius,
  outlineToShapePoints,
  panCamera,
  pickBlock,
  pinchCamera,
  polygonCentroid,
  resolveRoomTarget,
  rotateCamera,
  screenToRay,
  signedArea,
  toWorld,
  type CameraState,
} from '../src/campus/map/mapMath';
import {
  countRooms,
  roomsOnFloor,
} from '../src/campus/map/components/FloorPlan';
import { labelBorderStyle } from '../src/campus/map/components/LocationSourceLabel';

const SQUARE_CW: [number, number][] = [
  [0, 0],
  [0, 10],
  [10, 10],
  [10, 0],
  [0, 0],
];

const bounds = boundsOf(campus.boundary);
const cam = (over: Partial<CameraState> = {}): CameraState => ({
  x: 0,
  z: 0,
  yaw: 0,
  distance: 300,
  ...over,
});

describe('outline -> shape', () => {
  it('drops the closing point and returns a CCW ring', () => {
    const pts = outlineToShapePoints(SQUARE_CW);
    expect(pts).toHaveLength(4);
    expect(pts[0]).not.toEqual(pts[3]);
    expect(signedArea(pts.map(p => [p.x, p.y] as [number, number]))).toBeGreaterThan(0);
  });

  it('keeps an already CCW ring as is', () => {
    const ccw: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(outlineToShapePoints(ccw)[1]).toEqual({ x: 10, y: 0 });
  });

  it('returns [] for degenerate outlines', () => {
    expect(outlineToShapePoints([[0, 0], [1, 1]])).toEqual([]);
  });

  it('every real block outline is usable and CCW', () => {
    for (const b of campus.blocks) {
      const pts = outlineToShapePoints(b.outline);
      expect(pts.length).toBeGreaterThanOrEqual(3);
      expect(signedArea(pts.map(p => [p.x, p.y] as [number, number]))).toBeGreaterThan(0);
    }
  });

  it('builds extruded geometry between the given heights, on world -Z', () => {
    const g = createPrismGeometry(
      [[0, 0], [10, 0], [10, 10], [0, 10]],
      3.6,
      7.2,
    );
    expect(g).not.toBeNull();
    g!.computeBoundingBox();
    const box = g!.boundingBox!;
    expect(box.min.y).toBeCloseTo(3.6);
    expect(box.max.y).toBeCloseTo(7.2);
    // campus z in [0, 10] becomes world Z in [-10, 0]
    expect(box.min.z).toBeCloseTo(-10);
    expect(box.max.z).toBeCloseTo(0);
    expect(createPrismGeometry(SQUARE_CW, 5, 5)).toBeNull();
    expect(createGroundGeometry(campus.boundary)).not.toBeNull();
  });
});

describe('geometry helpers', () => {
  it('centroid of a square and bounds', () => {
    expect(polygonCentroid(SQUARE_CW)).toEqual({ x: 5, z: 5 });
    expect(boundsOf(SQUARE_CW)).toEqual({ minX: 0, maxX: 10, minZ: 0, maxZ: 10 });
  });

  it('block height = floors x floor height', () => {
    expect(blockHeight(4)).toBeCloseTo(14.4);
    expect(blockHeight(0)).toBeCloseTo(3.6);
  });
});

describe('room -> block / floor', () => {
  const b11 = campus.blocks.find(b => b.code === 'B11') as Block;

  it('uses the API room xM/zM when present', () => {
    const t = resolveRoomTarget(
      { buildingCode: 'B11', floor: 3, code: '306.B11', xM: 40, zM: 150 },
      campus.blocks,
    );
    expect(t).toMatchObject({
      blockCode: 'B11',
      floor: 3,
      label: '306.B11',
      exactPoint: true,
      point: { x: 40, z: 150 },
    });
  });

  it('falls back to the block centroid and to the code for block/floor', () => {
    const t = resolveRoomTarget({ code: '306.B11' }, campus.blocks);
    expect(t.blockCode).toBe('B11');
    expect(t.floor).toBe(3);
    expect(t.exactPoint).toBe(false);
    expect(t.point).toEqual(polygonCentroid(b11.outline));
  });

  it('has no point for an unknown block', () => {
    const t = resolveRoomTarget({ buildingCode: 'B99', name: 'Phòng X' }, campus.blocks);
    expect(t.point).toBeNull();
    expect(t.label).toBe('Phòng X');
  });
});

describe('markers', () => {
  it('ring radius follows acc and is clamped', () => {
    expect(accuracyRingRadius(12)).toBe(12);
    expect(accuracyRingRadius(0.2)).toBe(1);
    expect(accuracyRingRadius(500)).toBe(60);
    expect(accuracyRingRadius(null)).toBe(0);
    expect(accuracyRingRadius(NaN)).toBe(0);
  });

  it('dot radius grows with distance within limits', () => {
    expect(dotRadius(10)).toBe(2.5);
    expect(dotRadius(300)).toBeGreaterThan(dotRadius(150));
    expect(dotRadius(5000)).toBe(9);
  });
});

describe('camera math', () => {
  it('clamps target to campus bounds and distance to limits', () => {
    const c = clampCamera(cam({ x: 99999, z: -99999, distance: 5 }), bounds, 0);
    expect(c.x).toBe(bounds.maxX);
    expect(c.z).toBe(bounds.minZ);
    expect(c.distance).toBe(MIN_DISTANCE);
    expect(clampCamera(cam({ distance: 1e6 }), bounds).distance).toBe(MAX_DISTANCE);
  });

  it('pinch in zooms closer, out zooms away, ignores junk', () => {
    expect(pinchCamera(cam(), 2).distance).toBe(150);
    expect(pinchCamera(cam(), 0.5).distance).toBe(600);
    expect(pinchCamera(cam(), 0)).toEqual(cam());
    expect(pinchCamera(cam(), NaN)).toEqual(cam());
  });

  it('drag down moves the target north at yaw 0, drag right moves it west', () => {
    const down = panCamera(cam(), 0, 100, 800);
    expect(down.z).toBeGreaterThan(0);
    expect(down.x).toBeCloseTo(0);
    const right = panCamera(cam(), 100, 0, 800);
    expect(right.x).toBeLessThan(0);
    expect(right.z).toBeCloseTo(0);
  });

  it('pan follows the rotated frame', () => {
    const p = panCamera(cam({ yaw: Math.PI / 2 }), 0, 100, 800);
    expect(p.x).toBeGreaterThan(0);
    expect(p.z).toBeCloseTo(0);
  });

  it('rotation turns the heading', () => {
    expect(rotateCamera(cam(), 0.5).yaw).toBeCloseTo(-0.5);
  });

  it('pose: camera sits south of the target looking north, above ground', () => {
    const { position, target } = cameraPose(cam({ distance: 100 }));
    expect(target).toEqual(toWorld(0, 0, 0));
    expect(position[1]).toBeCloseTo(100 * Math.sin(CAMERA_PITCH));
    // south of target = larger world Z
    expect(position[2]).toBeGreaterThan(0);
    expect(position[0]).toBeCloseTo(0);
  });

  it('store clamps, notifies and unsubscribes', () => {
    const store = createCameraStore(cam(), bounds);
    const fn = jest.fn();
    const off = store.subscribe(fn);
    store.pinch(1e9);
    expect(store.get().distance).toBe(MIN_DISTANCE);
    store.pan(10, 10, 800);
    store.rotate(0.1);
    expect(fn).toHaveBeenCalledTimes(3);
    off();
    store.pinch(1);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('picking', () => {
  const b11 = campus.blocks.find(b => b.code === 'B11') as Block;
  const c = polygonCentroid(b11.outline);

  it('the screen centre ray hits the block the camera looks at', () => {
    const state = cam({ x: c.x, z: c.z, distance: 200 });
    const ray = screenToRay(200, 400, 400, 800, state);
    expect(pickBlock(ray, campus.blocks)?.code).toBe('B11');
  });

  it('the ground far from any block returns null', () => {
    const state = cam({ x: -250, z: -250, distance: 120 });
    const ray = screenToRay(200, 400, 400, 800, state);
    expect(pickBlock(ray, campus.blocks)).toBeNull();
  });

  it('a ray pointing at the sky hits nothing', () => {
    expect(
      pickBlock({ origin: [0, 10, 0], dir: [0, 1, 0] }, campus.blocks),
    ).toBeNull();
  });
});

describe('floor plan helpers', () => {
  it('lists rooms per floor, sorted, and counts per block', () => {
    const rooms = campus.rooms;
    const f3 = roomsOnFloor(rooms, 'B11', 3);
    expect(f3.length).toBeGreaterThan(0);
    expect(f3.every(r => r.building === 'B11' && r.floor === 3)).toBe(true);
    expect(countRooms(rooms, 'B11')).toBe(
      rooms.filter(r => r.building === 'B11').length,
    );
    expect(roomsOnFloor(rooms, 'B99', 1)).toEqual([]);
  });

  it('dashed border for estimated floors, solid for manual / room', () => {
    expect(labelBorderStyle('baro')).toBe('dashed');
    expect(labelBorderStyle(null)).toBe('dashed');
    expect(labelBorderStyle('manual')).toBe('solid');
    expect(labelBorderStyle('room')).toBe('solid');
  });
});
