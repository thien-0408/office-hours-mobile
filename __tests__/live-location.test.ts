import {
  OUTSIDE_BUILDING,
  buildPayload,
  createLivePublisher,
  createStubTransport,
  freshnessText,
  getLiveLocationTransport,
  isAtRoom,
  peerLocationText,
  setLiveLocationTransport,
  sharingGate,
  sharingWindowText,
  type LiveLocationPayload,
} from '../src/realtime/location';

const MIN = 60_000;
const T0 = Date.parse('2026-11-18T07:00:00.000Z'); // 14:00 VN
const booking = {
  startAt: new Date(T0).toISOString(),
  endAt: new Date(T0 + 30 * MIN).toISOString(),
};
const fix = { x: 10, z: 20, acc: 5, block: 'B11' };

describe('sharingGate', () => {
  const base = { consentGranted: true, booking, userEnabled: true };

  it('allows consent + window + toggle', () => {
    expect(sharingGate({ ...base, now: T0 + MIN })).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it('window is startAt .. endAt + 15 min inclusive', () => {
    expect(sharingGate({ ...base, now: T0 - 1 }).reason).toBe('outside-window');
    expect(sharingGate({ ...base, now: T0 }).allowed).toBe(true);
    expect(sharingGate({ ...base, now: T0 + 45 * MIN }).allowed).toBe(true);
    expect(sharingGate({ ...base, now: T0 + 45 * MIN + 1 }).reason).toBe(
      'outside-window',
    );
  });

  it('needs consent and the toggle; consent is checked first', () => {
    expect(
      sharingGate({ ...base, consentGranted: false, now: T0 + MIN }).reason,
    ).toBe('no-consent');
    expect(
      sharingGate({
        ...base,
        consentGranted: false,
        now: T0 - 99 * MIN,
      }).reason,
    ).toBe('no-consent');
    expect(
      sharingGate({ ...base, userEnabled: false, now: T0 + MIN }).reason,
    ).toBe('off');
    expect(sharingGate({ ...base, booking: null, now: T0 }).reason).toBe(
      'outside-window',
    );
  });

  it('window text is HH:mm to HH:mm in Vietnam time', () => {
    expect(sharingWindowText(booking)).toBe(
      'Chia sẻ vị trí mở từ 14:00 đến 14:45',
    );
  });
});

describe('peer display', () => {
  it('freshness: seconds, then mất tín hiệu after 30 s', () => {
    expect(freshnessText({ updatedAt: 1000 }, 6000)).toBe('cập nhật 5s trước');
    expect(freshnessText({ updatedAt: 1000 }, 31_000)).toBe(
      'cập nhật 30s trước',
    );
    expect(freshnessText({ updatedAt: 1000 }, 31_001)).toBe('mất tín hiệu');
  });

  const target = { blockCode: 'B11', floor: 3, label: '306.B11' };
  it('at the destination block and floor reads "tại phòng"', () => {
    const where = { building: 'B11', floor: 3, floorSource: 'baro' as const };
    expect(isAtRoom(where, target)).toBe(true);
    expect(peerLocationText(where, target)).toBe('tại phòng 306.B11');
  });

  it('elsewhere falls back to block + floor with the source', () => {
    expect(
      peerLocationText(
        { building: 'B11', floor: 2, floorSource: 'baro' },
        target,
      ),
    ).toBe('B11 · tầng 2 (ước lượng)');
    expect(peerLocationText({ building: 'B11', floor: 3 }, null)).toBe('B11');
    expect(peerLocationText({ building: OUTSIDE_BUILDING }, target)).toBe(
      'Ngoài campus',
    );
  });
});

describe('buildPayload', () => {
  it('matches the RTDB rules shape', () => {
    expect(buildPayload(fix, 2, 'baro', 123)).toEqual({
      building: 'B11',
      x: 10,
      z: 20,
      acc: 5,
      floor: 2,
      floorSource: 'baro',
      updatedAt: 123,
    });
  });

  it('omits floor keys when unknown and uses OUTSIDE off-block', () => {
    const p = buildPayload({ ...fix, block: null }, null, null, 1);
    expect(p.building).toBe(OUTSIDE_BUILDING);
    expect('floor' in p).toBe(false);
    expect('floorSource' in p).toBe(false);
  });

  it('clamps to the rule ranges', () => {
    const p = buildPayload(
      { x: 5000, z: -5000, acc: 999, block: 'B1' },
      40,
      null,
      1,
    );
    expect(p).toMatchObject({ x: 1000, z: -1000, acc: 200, floor: 20 });
  });
});

describe('stub transport', () => {
  const p = (x: number): LiveLocationPayload => ({
    building: 'B11',
    x,
    z: 0,
    acc: 5,
    updatedAt: 1,
  });

  it('publish/subscribe/remove round-trip', () => {
    const t = createStubTransport({ uid: 'me' });
    const seen: string[][] = [];
    const off = t.subscribe('b1', peers => seen.push(Object.keys(peers)));
    expect(seen).toEqual([[]]);
    t.publish('b1', p(1));
    t.setPeer('b1', 'other', p(2));
    expect(seen[seen.length - 1].sort()).toEqual(['me', 'other']);
    t.remove('b1');
    expect(Object.keys(t.get('b1'))).toEqual(['other']);
    off();
    t.setPeer('b1', 'other', p(3));
    expect(seen).toHaveLength(4);
  });

  it('bookings are isolated and late subscribers get the snapshot', () => {
    const t = createStubTransport();
    t.publish('a', p(1));
    const cb = jest.fn();
    t.subscribe('b', cb);
    expect(cb).toHaveBeenLastCalledWith({});
    t.subscribe('a', cb);
    expect(Object.keys(cb.mock.calls[cb.mock.calls.length - 1][0])).toEqual([
      'me',
    ]);
  });

  it('getLiveLocationTransport is swappable', () => {
    const original = getLiveLocationTransport();
    const t = createStubTransport();
    setLiveLocationTransport(t);
    expect(getLiveLocationTransport()).toBe(t);
    setLiveLocationTransport(original);
  });
});

describe('createLivePublisher throttling (shouldPublish)', () => {
  it('first fix publishes, then only on >= 5 s, >= 5 m or block change', () => {
    const t = createStubTransport();
    const pub = createLivePublisher(t, 'b1');
    expect(pub.push(fix, 1, 'baro', 0)).toBe(true);
    expect(pub.push({ ...fix, x: 11 }, 1, 'baro', 2000)).toBe(false);
    expect(pub.push({ ...fix, x: 16 }, 1, 'baro', 2500)).toBe(true); // 6 m
    expect(pub.push({ ...fix, x: 16 }, 1, 'baro', 4000)).toBe(false);
    expect(pub.push({ ...fix, x: 16 }, 1, 'baro', 7600)).toBe(true); // 5.1 s
    expect(pub.push({ ...fix, x: 16, block: 'B2' }, 1, 'baro', 7700)).toBe(
      true,
    );
    expect(t.calls.publish).toHaveLength(4);
  });

  it('stop removes my location once and blocks later writes', () => {
    const t = createStubTransport();
    const pub = createLivePublisher(t, 'b1');
    pub.push(fix, null, null, 0);
    pub.stop();
    pub.stop();
    expect(t.calls.remove).toEqual(['b1']);
    expect(pub.push(fix, null, null, 99_999)).toBe(false);
    expect(t.get('b1')).toEqual({});
  });
});
