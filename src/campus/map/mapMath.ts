import {
  DEFAULT_FLOOR_HEIGHT_M,
  pointInPolygon,
  roomBlock,
  roomFloor,
} from '../geo';
import type { Block, XZ } from '../campusData';

/**
 * Pure math for the campus map (no three.js, no React) so it is unit-testable.
 *
 * Campus plane: x east, z north, metres. World (three.js): X = x, Y = up,
 * Z = -z, so north is "up the screen" for a camera looking toward -Z.
 */

export type Vec3 = [number, number, number];
export type Pt = { x: number; y: number };

export function toWorld(x: number, z: number, y = 0): Vec3 {
  return [x, y, -z];
}

export function blockHeight(
  floors: number,
  floorHeightM = DEFAULT_FLOOR_HEIGHT_M,
): number {
  return Math.max(1, floors) * floorHeightM;
}

// ---- outline -> shape -----------------------------------------------------

function dropClosingPoint(outline: readonly XZ[]): XZ[] {
  const n = outline.length;
  if (
    n > 1 &&
    outline[0][0] === outline[n - 1][0] &&
    outline[0][1] === outline[n - 1][1]
  ) {
    return outline.slice(0, -1);
  }
  return outline.slice();
}

/** Shoelace area; positive when the points run counter-clockwise (x right, z up). */
export function signedArea(points: readonly XZ[]): number {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

/**
 * Outline -> open, counter-clockwise ring of shape points (shape y = campus z).
 * Rotating the extruded shape by -90deg about X puts shape y on world -Z, which
 * is exactly toWorld(), so no mirroring happens.
 * Returns [] for fewer than 3 distinct points.
 */
export function outlineToShapePoints(outline: readonly XZ[]): Pt[] {
  let pts = dropClosingPoint(outline);
  if (pts.length < 3) {
    return [];
  }
  if (signedArea(pts) < 0) {
    pts = pts.reverse();
  }
  return pts.map(([x, z]) => ({ x, y: z }));
}

export function polygonCentroid(outline: readonly XZ[]): {
  x: number;
  z: number;
} {
  const pts = dropClosingPoint(outline);
  if (pts.length === 0) {
    return { x: 0, z: 0 };
  }
  const area = signedArea(pts);
  if (Math.abs(area) < 1e-6) {
    const sx = pts.reduce((s, p) => s + p[0], 0);
    const sz = pts.reduce((s, p) => s + p[1], 0);
    return { x: sx / pts.length, z: sz / pts.length };
  }
  let cx = 0;
  let cz = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    const f = x1 * z2 - x2 * z1;
    cx += (x1 + x2) * f;
    cz += (z1 + z2) * f;
  }
  return { x: cx / (6 * area), z: cz / (6 * area) };
}

export type Bounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export function boundsOf(points: readonly XZ[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  return { minX, maxX, minZ, maxZ };
}

// ---- room -> block / floor ------------------------------------------------

/** Both the API CampusRoom and the static campusData Room fit this. */
export type RoomLike = {
  buildingCode?: string | null;
  building?: string | null;
  floor?: number | null;
  code?: string | null;
  name?: string | null;
  xM?: number | null;
  zM?: number | null;
};

export type RoomTarget = {
  blockCode: string | null;
  floor: number | null;
  /** "306.B11" (code, else name). */
  label: string;
  point: { x: number; z: number } | null;
  /** false: point is the block centroid, not the room's own xM/zM. */
  exactPoint: boolean;
};

export function resolveRoomTarget(
  room: RoomLike,
  blocks: readonly Block[],
): RoomTarget {
  const rawBlock =
    room.buildingCode?.trim() ||
    room.building?.trim() ||
    roomBlock(room.code) ||
    null;
  const blockCode = rawBlock ? rawBlock.toUpperCase() : null;
  const block = blocks.find(b => b.code === blockCode) ?? null;
  const floor = room.floor ?? roomFloor(room.code);
  const label = (room.code ?? '').trim() || (room.name ?? '').trim();
  if (typeof room.xM === 'number' && typeof room.zM === 'number') {
    return {
      blockCode,
      floor,
      label,
      point: { x: room.xM, z: room.zM },
      exactPoint: true,
    };
  }
  return {
    blockCode,
    floor,
    label,
    point: block ? polygonCentroid(block.outline) : null,
    exactPoint: false,
  };
}

// ---- markers --------------------------------------------------------------

/** Accuracy ring radius in metres: `acc`, kept drawable. */
export function accuracyRingRadius(acc: number | null | undefined): number {
  if (acc == null || !Number.isFinite(acc)) {
    return 0;
  }
  return Math.min(60, Math.max(1, acc));
}

/** Person dot radius (m) that stays readable: grows with camera distance. */
export function dotRadius(cameraDistance: number): number {
  return Math.min(9, Math.max(2.5, cameraDistance * 0.022));
}

// ---- camera ---------------------------------------------------------------

export const CAMERA_FOV_DEG = 45;
export const CAMERA_PITCH = (55 * Math.PI) / 180; // elevation above the ground
export const MIN_DISTANCE = 60;
export const MAX_DISTANCE = 900;
export const CAMPUS_BOUNDS_MARGIN = 20;

export type CameraState = {
  /** Look-at point on the ground, campus metres. */
  x: number;
  z: number;
  /** Heading in radians, 0 = looking north, clockwise positive. */
  yaw: number;
  /** Camera-to-target distance in metres. */
  distance: number;
};

export function clampCamera(
  s: CameraState,
  bounds: Bounds,
  margin = CAMPUS_BOUNDS_MARGIN,
): CameraState {
  return {
    x: Math.min(bounds.maxX + margin, Math.max(bounds.minX - margin, s.x)),
    z: Math.min(bounds.maxZ + margin, Math.max(bounds.minZ - margin, s.z)),
    yaw: s.yaw,
    distance: Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, s.distance)),
  };
}

