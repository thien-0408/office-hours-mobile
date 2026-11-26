import osmSeed from '../../docs/campus/eiu-osm-seed.json';
import roomsSeed from '../../docs/campus/eiu-rooms.json';

export type XZPoint = [number, number];

export interface CampusBuilding {
  id: string;
  code: string; // VD: "B3", "B4", "B8", "B11", "Căn tin"
  displayName: string; // VD: "Block 11", "Block 8", "Căn tin"
  shortTag: string; // VD: "B11", "B8", "CT"
  floors: number;
  centerXZ: XZPoint;
  outlineXZ: XZPoint[];
  legend?: string;
}

export interface CampusRoom {
  building: string; // "B3" | "B4" | "B5" | "B6" | "B8" | "B11"
  floor: number;
  code: string; // VD: "306.B11"
  shortCode: string; // VD: "306"
  name: string; // VD: "VP K.ĐD"
  capacity: number | null;
}

// Chuẩn hóa mã tòa nhà về dạng "B3", "B4", ..., "B11"
export function normalizeBuildingCode(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === 'Căn tin') return 'CANTIN';
  const match = trimmed.match(/^(?:Block\s*|B)(\d+)$/i);
  if (match) return `B${match[1]}`;
  return trimmed;
}

// Chuyển tọa độ GPS (lat, lng) sang hệ mét campus (x east, z north) theo đúng công thức eiu-osm-seed.json
export function latLngToCampusXZ(lat: number, lng: number): XZPoint {
  const { lat: lat0, lng: lng0 } = osmSeed.origin;
  const rad = (lat0 * Math.PI) / 180;
  const x = (lng - lng0) * 111320 * Math.cos(rad);
  const z = (lat - lat0) * 110540;
  return [Number(x.toFixed(1)), Number(z.toFixed(1))];
}

// Tạo hình chữ nhật từ centerXZ và approxSizeM cho các block trong planEstimates
function rectFromCenter(
  center: XZPoint,
  sizeM: [number, number] | null,
): XZPoint[] {
  const [w, d] = sizeM ?? [48, 36];
  const hw = w / 2;
  const hd = d / 2;
  const [cx, cz] = center;
  return [
    [cx - hw, cz - hd],
    [cx + hw, cz - hd],
    [cx + hw, cz + hd],
    [cx - hw, cz + hd],
    [cx - hw, cz - hd],
  ];
}

function centroidXZ(pts: XZPoint[]): XZPoint {
  const valid = pts.length > 1 ? pts.slice(0, -1) : pts;
  const sum = valid.reduce((acc, [x, z]) => [acc[0] + x, acc[1] + z], [0, 0]);
  return [sum[0] / valid.length, sum[1] / valid.length];
}

const confirmedFloors: Record<string, number> = osmSeed.floorsConfirmedByTeam;
const legendMap: Record<string, string | null> = osmSeed.handbookLegend.blocks;

// 1. Lấy các tòa có code từ OSM buildings
const osmBuildings: CampusBuilding[] = osmSeed.buildings
  .filter(b => Boolean(b.code))
  .map(b => {
    const norm = normalizeBuildingCode(b.code)!;
    const displayName =
      b.code === 'Căn tin'
        ? 'Căn tin'
        : norm.startsWith('B')
        ? `Block ${norm.slice(1)}`
        : b.code!;
    const floors =
      confirmedFloors[displayName] ?? confirmedFloors[b.code!] ?? b.levels ?? 1;
    const outline = b.outlineXZ as XZPoint[];

    return {
      id: norm,
      code: norm,
      displayName,
      shortTag: norm === 'CANTIN' ? 'Căn tin' : norm,
      floors,
      centerXZ: centroidXZ(outline),
      outlineXZ: outline,
      legend: legendMap[displayName] ?? undefined,
    };
  });

// 2. Lấy các tòa từ planEstimates (Block 8, Block 11, Block 9, Block 10)
const planBuildings: CampusBuilding[] = osmSeed.planEstimates.buildings.map(
  b => {
    const norm = normalizeBuildingCode(b.code)!;
    const center = b.centerXZ as XZPoint;
    const size = (b.approxSizeM as [number, number] | null) ?? [46, 34];
    const floors = confirmedFloors[b.code] ?? b.floors ?? 4;

    return {
      id: norm,
      code: norm,
      displayName: b.code,
      shortTag: norm,
      floors,
      centerXZ: center,
      outlineXZ: rectFromCenter(center, size),
      legend: legendMap[b.code] ?? undefined,
    };
  },
);

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  ...osmBuildings,
  ...planBuildings,
];

export const CAMPUS_BOUNDARY_XZ: XZPoint[] = osmSeed.boundaryXZ as XZPoint[];

export const CAMPUS_WALKWAYS: { id: number; type: string; pts: XZPoint[] }[] =
  osmSeed.walkways.map(w => ({
    id: w.osmId,
    type: w.type,
    pts: w.lineXZ as XZPoint[],
  }));

export const CAMPUS_ROOMS: CampusRoom[] = roomsSeed.rooms.map(r => ({
  building: r.building,
  floor: r.floor,
  code: r.code,
  shortCode: r.code.split('.')[0],
  name: r.name ?? 'Phòng chức năng',
  capacity: r.capacity,
}));

export function getBuildingByCode(code: string): CampusBuilding | undefined {
  const norm = normalizeBuildingCode(code);
  return CAMPUS_BUILDINGS.find(b => b.code === norm);
}

export function getRoomsForBuilding(buildingCode: string): CampusRoom[] {
  const norm = normalizeBuildingCode(buildingCode);
  return CAMPUS_ROOMS.filter(r => r.building === norm);
}

// Chia phòng của 1 tầng thành 2 dãy đối diện nhau qua hành lang
export function splitFloorRoomsIntoRows(
  buildingCode: string,
  floor: number,
): { topRow: CampusRoom[]; bottomRow: CampusRoom[] } {
  const list = getRoomsForBuilding(buildingCode).filter(r => r.floor === floor);
  if (list.length <= 1) {
    return { topRow: list, bottomRow: [] };
  }
  const evenRooms = list.filter(r => {
    const num = parseInt(r.shortCode, 10);
    return !Number.isNaN(num) && num % 2 === 0;
  });
  const oddRooms = list.filter(r => {
    const num = parseInt(r.shortCode, 10);
    return Number.isNaN(num) || num % 2 !== 0;
  });

  if (evenRooms.length > 0 && oddRooms.length > 0) {
    return { topRow: evenRooms, bottomRow: oddRooms };
  }
  const mid = Math.ceil(list.length / 2);
  return { topRow: list.slice(0, mid), bottomRow: list.slice(mid) };
}
