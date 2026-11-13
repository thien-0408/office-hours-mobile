import {
  campus as defaultCampus,
  type LatLng,
  type Block,
  type XZ,
} from './campusData';

/**
 * Floor height in meters, pending physical survey in MO-07.
 */
export const DEFAULT_FLOOR_HEIGHT_M = 3.6;

export type PointXZ = XZ | { x: number; z: number };

/** A point on the campus plane, metres from the origin (x east, z north). */
export type CampusPoint = { x: number; z: number };

export type LocationReading = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export type LocationFix = {
  x: number;
  z: number;
  acc: number;
  block: string | null;
};

export type FilterState = {
  lastFix: { x: number; z: number; acc: number; timestamp: number } | null;
  confirmedBlock: string | null;
  candidateBlock: string | null;
  candidateCount: number;
};

export type LocationFilterOptions = {
  maxAccuracyM?: number;
  alpha?: number;
  origin?: LatLng;
  blocks?: Block[];
  marginM?: number;
};

export type PublishPoint = {
  x: number;
  z: number;
  block?: string | null;
  timestamp: number;
};

export type FloorSource = 'baro' | 'manual' | null;

export type FloorEstimate = {
  floor: number | null;
  source: FloorSource;
};

function getCoords(p: PointXZ): [number, number] {
  if (Array.isArray(p)) {
    return [p[0], p[1]];
  }
  return [p.x, p.z];
}

/**
 * Converts GPS (lat, lng) to local campus coordinates (x, z) in meters relative to origin.
 * Formula from seed projection:
 * x = (lng - lng0) * 111320 * cos(lat0)
 * z = (lat - lat0) * 110540
 */
export function toXZ(
  lat: number,
  lng: number,
  origin: LatLng = defaultCampus.origin,
): CampusPoint {
  const lat0Rad = (origin.lat * Math.PI) / 180;
  const x = (lng - origin.lng) * 111320 * Math.cos(lat0Rad);
  const z = (lat - origin.lat) * 110540;
  return { x, z };
}

/**
 * Converts local campus coordinates (x, z) in meters back to GPS (lat, lng).
 */
export function toLatLng(
  xOrPoint: number | PointXZ,
  zOrOrigin?: number | LatLng,
  maybeOrigin?: LatLng,
): LatLng {
  let x: number;
  let z: number;
  let origin: LatLng;

  if (typeof xOrPoint === 'number') {
    x = xOrPoint;
    z = typeof zOrOrigin === 'number' ? zOrOrigin : 0;
    origin = maybeOrigin ?? defaultCampus.origin;
  } else {
    const coords = getCoords(xOrPoint);
    x = coords[0];
    z = coords[1];
    origin =
      typeof zOrOrigin === 'object' && zOrOrigin !== null
        ? (zOrOrigin as LatLng)
        : defaultCampus.origin;
  }

  const lat0Rad = (origin.lat * Math.PI) / 180;
  const lat = origin.lat + z / 110540;
  const lng = origin.lng + x / (111320 * Math.cos(lat0Rad));
  return { lat, lng };
}

/**
 * Distance in meters between two points on the XZ plane.
 */
export function distanceM(a: PointXZ, b: PointXZ): number {
  const [ax, az] = getCoords(a);
  const [bx, bz] = getCoords(b);
  return Math.hypot(ax - bx, az - bz);
}

function getEdges(
  polygon: (XZ | { x: number; z: number })[],
): Array<[[number, number], [number, number]]> {
  const pts: [number, number][] = polygon.map(p =>
    Array.isArray(p) ? [p[0], p[1]] : [p.x, p.z],
  );
  if (pts.length < 3) {
    return [];
  }
  const cleanPts =
    pts.length > 1 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
      ? pts.slice(0, -1)
      : pts;

  const edges: Array<[[number, number], [number, number]]> = [];
  const n = cleanPts.length;
  for (let i = 0; i < n; i++) {
    edges.push([cleanPts[i], cleanPts[(i + 1) % n]]);
  }
  return edges;
}

/**
 * Ray casting algorithm to check if a point lies inside a 2D polygon.
 */