/** Metres on the ground per screen pixel at the target, for viewport height. */
export function metresPerPixel(distance: number, viewHeightPx: number): number {
  const fov = (CAMERA_FOV_DEG * Math.PI) / 180;
  return (2 * distance * Math.tan(fov / 2)) / Math.max(1, viewHeightPx);
}

/** One-finger drag: the map follows the finger. */
export function panCamera(
  s: CameraState,
  dxPx: number,
  dyPx: number,
  viewHeightPx: number,
): CameraState {
  const k = metresPerPixel(s.distance, viewHeightPx);
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const rx = Math.cos(s.yaw);
  const rz = -Math.sin(s.yaw);
  // Ground distance covered per vertical pixel is stretched by 1/sin(pitch).
  const forward = (dyPx * k) / Math.sin(CAMERA_PITCH);
  const right = -dxPx * k;
  return {
    ...s,
    x: s.x + fx * forward + rx * right,
    z: s.z + fz * forward + rz * right,
  };
}

/** Pinch: scaleChange > 1 zooms in. */
export function pinchCamera(s: CameraState, scaleChange: number): CameraState {
  if (!Number.isFinite(scaleChange) || scaleChange <= 0) {
    return s;
  }
  return { ...s, distance: s.distance / scaleChange };
}

/** Two-finger twist: the map turns with the fingers (clockwise = positive). */
export function rotateCamera(
  s: CameraState,
  rotationChange: number,
): CameraState {
  return { ...s, yaw: s.yaw - rotationChange };
}

export type CameraPose = { position: Vec3; target: Vec3 };

export function cameraPose(s: CameraState): CameraPose {
  const horizontal = s.distance * Math.cos(CAMERA_PITCH);
  const height = s.distance * Math.sin(CAMERA_PITCH);
  const cx = s.x - Math.sin(s.yaw) * horizontal;
  const cz = s.z - Math.cos(s.yaw) * horizontal;
  return { position: toWorld(cx, cz, height), target: toWorld(s.x, s.z, 0) };
}

// ---- picking --------------------------------------------------------------

export type Ray = { origin: Vec3; dir: Vec3 };

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Screen point (px, origin top-left) -> world ray for the map camera. */
export function screenToRay(
  px: number,
  py: number,
  width: number,
  height: number,
  s: CameraState,
): Ray {
  const { position, target } = cameraPose(s);
  const f = norm(sub(target, position));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const t = Math.tan((CAMERA_FOV_DEG * Math.PI) / 360);
  const ndcX = (px / Math.max(1, width)) * 2 - 1;
  const ndcY = 1 - (py / Math.max(1, height)) * 2;
  const aspect = width / Math.max(1, height);
  const dir = norm([
    f[0] + r[0] * ndcX * t * aspect + u[0] * ndcY * t,
    f[1] + r[1] * ndcX * t * aspect + u[1] * ndcY * t,
    f[2] + r[2] * ndcX * t * aspect + u[2] * ndcY * t,
  ]);
  return { origin: position, dir };
}

const PICK_SAMPLES = 8;

/**
 * First block hit by the ray. Each prism is sampled at PICK_SAMPLES+1 heights
 * (roof .. ground); the nearest sample inside the outline wins, so walls and
 * roofs both count. Returns null for the ground.
 */
export function pickBlock(
  ray: Ray,
  blocks: readonly Block[],
  floorHeightM = DEFAULT_FLOOR_HEIGHT_M,
): Block | null {
  if (ray.dir[1] >= -1e-6) {
    return null;
  }
  let best: Block | null = null;
  let bestT = Infinity;
  for (const block of blocks) {
    const h = blockHeight(block.floors, floorHeightM);
    for (let i = 0; i <= PICK_SAMPLES; i++) {
      const y = h * (1 - i / PICK_SAMPLES);
      const t = (y - ray.origin[1]) / ray.dir[1];
      if (t <= 0 || t >= bestT) {
        continue;
      }
      const wx = ray.origin[0] + ray.dir[0] * t;
      const wz = ray.origin[2] + ray.dir[2] * t;
      if (pointInPolygon({ x: wx, z: -wz }, block.outline)) {
        best = block;
        bestT = t;
        break;
      }
    }
  }
  return best;
}
