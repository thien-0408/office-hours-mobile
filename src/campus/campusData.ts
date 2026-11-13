export type LatLng = {
  lat: number;
  lng: number;
};

export type XZ = [number, number];

export type Block = {
  code: string;
  name: string;
  floors: number;
  outline: XZ[];
  estimated: boolean;
};

export type Room = {
  building: string;
  floor: number;
  code: string;
  name: string;
  capacity: number | null;
};

export type Campus = {
  origin: LatLng;
  boundary: XZ[];
  blocks: Block[];
  rooms: Room[];
};

// Seed & Rooms imports
// tsconfig extends @react-native/typescript-config which enables resolveJsonModule: true
import seedData from '../../docs/campus/eiu-osm-seed.json';
import roomsData from '../../docs/campus/eiu-rooms.json';

type OsmBuilding = {
  osmId: number;
  code: string | null;
  levels: number | null;
  insideOsmBoundary: boolean;
  centerLatLng: [number, number];
  outlineXZ: [number, number][];
};

type EstimatedBuilding = {
  code: string;
  floors: number;
  inVirtualTour?: boolean;
  centerXZ: [number, number];
  centerLatLng: [number, number];
  approxSizeM: [number, number] | null;
};

function normalizeCodeAndName(rawCode: string): { code: string; name: string } | null {
  const trimmed = rawCode.trim();
  if (/^b\d+$/i.test(trimmed)) {
    const num = trimmed.replace(/^b/i, '');
    return { code: `B${num}`, name: `Block ${num}` };
  }
  if (/^block\s*\d+$/i.test(trimmed)) {
    const num = trimmed.replace(/^block\s*/i, '');
    return { code: `B${num}`, name: `Block ${num}` };
  }
  if (/^căn\s*tin$/i.test(trimmed) || /^canteen$/i.test(trimmed)) {
    return { code: 'CANTEEN', name: 'Căn tin' };
  }
  return null;
}

function resolveFloors(
  name: string,
  rawCode: string,
  code: string,
  levelsOrFloors: number | null | undefined,
  confirmed: Record<string, number>
): number {
  if (confirmed[name] !== undefined) {
    return confirmed[name];
  }
  if (confirmed[rawCode] !== undefined) {
    return confirmed[rawCode];
  }
  if (confirmed[code] !== undefined) {
    return confirmed[code];
  }
  if (levelsOrFloors && levelsOrFloors > 0) {
    return levelsOrFloors;
  }
  return 1;
}

function createEstimatedOutline(
  centerXZ: [number, number],
  approxSizeM: [number, number] | null
): XZ[] {
  // Default footprint for buildings without approxSizeM (Block 9 & Block 10)
  const [cx, cz] = centerXZ;
  const [widthX, depthZ] = approxSizeM ?? [100, 50];
  const hx = widthX / 2;
  const hz = depthZ / 2;
  return [
    [cx - hx, cz - hz],
    [cx + hx, cz - hz],
    [cx + hx, cz + hz],
    [cx - hx, cz + hz],
    [cx - hx, cz - hz],
  ];
}

function buildCampus(): Campus {
  const confirmed = (seedData.floorsConfirmedByTeam || {}) as Record<string, number>;
  const blocks: Block[] = [];

  // 1. Process OSM buildings
  const osmBuildings = (seedData.buildings || []) as OsmBuilding[];
  for (const b of osmBuildings) {
    if (!b.code) {
      // Discard buildings without code (parking structures, electrical cabins, etc.)
      continue;
    }
    const normalized = normalizeCodeAndName(b.code);
    if (!normalized) {
      continue;
    }
    const floors = resolveFloors(normalized.name, b.code, normalized.code, b.levels, confirmed);
    blocks.push({
      code: normalized.code,
      name: normalized.name,
      floors,
      outline: b.outlineXZ as XZ[],
      estimated: false,
    });
  }

  // 2. Process planEstimates buildings (Block 8, 9, 10, 11)
  const estimates = ((seedData.planEstimates?.buildings || []) as unknown) as EstimatedBuilding[];
  for (const est of estimates) {
    const normalized = normalizeCodeAndName(est.code);
    if (!normalized) {
      continue;
    }
    // Check if not already added from OSM
    if (blocks.some(existing => existing.code === normalized.code)) {
      continue;
    }
    const floors = resolveFloors(normalized.name, est.code, normalized.code, est.floors, confirmed);
    const outline = createEstimatedOutline(est.centerXZ, est.approxSizeM);
    blocks.push({
      code: normalized.code,
      name: normalized.name,
      floors,
      outline,
      estimated: true,
    });
  }

  // 3. Process rooms from eiu-rooms.json
  const rooms: Room[] = ((roomsData.rooms || []) as unknown) as Room[];

  return {
    origin: seedData.origin as LatLng,
    boundary: seedData.boundaryXZ as XZ[],
    blocks,
    rooms,
  };
}

export const campus: Campus = buildCampus();
export const campusData: Campus = campus;
export const defaultCampus: Campus = campus;
export const origin: LatLng = campus.origin;
export const boundary: XZ[] = campus.boundary;
export const blocks: Block[] = campus.blocks;
export const rooms: Room[] = campus.rooms;

export default campus;
