import {
  OSM_TILE_URL,
  bearingDeg,
  clampZoom,
  compassVi,
  directionsUrl,
  fitTwoPoints,
  formatDistanceVi,
  geoUrl,
  haversineM,
  latLngToScreen,
  latLngToTile,
  latLngToWorldPx,
  metersPerPixel,
  offCampusText,
  panStreet,
  screenToLatLng,
  visibleTiles,
  worldPxToLatLng,
  zoomStreetAt,
} from '../src/campus/map/streetMath';

const EIU = { lat: 11.0535, lng: 106.6667 };
const FAR = { lat: 11.08, lng: 106.69 };

describe('streetMath (Web Mercator)', () => {
  it('matches known OSM tiles', () => {
    expect(latLngToTile({ lat: 0, lng: 0 }, 1)).toEqual({ x: 1, y: 1, z: 1 });
    expect(latLngToTile({ lat: 51.5, lng: -0.12 }, 10)).toEqual({
      x: 511,
      y: 340,
      z: 10,
    });
    expect(OSM_TILE_URL(10, 511, 340)).toBe(
      'https://tile.openstreetmap.org/10/511/340.png',
    );
  });

  it('round-trips lat/lng through world pixels', () => {
    const px = latLngToWorldPx(EIU, 17);
    const back = worldPxToLatLng(px.x, px.y, 17);
    expect(back.lat).toBeCloseTo(EIU.lat, 7);
    expect(back.lng).toBeCloseTo(EIU.lng, 7);
  });

  it('screen <-> lat/lng round-trips and the centre is the centre', () => {
    const c = latLngToScreen(EIU, EIU, 16, 400, 800);
    expect(c).toEqual({ x: 200, y: 400 });
    const p = screenToLatLng(300, 100, EIU, 16, 400, 800);
    const s = latLngToScreen(p, EIU, 16, 400, 800);
    expect(s.x).toBeCloseTo(300, 4);
    expect(s.y).toBeCloseTo(100, 4);
  });

  it('metres per pixel halves with every zoom level', () => {
    expect(metersPerPixel(11, 15) / metersPerPixel(11, 16)).toBeCloseTo(2, 6);
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.03, 1);
  });

  it('clamps zoom to 13..18', () => {
    expect(clampZoom(3)).toBe(13);
    expect(clampZoom(99)).toBe(18);
    expect(clampZoom(15.5)).toBe(15.5);
    expect(clampZoom(NaN)).toBe(13);
  });

  it('pan moves the map with the finger', () => {
    expect(panStreet(EIU, 16, 100, 0).lng).toBeLessThan(EIU.lng);
    expect(panStreet(EIU, 16, NaN, 0)).toBe(EIU);
    expect(panStreet(EIU, 16, 0, 100).lat).toBeGreaterThan(EIU.lat);
  });

  it('zoomStreetAt keeps the point under the finger fixed', () => {
    const before = screenToLatLng(320, 150, EIU, 15, 400, 800);
    const next = zoomStreetAt(EIU, 15, 16.5, 320, 150, 400, 800);
    const after = screenToLatLng(320, 150, next.center, next.zoom, 400, 800);
    expect(next.zoom).toBe(16.5);
    expect(after.lat).toBeCloseTo(before.lat, 6);
    expect(after.lng).toBeCloseTo(before.lng, 6);
    expect(zoomStreetAt(EIU, 15, 40, 0, 0, 400, 800).zoom).toBe(18);
  });

  it('visibleTiles covers the viewport with valid, unique tiles', () => {
    const tiles = visibleTiles(EIU, 16, 400, 800);
    expect(tiles.length).toBeGreaterThan(4);
    expect(new Set(tiles.map(t => t.key)).size).toBe(tiles.length);
    const n = 2 ** 16;
    for (const t of tiles) {
      expect(t.z).toBe(16);
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThan(n);
      expect(t.url).toBe(`https://tile.openstreetmap.org/16/${t.x}/${t.y}.png`);
    }
    expect(Math.min(...tiles.map(t => t.left))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map(t => t.left + t.size))).toBeGreaterThanOrEqual(
      400,
    );
    expect(Math.min(...tiles.map(t => t.top))).toBeLessThanOrEqual(0);
    expect(Math.max(...tiles.map(t => t.top + t.size))).toBeGreaterThanOrEqual(
      800,
    );
  });

  it('visibleTiles scales tiles for fractional zoom', () => {
    const tiles = visibleTiles(EIU, 16.5, 400, 800);
    expect(tiles[0].z).toBe(17);
    expect(tiles[0].size).toBeCloseTo(256 * 2 ** -0.5, 5);
  });

  it('visibleTiles wraps x around the antimeridian', () => {
    const tiles = visibleTiles({ lat: 0, lng: 179.999 }, 13, 800, 400);
    const n = 2 ** 13;
    expect(tiles.every(t => t.x >= 0 && t.x < n)).toBe(true);
    expect(tiles.some(t => t.x === 0)).toBe(true);
  });

  it('fitTwoPoints shows both points', () => {
    const { center, zoom } = fitTwoPoints(EIU, FAR, 400, 800, 90);
    expect(zoom).toBeGreaterThanOrEqual(13);
    expect(zoom).toBeLessThanOrEqual(18);
    for (const p of [EIU, FAR]) {
      const s = latLngToScreen(p, center, zoom, 400, 800);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(400);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(800);
    }
    expect(fitTwoPoints(EIU, EIU, 400, 800).zoom).toBe(18);
  });
});

describe('distance, direction, links', () => {
  it('haversine: one degree of latitude is about 111 km', () => {
    expect(
      haversineM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) / 1000,
    ).toBeCloseTo(111.2, 0);
    expect(haversineM(EIU, EIU)).toBe(0);
  });

  it('bearing and compass names', () => {
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(0);
    expect(bearingDeg({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(90);
    expect(bearingDeg({ lat: 1, lng: 0 }, { lat: 0, lng: 0 })).toBeCloseTo(180);
    expect(compassVi(0)).toBe('Bắc');
    expect(compassVi(46)).toBe('Đông Bắc');
    expect(compassVi(270)).toBe('Tây');
    expect(compassVi(359)).toBe('Bắc');
    expect(compassVi(-90)).toBe('Tây');
  });

  it('formats distances with a decimal comma', () => {
    expect(formatDistanceVi(3200)).toBe('3,2 km');
    expect(formatDistanceVi(12400)).toBe('12 km');
    expect(formatDistanceVi(850)).toBe('850 m');
    expect(formatDistanceVi(-1)).toBe('');
  });

  it('describes where the campus is', () => {
    const text = offCampusText({ lat: 11.0235, lng: 106.6667 }, EIU);
    expect(text).toContain('Bạn đang cách campus 3,3 km');
    expect(text).toContain('hướng Bắc');
  });

  it('builds the directions links', () => {
    expect(directionsUrl(EIU)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=11.0535,106.6667',
    );
    expect(geoUrl(EIU)).toBe('geo:11.0535,106.6667?q=11.0535,106.6667(EIU)');
  });
});
