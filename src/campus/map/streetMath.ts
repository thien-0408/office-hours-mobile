/**
 * Pure Web-Mercator maths for the 2D street map (OpenStreetMap raster tiles).
 * No React, no native modules, so it is unit-testable.
 */

export type LatLngPoint = { lat: number; lng: number };
export type TileRef = { x: number; y: number; z: number };
export type PlacedTile = TileRef & {
  /** Screen position (px) of the tile's top-left corner. */
  left: number;
  top: number;
  /** Rendered edge length in px (256 * 2^(zoom - z)). */
  size: number;
  key: string;
  url: string;
};

export const TILE_SIZE = 256;
export const MIN_STREET_ZOOM = 13;
export const MAX_STREET_ZOOM = 18;
const MAX_LAT = 85.05112878;
const EARTH_RADIUS_M = 6371008.8;
const MERCATOR_RADIUS_M = 6378137;

export const OSM_TILE_URL = (z: number, x: number, y: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
/** Generic, descriptive, no personal data (OSM tile usage policy). */
export const TILE_USER_AGENT = 'OfficeHoursEIU/0.1 (student capstone app)';

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return MIN_STREET_ZOOM;
  }
  return clamp(zoom, MIN_STREET_ZOOM, MAX_STREET_ZOOM);
}

/** Edge of the whole world in px at a (possibly fractional) zoom. */
export function worldSize(zoom: number): number {
  return TILE_SIZE * Math.pow(2, zoom);
}