export function pointInPolygon(
  p: PointXZ,
  polygon: (XZ | { x: number; z: number })[],
): boolean {
  const [px, pz] = getCoords(p);
  const pts: [number, number][] = polygon.map(pt =>
    Array.isArray(pt) ? [pt[0], pt[1]] : [pt.x, pt.z],
  );
  if (pts.length < 3) {
    return false;
  }
  const cleanPts =
    pts.length > 1 &&
    pts[0][0] === pts[pts.length - 1][0] &&
    pts[0][1] === pts[pts.length - 1][1]
      ? pts.slice(0, -1)
      : pts;

  let inside = false;
  const n = cleanPts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, zi] = cleanPts[i];
    const [xj, zj] = cleanPts[j];
    const intersect =
      zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) {
    return Math.hypot(px - x1, pz - z1);
  }
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.hypot(px - projX, pz - projZ);
}

/**
 * Minimum distance in meters from point p to polygon boundary.
 * Returns 0 if p is inside polygon.
 */
export function distanceToPolygonM(
  p: PointXZ,
  polygon: (XZ | { x: number; z: number })[],
): number {
  if (pointInPolygon(p, polygon)) {
    return 0;
  }
  const [px, pz] = getCoords(p);
  const edges = getEdges(polygon);
  if (edges.length === 0) {
    return Infinity;
  }
  let minDist = Infinity;
  for (const [[x1, z1], [x2, z2]] of edges) {
    const d = distanceToSegment(px, pz, x1, z1, x2, z2);
    if (d < minDist) {
      minDist = d;
    }
  }
  return minDist;
}

/**
 * Checks if a point lies within the campus boundary polygon.
 */
export function isOnCampus(
  p: PointXZ | LatLng,
  boundary: (XZ | { x: number; z: number })[] = defaultCampus.boundary,
): boolean {
  if ('lat' in p && 'lng' in p) {
    const xz = toXZ(p.lat, p.lng);
    return pointInPolygon(xz, boundary);
  }
  return pointInPolygon(p as PointXZ, boundary);
}

/**
 * Returns the block containing point p, allowing a tolerance of marginM meters outside the outline.
 */
export function findBlock(
  p: PointXZ,
  blocks: Block[] = defaultCampus.blocks,
  marginM = 3,
): Block | null {
  for (const block of blocks) {
    if (pointInPolygon(p, block.outline)) {
      return block;
    }
  }

  if (marginM > 0) {
    let closestBlock: Block | null = null;
    let minDistance = marginM;
    for (const block of blocks) {
      const dist = distanceToPolygonM(p, block.outline);
      if (dist <= minDistance) {
        minDistance = dist;
        closestBlock = block;
      }
    }
    return closestBlock;
  }

  return null;
}

/**
 * Stateful pure location filter:
 * - Discards readings with accuracy > maxAccuracyM (default 25m)
 * - Discards unrealistic speed jumps (> 15 m/s)
 * - Smooths coordinates with exponential moving average (EMA)
 * - Confirmed block only updates after 2 consecutive valid readings agree on a new block (hysteresis)
 */
