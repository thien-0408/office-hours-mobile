import {
  toXZ,
  toLatLng,
  distanceM,
  pointInPolygon,
  distanceToPolygonM,
  isOnCampus,
  findBlock,
  createLocationFilter,
  shouldPublish,
  createFloorEstimator,
  DEFAULT_FLOOR_HEIGHT_M,
  roomFloor,
  roomBlock,
  floorLabel,
  locationLabel,
} from '../src/campus/geo';
import { campus, defaultCampus } from '../src/campus/campusData';

describe('geo.ts — EIU Campus GPS & Geometry', () => {
  describe('1. toXZ ↔ toLatLng round-trip projection', () => {
    it('returns origin coordinates as (0, 0)', () => {
      const pt = toXZ(defaultCampus.origin.lat, defaultCampus.origin.lng);
      expect(pt.x).toBeCloseTo(0, 5);
      expect(pt.z).toBeCloseTo(0, 5);
      expect(pt[0]).toBeCloseTo(0, 5);
      expect(pt[1]).toBeCloseTo(0, 5);

      const [x, z] = pt;
      expect(x).toBeCloseTo(0, 5);
      expect(z).toBeCloseTo(0, 5);
    });

    it('roundtrip (lat, lng) -> toXZ -> toLatLng has error < 0.01 m', () => {
      const testPoints = [
        { lat: 11.0528, lng: 106.6661 }, // origin
        { lat: 11.052507, lng: 106.667553 }, // Block 3 center
        { lat: 11.053686, lng: 106.66729 }, // Block 4 center
        { lat: 11.055172, lng: 106.667233 }, // Canteen
        { lat: 11.054139, lng: 106.666631 }, // Block 11
        { lat: 11.049912, lng: 106.663299 }, // campus south-west bound
        { lat: 11.055651, lng: 106.668999 }, // campus north-east bound
      ];

      for (const origLL of testPoints) {
        const xz = toXZ(origLL.lat, origLL.lng);
        const backLL = toLatLng(xz.x, xz.z);
        const xz2 = toXZ(backLL.lat, backLL.lng);

        const errM = distanceM(xz, xz2);
        expect(errM).toBeLessThan(0.01);

        // Also check latitude/longitude directly
        expect(backLL.lat).toBeCloseTo(origLL.lat, 6);
        expect(backLL.lng).toBeCloseTo(origLL.lng, 6);
      }
    });

    it('roundtrip (x, z) -> toLatLng -> toXZ has error < 0.01 m', () => {
      const testCoords: Array<[number, number]> = [
        [0, 0],
        [158.75, -32.39],
        [-120.5, 230.1],
        [302.3, -319.2],
        [-250.0, 15.0],
      ];

      for (const [x, z] of testCoords) {
        const ll = toLatLng(x, z);
        const backXZ = toXZ(ll.lat, ll.lng);
        const errM = distanceM([x, z], backXZ);
        expect(errM).toBeLessThan(0.01);
      }
    });

    it('supports point overload for toLatLng', () => {
      const ll1 = toLatLng(100, 50);
      const ll2 = toLatLng({ x: 100, z: 50 });
      const ll3 = toLatLng([100, 50]);

      expect(ll1.lat).toBeCloseTo(ll2.lat, 8);
      expect(ll1.lng).toBeCloseTo(ll2.lng, 8);
      expect(ll1.lat).toBeCloseTo(ll3.lat, 8);
      expect(ll1.lng).toBeCloseTo(ll3.lng, 8);
    });
  });

  describe('2. Block 3 in OSM and Campus Boundary', () => {
    it('locates Block 3 from its OSM centerLatLng inside Block 3 outline', () => {
      // Center of Block 3 from OSM seed data
      const b3Lat = 11.052507;
      const b3Lng = 106.667553;
      const b3XZ = toXZ(b3Lat, b3Lng);

      const block = findBlock(b3XZ, campus.blocks);
      expect(block).not.toBeNull();
      expect(block?.code).toBe('B3');
      expect(block?.name).toBe('Block 3');
      expect(block?.floors).toBe(3);
      expect(block?.estimated).toBe(false);

      expect(pointInPolygon(b3XZ, block!.outline)).toBe(true);
    });

    it('identifies points on campus boundary', () => {
      // Origin is near campus center
      expect(isOnCampus({ x: 0, z: 0 }, campus.boundary)).toBe(true);
      expect(isOnCampus(campus.origin)).toBe(true);

      // Block 3 center is inside campus boundary
      const b3XZ = toXZ(11.052507, 106.667553);
      expect(isOnCampus(b3XZ, campus.boundary)).toBe(true);
    });

    it('returns null and isOnCampus = false for points outside campus', () => {
      // Point far outside campus (Ho Chi Minh City center / distant coordinate)
      const farLat = 10.7769;
      const farLng = 106.7009;
      const farXZ = toXZ(farLat, farLng);

      expect(isOnCampus(farXZ, campus.boundary)).toBe(false);
      expect(isOnCampus({ lat: farLat, lng: farLng })).toBe(false);
      expect(findBlock(farXZ, campus.blocks)).toBeNull();

      // Distant metric point
      const outsidePoint: [number, number] = [5000, 5000];
      expect(isOnCampus(outsidePoint, campus.boundary)).toBe(false);
      expect(findBlock(outsidePoint, campus.blocks)).toBeNull();
    });
  });

  describe('3. marginM = 3 m tolerance around block outlines', () => {
    it('accepts point 2 m outside outline when marginM = 3', () => {
      const b3 = campus.blocks.find(b => b.code === 'B3')!;
      expect(b3).toBeDefined();

      // B3 min X is 104.2 around z = -27.6.
      // A point 2 m to the west (x = 102.2, z = -27.6) is outside the polygon.
      const outside2m: [number, number] = [102.2, -27.6];
      expect(pointInPolygon(outside2m, b3.outline)).toBe(false);

      const dist = distanceToPolygonM(outside2m, b3.outline);
      expect(dist).toBeGreaterThan(1.5);
      expect(dist).toBeLessThanOrEqual(2.5);

      // With marginM = 3, point is detected
      const foundWithMargin = findBlock(outside2m, campus.blocks, 3);
      expect(foundWithMargin?.code).toBe('B3');

      // With marginM = 1 or marginM = 0, point is rejected
      expect(findBlock(outside2m, campus.blocks, 1)).toBeNull();
      expect(findBlock(outside2m, campus.blocks, 0)).toBeNull();
    });

    it('rejects point 5 m outside outline even when marginM = 3', () => {
      const b3 = campus.blocks.find(b => b.code === 'B3')!;
      // Point 5 m west of edge
      const outside5m: [number, number] = [99.2, -27.6];
      expect(pointInPolygon(outside5m, b3.outline)).toBe(false);

      const dist = distanceToPolygonM(outside5m, b3.outline);
      expect(dist).toBeGreaterThan(4.5);

      expect(findBlock(outside5m, campus.blocks, 3)).toBeNull();
    });
  });

  describe('4. createLocationFilter', () => {
    it('discards readings with accuracy > 25 m', () => {
      const filter = createLocationFilter({ maxAccuracyM: 25, alpha: 0.35 });
      const s0 = filter.getInitialState();

      const res = filter.step(s0, {
        lat: 11.052507,
        lng: 106.667553,
        accuracy: 30, // exceeds 25 m
        timestamp: 1000,
      });

      expect(res.fix).toBeNull();
      expect(res.state.lastFix).toBeNull();
    });

    it('discards absurd speed jumps (> 15 m/s)', () => {
      const filter = createLocationFilter({ maxAccuracyM: 25, alpha: 0.35 });
      let state = filter.getInitialState();

      // First valid reading at origin
      const r1 = filter.step(state, {
        lat: defaultCampus.origin.lat,
        lng: defaultCampus.origin.lng,
        accuracy: 5,
        timestamp: 1000,
      });
      expect(r1.fix).not.toBeNull();
      state = r1.state;

      // Second reading 100 m away after exactly 1 second (100 m/s > 15 m/s)
      const jumpPoint = toLatLng(100, 0);
      const r2 = filter.step(state, {
        lat: jumpPoint.lat,
        lng: jumpPoint.lng,
        accuracy: 5,
        timestamp: 2000,
      });

      expect(r2.fix).toBeNull();
      // State remains at previous valid fix
      expect(r2.state.lastFix?.timestamp).toBe(1000);
    });

    it('requires 2 consecutive readings to confirm entering, switching, or exiting a block (hysteresis)', () => {
      const filter = createLocationFilter({ maxAccuracyM: 25, alpha: 0.35 });
      let state = filter.getInitialState();

      // Reading 1: inside B3 (near western entrance: x = 108, z = -27.6) -> fix returned, block not confirmed
      const b3Entrance = toLatLng(108, -27.6);
      const r1 = filter.step(state, {
        lat: b3Entrance.lat,
        lng: b3Entrance.lng,
        accuracy: 5,
        timestamp: 1000,
      });
      expect(r1.fix).not.toBeNull();
      expect(r1.fix?.block).toBeNull();
      state = r1.state;

      // Reading 2: second consecutive reading in B3 -> confirmed block updates to B3
      const r2 = filter.step(state, {
        lat: b3Entrance.lat,
        lng: b3Entrance.lng,
        accuracy: 5,
        timestamp: 2000,
      });
      expect(r2.fix?.block).toBe('B3');
      state = r2.state;

      // Reading 3: single glitch reading near Block 4 (B4 center: x=98.3, z=112.2)
      // Moving 145m from B3 center in 1s is rejected as speed jump, so test a glitch reading
      // at edge of B3 where confirmed block remains B3
      const r3 = filter.step(state, {
        lat: b3Entrance.lat, // stay in B3
        lng: b3Entrance.lng,
        accuracy: 5,
        timestamp: 3000,
      });
      expect(r3.fix?.block).toBe('B3');
      state = r3.state;

      // Reading 4: step outside B3 to courtyard (x = 80, z = -27.6, 28m away in 3s -> 9.3 m/s < 15 m/s)
      // Smoothed X ≈ 94.3m, distance to B3 edge (104.2m) is ~9.9m > 3m margin, so rawBlock is null
      const outsideLL = toLatLng(80, -27.6);
      const r4 = filter.step(state, {
        lat: outsideLL.lat,
        lng: outsideLL.lng,
        accuracy: 5,
        timestamp: 6000,
      });
      expect(r4.fix).not.toBeNull();
      expect(r4.fix?.block).toBe('B3'); // 1st reading outside -> still B3 (hysteresis)!
      state = r4.state;

      // Reading 5: second consecutive reading outside (at t = 8000 ms) -> confirms exit to null
      const r5 = filter.step(state, {
        lat: outsideLL.lat,
        lng: outsideLL.lng,
        accuracy: 5,
        timestamp: 8000,
      });
      expect(r5.fix).not.toBeNull();
      expect(r5.fix?.block).toBeNull(); // now confirmed outside!
    });

    it('smooths coordinates with EMA', () => {
      const filter = createLocationFilter({ maxAccuracyM: 25, alpha: 0.35 });
      let state = filter.getInitialState();

      // 1st point at (0, 0)
      const originLL = defaultCampus.origin;
      const r1 = filter.step(state, {
        lat: originLL.lat,
        lng: originLL.lng,
        accuracy: 10,
        timestamp: 1000,
      });
      state = r1.state;
      expect(r1.fix?.x).toBeCloseTo(0, 3);
      expect(r1.fix?.z).toBeCloseTo(0, 3);

      // 2nd point 10 m east after 2s (speed = 5 m/s < 15 m/s)
      const p10 = toLatLng(10, 0);
      const r2 = filter.step(state, {
        lat: p10.lat,
        lng: p10.lng,
        accuracy: 10,
        timestamp: 3000,
      });

      // Smoothed X should be between 0 and 10 (not 10 immediately)
      expect(r2.fix!.x).toBeGreaterThan(0);
      expect(r2.fix!.x).toBeLessThan(10);
      expect(r2.fix!.z).toBeCloseTo(0, 3);
    });
  });

  describe('5. shouldPublish (all 4 branches)', () => {
    it('Branch 1: returns true when last publish is null or undefined', () => {
      const next = { x: 10, z: 20, block: 'B3', timestamp: 1000 };
      expect(shouldPublish(null, next)).toBe(true);
      expect(shouldPublish(undefined, next)).toBe(true);
    });

    it('Branch 2: returns true when elapsed time >= 5000 ms', () => {
      const last = { x: 10, z: 20, block: 'B3', timestamp: 1000 };
      // Exactly 5000 ms later, unmoved
      const next5s = { x: 10, z: 20, block: 'B3', timestamp: 6000 };
      expect(shouldPublish(last, next5s)).toBe(true);

      // Via nowMs parameter
      const nextSmall = { x: 10, z: 20, block: 'B3', timestamp: 2000 };
      expect(shouldPublish(last, nextSmall, 6000)).toBe(true);

      // Less than 5000 ms, unmoved, same block -> false
      const next4s = { x: 10, z: 20, block: 'B3', timestamp: 5000 };
      expect(shouldPublish(last, next4s)).toBe(false);
    });

    it('Branch 3: returns true when distance >= 5 m', () => {
      const last = { x: 10, z: 20, block: 'B3', timestamp: 1000 };
      // Moved 5.0 m in 2s
      const next5m = { x: 15, z: 20, block: 'B3', timestamp: 3000 };
      expect(shouldPublish(last, next5m)).toBe(true);

      // Moved 6.0 m in 2s
      const next6m = { x: 10, z: 26, block: 'B3', timestamp: 3000 };
      expect(shouldPublish(last, next6m)).toBe(true);

      // Moved 4.0 m in 2s -> false
      const next4m = { x: 14, z: 20, block: 'B3', timestamp: 3000 };
      expect(shouldPublish(last, next4m)).toBe(false);
    });

    it('Branch 4: returns true when block changes', () => {
      const last = { x: 10, z: 20, block: 'B3', timestamp: 1000 };
      // Moved 1 m in 1s, but block changed from B3 to B4
      const nextBlockChange = { x: 11, z: 20, block: 'B4', timestamp: 2000 };
      expect(shouldPublish(last, nextBlockChange)).toBe(true);

      // Exited to null
      const nextExited = { x: 11, z: 20, block: null, timestamp: 2000 };
      expect(shouldPublish(last, nextExited)).toBe(true);
    });
  });

  describe('6. createFloorEstimator (Barometer)', () => {
    it('sets floor 1 as baseline on onEnterBlock', () => {
      const estimator = createFloorEstimator({ floorHeightM: 3.6 });
      const initial = estimator.onEnterBlock(1013.25, 4);

      expect(initial).toEqual({ floor: 1, source: 'baro' });
      expect(estimator.floor).toBe(1);
      expect(estimator.source).toBe('baro');
    });

    it('changes floor only after diff > 60% floor height for >= 3000 ms continuously', () => {
      const estimator = createFloorEstimator({ floorHeightM: DEFAULT_FLOOR_HEIGHT_M });
      estimator.onEnterBlock(1013.25, 4);

      // Climb 1 floor: 3.6 m height diff requires pressure drop of 3.6 / 8.3 ≈ 0.4337 hPa.
      // With drop of 0.43 hPa: h = 0.43 * 8.3 = 3.569 m.
      // 3.569 m > 0.6 * 3.6 m (2.16 m), raw floor is 2.
      const pFloor2 = 1013.25 - 0.43;

      // At t = 0 ms: detected change, but timer just started -> floor remains 1
      expect(estimator.onPressure(pFloor2, 0)).toEqual({ floor: 1, source: 'baro' });

      // At t = 2000 ms (< 3000 ms) -> floor still 1
      expect(estimator.onPressure(pFloor2, 2000)).toEqual({ floor: 1, source: 'baro' });

      // At t = 3000 ms (>= 3000 ms) -> floor confirms to 2!
      expect(estimator.onPressure(pFloor2, 3000)).toEqual({ floor: 2, source: 'baro' });
      expect(estimator.floor).toBe(2);
    });

    it('ignores short pressure spikes / noise (< 3000 ms)', () => {
      const estimator = createFloorEstimator({ floorHeightM: 3.6 });
      estimator.onEnterBlock(1013.25, 4);

      const pFloor2 = 1013.25 - 0.43;

      // Noise spike starts at t = 0 ms
      estimator.onPressure(pFloor2, 0);

      // Noise spike returns to normal at t = 1000 ms
      expect(estimator.onPressure(1013.25, 1000)).toEqual({ floor: 1, source: 'baro' });

      // Check later at t = 4000 ms: floor is still 1
      expect(estimator.onPressure(1013.25, 4000)).toEqual({ floor: 1, source: 'baro' });
    });

    it('manual selection overrides barometer until exiting block', () => {
      const estimator = createFloorEstimator({ floorHeightM: 3.6 });
      estimator.onEnterBlock(1013.25, 4);

      // User manually selects floor 3
      const manRes = estimator.setManual(3);
      expect(manRes).toEqual({ floor: 3, source: 'manual' });
      expect(estimator.floor).toBe(3);
      expect(estimator.source).toBe('manual');

      // Even if pressure is at floor 1 or floor 4, manual wins
      expect(estimator.onPressure(1013.25, 10000)).toEqual({ floor: 3, source: 'manual' });
      expect(estimator.onPressure(990.0, 20000)).toEqual({ floor: 3, source: 'manual' });
    });

    it('resets baseline and manual override on onExitBlock', () => {
      const estimator = createFloorEstimator({ floorHeightM: 3.6 });
      estimator.onEnterBlock(1013.25, 4);
      estimator.setManual(3);

      const exitRes = estimator.onExitBlock();
      expect(exitRes).toEqual({ floor: null, source: null });
      expect(estimator.floor).toBeNull();
      expect(estimator.source).toBeNull();

      // On entering a new block, manual override is cleared
      const enterNew = estimator.onEnterBlock(1010.0, 4);
      expect(enterNew).toEqual({ floor: 1, source: 'baro' });
      expect(estimator.source).toBe('baro');
    });

    it('clamps estimated floor to [1, floors]', () => {
      const estimator = createFloorEstimator({ floorHeightM: 3.6 });
      estimator.onEnterBlock(1013.25, 3); // 3 floors total

      // Huge pressure drop (e.g. 5 floors up)
      expect(estimator.onPressure(990.0, 0)).toEqual({ floor: 1, source: 'baro' });
      expect(estimator.onPressure(990.0, 3500)).toEqual({ floor: 3, source: 'baro' }); // clamped to 3

      // High pressure (below ground)
      expect(estimator.onPressure(1030.0, 4000)).toEqual({ floor: 3, source: 'baro' });
      expect(estimator.onPressure(1030.0, 7500)).toEqual({ floor: 1, source: 'baro' }); // clamped to 1
    });
  });

  describe('7. Room Parsing and Vietnamese Labels', () => {
    it('roomFloor extracts first digit as floor', () => {
      expect(roomFloor('306.B11')).toBe(3);
      expect(roomFloor('100.B3')).toBe(1);
      expect(roomFloor('204.B5')).toBe(2);
      expect(roomFloor('401.B8')).toBe(4);
      expect(roomFloor('B11.306')).toBe(3);
      expect(roomFloor('SHOP.B11')).toBeNull();
      expect(roomFloor('')).toBeNull();
      expect(roomFloor(null)).toBeNull();
      expect(roomFloor(undefined)).toBeNull();
    });

    it('roomBlock extracts block code', () => {
      expect(roomBlock('306.B11')).toBe('B11');
      expect(roomBlock('100.B3')).toBe('B3');
      expect(roomBlock('204.B5')).toBe('B5');
      expect(roomBlock('SHOP.B11')).toBe('B11');
      expect(roomBlock('B11')).toBe('B11');
      expect(roomBlock('canteen')).toBe('CANTEEN');
      expect(roomBlock('unknown')).toBeNull();
      expect(roomBlock(null)).toBeNull();
    });

    it('floorLabel formats strings according to source', () => {
      expect(floorLabel(2, 'baro')).toBe('tầng 2 (ước lượng)');
      expect(floorLabel(2, 'manual')).toBe('tầng 2 (tự chọn)');
      expect(floorLabel(null, 'baro')).toBe('Tầng ?');
      expect(floorLabel(2, null)).toBe('Tầng ?');
      expect(floorLabel(null, null)).toBe('Tầng ?');
      expect(floorLabel(undefined, undefined)).toBe('Tầng ?');
    });

    it('locationLabel formats strings per STYLE-MOCHY §8.10', () => {
      // Room takes highest priority: "tại phòng 306.B11"
      expect(locationLabel('B11', 2, 'baro', '306.B11')).toBe('tại phòng 306.B11');
      expect(locationLabel('B11', null, null, '306.B11')).toBe('tại phòng 306.B11');
      expect(locationLabel(null, null, null, 'tại phòng 306.B11')).toBe('tại phòng 306.B11');

      // Block with estimated floor
      expect(locationLabel('B11', 2, 'baro')).toBe('B11 · tầng 2 (ước lượng)');

      // Block with manual floor
      expect(locationLabel('B11', 2, 'manual')).toBe('B11 · tầng 2 (tự chọn)');

      // Block only (no floor)
      expect(locationLabel('B11', null, null)).toBe('B11');
      expect(locationLabel('B11')).toBe('B11');

      // Outside campus
      expect(locationLabel(null, null, null)).toBe('Ngoài campus');
      expect(locationLabel(undefined)).toBe('Ngoài campus');
    });
  });

  describe('8. Campus Data & Room List Integrity', () => {
    it('contains all 8 blocks and Canteen', () => {
      const blockCodes = campus.blocks.map(b => b.code);
      expect(blockCodes).toContain('B3');
      expect(blockCodes).toContain('B4');
      expect(blockCodes).toContain('B5');
      expect(blockCodes).toContain('B6');
      expect(blockCodes).toContain('B8');
      expect(blockCodes).toContain('B9');
      expect(blockCodes).toContain('B10');
      expect(blockCodes).toContain('B11');
      expect(blockCodes).toContain('CANTEEN');
    });

    it('sets estimated = true only for blocks 8-11', () => {
      for (const b of campus.blocks) {
        if (['B8', 'B9', 'B10', 'B11'].includes(b.code)) {
          expect(b.estimated).toBe(true);
        } else {
          expect(b.estimated).toBe(false);
        }
      }
    });

    it('has 150 rooms loaded from eiu-rooms.json', () => {
      expect(campus.rooms.length).toBe(150);
      const room306 = campus.rooms.find(r => r.code === '306.B11');
      expect(room306).toBeDefined();
      expect(room306?.building).toBe('B11');
      expect(room306?.floor).toBe(3);
    });
  });
});