/** lat/lng -> world pixel (origin top-left of the world) at `zoom`. */
export function latLngToWorldPx(
  p: LatLngPoint,
  zoom: number,
): { x: number; y: number } {
  const size = worldSize(zoom);
  const lat = clamp(p.lat, -MAX_LAT, MAX_LAT);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

export function worldPxToLatLng(
  x: number,
  y: number,
  zoom: number,
): LatLngPoint {
  const size = worldSize(zoom);
  const lng = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

/** lat/lng -> tile indices at integer zoom `z`. */
export function latLngToTile(p: LatLngPoint, z: number): TileRef {
  const { x, y } = latLngToWorldPx(p, z);
  const n = Math.pow(2, z);
  return {
    x: clamp(Math.floor(x / TILE_SIZE), 0, n - 1),
    y: clamp(Math.floor(y / TILE_SIZE), 0, n - 1),
    z,
  };
}

/** Metres on the ground per screen px at a latitude and zoom. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (
    (2 * Math.PI * MERCATOR_RADIUS_M * Math.cos((lat * Math.PI) / 180)) /
    worldSize(zoom)
  );
}

/** Screen px of a lat/lng for a view centred on `center`. */
export function latLngToScreen(
  p: LatLngPoint,
  center: LatLngPoint,
  zoom: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const a = latLngToWorldPx(p, zoom);
  const c = latLngToWorldPx(center, zoom);
  return { x: width / 2 + (a.x - c.x), y: height / 2 + (a.y - c.y) };
}

export function screenToLatLng(
  px: number,
  py: number,
  center: LatLngPoint,
  zoom: number,
  width: number,
  height: number,
): LatLngPoint {
  const c = latLngToWorldPx(center, zoom);
  return worldPxToLatLng(c.x + px - width / 2, c.y + py - height / 2, zoom);
}

/** One-finger drag: the map follows the finger. */
export function panStreet(
  center: LatLngPoint,
  zoom: number,
  dxPx: number,
  dyPx: number,
): LatLngPoint {
  if (!Number.isFinite(dxPx) || !Number.isFinite(dyPx)) {
    return center;
  }
  const c = latLngToWorldPx(center, zoom);
  const next = worldPxToLatLng(c.x - dxPx, c.y - dyPx, zoom);
  return { lat: clamp(next.lat, -MAX_LAT, MAX_LAT), lng: next.lng };
}

/** Change zoom keeping the lat/lng under (px, py) fixed. */
export function zoomStreetAt(
  center: LatLngPoint,
  zoom: number,
  nextZoom: number,
  px: number,
  py: number,
  width: number,
  height: number,
): { center: LatLngPoint; zoom: number } {
  const z2 = clampZoom(nextZoom);
  const under = screenToLatLng(px, py, center, zoom, width, height);
  const u = latLngToWorldPx(under, z2);
  const next = worldPxToLatLng(
    u.x - (px - width / 2),
    u.y - (py - height / 2),
    z2,
  );
  return { center: next, zoom: z2 };
}

/**
 * Tiles that cover the viewport. Tiles are fetched at the integer zoom closest
 * to `zoom` and scaled by 2^(zoom - z), so pinch zoom stays smooth.
 * x wraps around the antimeridian, y is clipped to the world.
 */
export function visibleTiles(
  center: LatLngPoint,
  zoom: number,
  width: number,
  height: number,
  tileUrl: (z: number, x: number, y: number) => string = OSM_TILE_URL,
): PlacedTile[] {
  const zf = clampZoom(zoom);
  const z = Math.round(zf);
  const scale = Math.pow(2, zf - z);
  const size = TILE_SIZE * scale;
  const c = latLngToWorldPx(center, z);
  const n = Math.pow(2, z);
  const x0 = Math.floor((c.x - width / 2 / scale) / TILE_SIZE);
  const x1 = Math.floor((c.x + width / 2 / scale) / TILE_SIZE);
  const y0 = Math.max(0, Math.floor((c.y - height / 2 / scale) / TILE_SIZE));
  const y1 = Math.min(
    n - 1,
    Math.floor((c.y + height / 2 / scale) / TILE_SIZE),
  );
  const out: PlacedTile[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const wrapped = ((tx % n) + n) % n;
      out.push({
        x: wrapped,
        y: ty,
        z,
        left: width / 2 + (tx * TILE_SIZE - c.x) * scale,
        top: height / 2 + (ty * TILE_SIZE - c.y) * scale,
        size,
        key: `${z}/${tx}/${ty}`,
        url: tileUrl(z, wrapped, ty),
      });
    }
  }
  return out;
}

// ---- distance and direction ----------------------------------------------

const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(a: LatLngPoint, b: LatLngPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b in degrees, 0 = north, clockwise, [0, 360). */
export function bearingDeg(a: LatLngPoint, b: LatLngPoint): number {
  const dLng = rad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS = [
  'Bắc',
  'Đông Bắc',
  'Đông',
  'Đông Nam',
  'Nam',
  'Tây Nam',
  'Tây',
  'Tây Bắc',
] as const;

export function compassVi(bearing: number): string {
  const idx = Math.round((((bearing % 360) + 360) % 360) / 45) % 8;
  return COMPASS[idx];
}

/** "850 m", "3,2 km", "12 km" (Vietnamese decimal comma). */
export function formatDistanceVi(m: number): string {
  if (!Number.isFinite(m) || m < 0) {
    return '';
  }
  if (m < 1000) {
    return `${Math.round(m / 10) * 10 || Math.round(m)} m`;
  }
  const km = m / 1000;
  const text = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${text.replace('.', ',')} km`;
}

/** "Bạn đang cách campus 3,2 km, campus ở hướng Đông Bắc". */
export function offCampusText(me: LatLngPoint, campus: LatLngPoint): string {
  const d = haversineM(me, campus);
  const dir = compassVi(bearingDeg(me, campus));
  return `Bạn đang cách campus ${formatDistanceVi(d)}, campus ở hướng ${dir}`;
}

export function directionsUrl(dest: LatLngPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;
}

export function geoUrl(dest: LatLngPoint, label = 'EIU'): string {
  return `geo:${dest.lat},${dest.lng}?q=${dest.lat},${
    dest.lng
  }(${encodeURIComponent(label)})`;
}

/**
 * Centre and (integer) zoom that show both points inside the viewport with
 * `padPx` of room on every side. Zoom stays within 13..18.
 */
export function fitTwoPoints(
  a: LatLngPoint,
  b: LatLngPoint,
  width: number,
  height: number,
  padPx = 90,
): { center: LatLngPoint; zoom: number } {
  const wa = latLngToWorldPx(a, MAX_STREET_ZOOM);
  const wb = latLngToWorldPx(b, MAX_STREET_ZOOM);
  const center = worldPxToLatLng(
    (wa.x + wb.x) / 2,
    (wa.y + wb.y) / 2,
    MAX_STREET_ZOOM,
  );
  const availW = Math.max(1, width - 2 * padPx);
  const availH = Math.max(1, height - 2 * padPx);
  for (let z = MAX_STREET_ZOOM; z >= MIN_STREET_ZOOM; z--) {
    const k = Math.pow(2, MAX_STREET_ZOOM - z);
    if (
      Math.abs(wa.x - wb.x) / k <= availW &&
      Math.abs(wa.y - wb.y) / k <= availH
    ) {
      return { center, zoom: z };
    }
  }
  return { center, zoom: MIN_STREET_ZOOM };
}