export function createLocationFilter(options?: LocationFilterOptions) {
  const maxAccuracyM = options?.maxAccuracyM ?? 25;
  const alpha = options?.alpha ?? 0.35;
  const origin = options?.origin ?? defaultCampus.origin;
  const blocks = options?.blocks ?? defaultCampus.blocks;
  const marginM = options?.marginM ?? 3;

  const initialState: FilterState = {
    lastFix: null,
    confirmedBlock: null,
    candidateBlock: null,
    candidateCount: 0,
  };

  function step(
    state: FilterState,
    reading: LocationReading,
  ): { state: FilterState; fix: LocationFix | null } {
    if (
      reading.accuracy > maxAccuracyM ||
      Number.isNaN(reading.accuracy) ||
      reading.accuracy < 0
    ) {
      return { state, fix: null };
    }

    const rawXZ = toXZ(reading.lat, reading.lng, origin);

    if (state.lastFix !== null) {
      const dt = (reading.timestamp - state.lastFix.timestamp) / 1000;
      if (dt > 0) {
        const rawDist = distanceM(state.lastFix, rawXZ);
        const speed = rawDist / dt;
        if (speed > 15) {
          // Reject jump > 15 m/s
          return { state, fix: null };
        }
      }
    }

    let smoothedX: number;
    let smoothedZ: number;

    if (state.lastFix === null) {
      smoothedX = rawXZ.x;
      smoothedZ = rawXZ.z;
    } else {
      // EMA smoothing; alpha can slightly increase when accuracy is excellent
      const accuracyBoost = Math.max(
        0,
        (maxAccuracyM - reading.accuracy) / maxAccuracyM,
      );
      const effectiveAlpha = Math.min(0.7, alpha * (1 + 0.5 * accuracyBoost));
      smoothedX =
        effectiveAlpha * rawXZ.x + (1 - effectiveAlpha) * state.lastFix.x;
      smoothedZ =
        effectiveAlpha * rawXZ.z + (1 - effectiveAlpha) * state.lastFix.z;
    }

    // Detect block on smoothed coordinates
    const detectedBlock = findBlock(
      { x: smoothedX, z: smoothedZ },
      blocks,
      marginM,
    );
    const rawBlock = detectedBlock ? detectedBlock.code : null;

    let confirmedBlock = state.confirmedBlock;
    let candidateBlock = state.candidateBlock;
    let candidateCount = state.candidateCount;

    if (rawBlock === confirmedBlock) {
      candidateBlock = rawBlock;
      candidateCount = 0;
    } else {
      if (rawBlock === candidateBlock) {
        candidateCount += 1;
        if (candidateCount >= 2) {
          confirmedBlock = rawBlock;
          candidateCount = 0;
        }
      } else {
        candidateBlock = rawBlock;
        candidateCount = 1;
      }
    }

    const fix: LocationFix = {
      x: smoothedX,
      z: smoothedZ,
      acc: reading.accuracy,
      block: confirmedBlock,
    };

    const nextState: FilterState = {
      lastFix: {
        x: smoothedX,
        z: smoothedZ,
        acc: reading.accuracy,
        timestamp: reading.timestamp,
      },
      confirmedBlock,
      candidateBlock,
      candidateCount,
    };

    return { state: nextState, fix };
  }

  const filterFn = (state: FilterState, reading: LocationReading) =>
    step(state, reading);
  filterFn.step = step;
  filterFn.getInitialState = () => ({ ...initialState });
  filterFn.initialState = initialState;

  return filterFn;
}

/**
 * Decides whether a new location reading should be published to Firebase Realtime Database.
 * True when:
 * 1. No previous published fix (last is null/undefined)
 * 2. Time elapsed >= 5000 ms
 * 3. Distance traveled >= 5 m
 * 4. Confirmed block has changed
 */
export function shouldPublish(
  last: PublishPoint | null | undefined,
  next: PublishPoint,
  nowMs?: number,
): boolean {
  if (!last) {
    return true;
  }
  if (last.block !== next.block) {
    return true;
  }
  const currentMs = nowMs !== undefined ? nowMs : next.timestamp;
  if (currentMs - last.timestamp >= 5000) {
    return true;
  }
  if (distanceM(last, next) >= 5) {
    return true;
  }
  return false;
}

/**
 * Barometer-based floor estimator:
 * - onEnterBlock(pressureHpa, floors): records p0 as floor 1 baseline
 * - onPressure(pressureHpa, nowMs): relative height h = (p0 - p) * 8.3 m
 *   Floor = 1 + round(h / floorHeightM) clamped to [1, floors]
 *   Floor only changes when height diff > 60% floor height for at least 3000 ms continuously
 * - setManual(floor): manual choice overrides barometer until exiting block
 * - onExitBlock(): clears baseline and resets manual override
 */
export function createFloorEstimator(options?: { floorHeightM?: number }) {
  const floorHeightM = options?.floorHeightM ?? DEFAULT_FLOOR_HEIGHT_M;
  let p0: number | null = null;
  let maxFloors = 1;
  let currentFloor: number | null = null;
  let manualFloor: number | null = null;
  let pendingFloor: number | null = null;
  let pendingSinceMs: number | null = null;

  function onEnterBlock(pressureHpa: number, floors: number): FloorEstimate {
    p0 = pressureHpa;
    maxFloors = Math.max(1, floors);
    currentFloor = 1;
    manualFloor = null;
    pendingFloor = null;
    pendingSinceMs = null;
    return { floor: 1, source: 'baro' };
  }

  function setManual(floor: number): FloorEstimate {
    manualFloor = Math.max(1, Math.min(maxFloors, floor));
    return { floor: manualFloor, source: 'manual' };
  }

  function onPressure(pressureHpa: number, nowMs: number): FloorEstimate {
    if (manualFloor !== null) {
      return { floor: manualFloor, source: 'manual' };
    }
    if (p0 === null || currentFloor === null) {
      return { floor: null, source: null };
    }

    // Relative height h = (p0 - p) * 8.3 m
    const h = (p0 - pressureHpa) * 8.3;
    const rawFloor = 1 + Math.round(h / floorHeightM);
    const targetFloor = Math.max(1, Math.min(maxFloors, rawFloor));

    const currentFloorHeight = (currentFloor - 1) * floorHeightM;
    const heightDiff = Math.abs(h - currentFloorHeight);

    // Only change floor if diff > 60% floor height continuously for >= 3000 ms
    if (heightDiff > 0.6 * floorHeightM && targetFloor !== currentFloor) {
      if (pendingFloor === targetFloor) {
        if (pendingSinceMs !== null && nowMs - pendingSinceMs >= 3000) {
          currentFloor = targetFloor;
          pendingFloor = null;
          pendingSinceMs = null;
        }
      } else {
        pendingFloor = targetFloor;
        pendingSinceMs = nowMs;
      }
    } else {
      pendingFloor = null;
      pendingSinceMs = null;
    }

    return { floor: currentFloor, source: 'baro' };
  }

  function onExitBlock(): FloorEstimate {
    p0 = null;
    currentFloor = null;
    manualFloor = null;
    pendingFloor = null;
    pendingSinceMs = null;
    return { floor: null, source: null };
  }

  function getState(): FloorEstimate {
    if (manualFloor !== null) {
      return { floor: manualFloor, source: 'manual' };
    }
    if (currentFloor !== null) {
      return { floor: currentFloor, source: 'baro' };
    }
    return { floor: null, source: null };
  }

  return {
    onEnterBlock,
    onPressure,
    onExitBlock,
    setManual,
    getState,
    get floor() {
      return getState().floor;
    },
    get source() {
      return getState().source;
    },
  };
}

/**
 * Extracts floor number from room code ("306.B11" -> 3).
 * Returns null if room code cannot be parsed.
 */
export function roomFloor(code: string | null | undefined): number | null {
  if (!code) {
    return null;
  }
  const trimmed = code.trim();
  const match = trimmed.match(/^(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const dotMatch = trimmed.match(/\.(\d)/);
  if (dotMatch) {
    return parseInt(dotMatch[1], 10);
  }
  return null;
}

/**
 * Extracts building block code from room code ("306.B11" -> "B11").
 * Returns null if room code does not contain a recognizable block.
 */
export function roomBlock(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  const trimmed = code.trim();
  const parts = trimmed.split('.');
  for (const part of parts) {
    const p = part.trim().toUpperCase();
    if (/^B\d+$/i.test(p) || p === 'CANTEEN') {
      return p;
    }
  }
  const match = trimmed.match(/B\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Formats floor and source for UI:
 * - "tầng 2 (ước lượng)"
 * - "tầng 2 (tự chọn)"
 * - "tầng 2" (source 'room')
 * - "Tầng ?"
 */
export function floorLabel(
  floor: number | null | undefined,
  source?: FloorSource | string,
): string {
  if (floor == null) {
    return 'Tầng ?';
  }
  if (source === 'manual') {
    return `tầng ${floor} (tự chọn)`;
  }
  if (source === 'baro') {
    return `tầng ${floor} (ước lượng)`;
  }
  if (source === 'room') {
    // Floor known from a real room (peer inside the destination room): solid, no qualifier.
    return `tầng ${floor}`;
  }
  return 'Tầng ?';
}

/**
 * Formats full location string following STYLE-MOCHY §8.10:
 * - "tại phòng 306.B11" (when room is present)
 * - "B11 · tầng 2 (ước lượng)"
 * - "B11 · tầng 2 (tự chọn)"
 * - "B11" (when floor is not available)
 */
export function locationLabel(
  block: string | null | undefined,
  floor?: number | null,
  source?: FloorSource | string,
  room?: string | null,
): string {
  if (room && room.trim()) {
    const trimmed = room.trim();
    if (trimmed.startsWith('tại phòng ')) {
      return trimmed;
    }
    if (trimmed.startsWith('phòng ')) {
      return `tại ${trimmed}`;
    }
    return `tại phòng ${trimmed}`;
  }
  if (!block) {
    return 'Ngoài campus';
  }
  if (floor != null && source) {
    const fLabel = floorLabel(floor, source);
    if (fLabel !== 'Tầng ?') {
      return `${block} · ${fLabel}`;
    }
  }
  return block;
}
