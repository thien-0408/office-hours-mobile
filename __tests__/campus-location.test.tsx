import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { Barometer } from 'expo-sensors';
import {
  useCampusLocation,
  type UseCampusLocationResult,
} from '../src/campus/location/useCampusLocation';
import {
  clampFloor,
  useFloorEstimate,
  type UseFloorEstimateResult,
} from '../src/campus/location/useFloorEstimate';
import { campus } from '../src/campus/campusData';
import { toLatLng } from '../src/campus/geo';
import { polygonCentroid } from '../src/campus/map/mapMath';

const mockLoc = Location as jest.Mocked<typeof Location>;
const mockBaro = Barometer as jest.Mocked<typeof Barometer>;

function Probe<T>({ use, out }: { use: () => T; out: { current: T } }) {
  out.current = use();
  return null;
}
async function mount<T>(use: () => T) {
  const out = { current: undefined as unknown as T };
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    r = ReactTestRenderer.create(<Probe use={use} out={out} />);
  });
  return { out, r };
}

const b11 = campus.blocks.find(b => b.code === 'B11')!;
const inside = polygonCentroid(b11.outline);
const ll = toLatLng(inside.x, inside.z);

type Listener = (pos: {
  coords: { latitude: number; longitude: number; accuracy: number | null };
  timestamp: number;
}) => void;

describe('useCampusLocation', () => {
  let listener: Listener | null = null;
  const remove = jest.fn();

  beforeEach(() => {
    listener = null;
    remove.mockClear();
    mockLoc.getForegroundPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      status: 'granted',
    } as never);
    mockLoc.watchPositionAsync.mockImplementation((async (_o: unknown, cb: Listener) => {
      listener = cb;
      return { remove };
    }) as never);
  });

  it('stays off and does not watch while disabled', async () => {
    const calls = mockLoc.watchPositionAsync.mock.calls.length;
    const { out, r } = await mount(() => useCampusLocation({ enabled: false }));
    expect(out.current.status).toBe('off');
    expect(mockLoc.watchPositionAsync.mock.calls.length).toBe(calls);
    await act(async () => r.unmount());
  });

  it('watches, filters readings, reports a fix and stops on unmount', async () => {
    const onFix = jest.fn();
    const { out, r } = await mount(() => useCampusLocation({ enabled: true, onFix }));
    expect(out.current.status).toBe('waiting');
    expect(mockLoc.watchPositionAsync).toHaveBeenCalled();
    const opts = mockLoc.watchPositionAsync.mock.calls.at(-1)![0] as { timeInterval: number };
    expect(opts.timeInterval).toBe(2000);

    // too inaccurate: dropped by the filter, still waiting
    await act(async () => {
      listener!({ coords: { latitude: ll.lat, longitude: ll.lng, accuracy: 80 }, timestamp: 1000 });
    });
    expect(out.current.fix).toBeNull();
    expect(out.current.status).toBe('waiting');
    expect(out.current.lastReading?.accuracy).toBe(80);

    await act(async () => {
      listener!({ coords: { latitude: ll.lat, longitude: ll.lng, accuracy: 6 }, timestamp: 3000 });
    });
    expect(out.current.status).toBe('ok');
    expect(out.current.fix?.acc).toBe(6);
    expect(out.current.fix?.x).toBeCloseTo(inside.x, 0);
    expect(onFix).toHaveBeenCalledTimes(1);

    await act(async () => r.unmount());
    expect(remove).toHaveBeenCalled();
  });

  it('reports denied when the OS permission is not granted', async () => {
    mockLoc.getForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: 'denied',
    } as never);
    const calls = mockLoc.watchPositionAsync.mock.calls.length;
    const { out, r } = await mount(() => useCampusLocation({ enabled: true }));
    expect(out.current.status).toBe('denied');
    expect(mockLoc.watchPositionAsync.mock.calls.length).toBe(calls);
    await act(async () => r.unmount());
  });

  it('reports error when the watcher throws', async () => {
    mockLoc.watchPositionAsync.mockRejectedValueOnce(new Error('gps'));
    const { out, r } = await mount(() => useCampusLocation({ enabled: true }));
    expect(out.current.status).toBe('error');
    await act(async () => r.unmount());
  });

  it('stops watching when the app goes to background', async () => {
    let appCb: ((s: string) => void) | null = null;
    const spy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation(((_t: string, cb: (s: string) => void) => {
        appCb = cb;
        return { remove: jest.fn() };
      }) as never);
    const { out, r } = await mount(() => useCampusLocation({ enabled: true }));
    expect(out.current.status).toBe('waiting');
    await act(async () => appCb!('background'));
    expect(remove).toHaveBeenCalled();
    expect(out.current.status).toBe('off');
    await act(async () => r.unmount());
    spy.mockRestore();
  });

  it('drops the dot when disabled again', async () => {
    let enabled = true;
    const { out, r } = await mount(() => useCampusLocation({ enabled }));
    await act(async () => {
      listener!({ coords: { latitude: ll.lat, longitude: ll.lng, accuracy: 5 }, timestamp: 1000 });
    });
    expect(out.current.fix).not.toBeNull();
    enabled = false;
    await act(async () => {
      r.update(<Probe use={() => useCampusLocation({ enabled })} out={out as { current: UseCampusLocationResult }} />);
    });
    expect(out.current.fix).toBeNull();
    expect(out.current.status).toBe('off');
    await act(async () => r.unmount());
  });
});

describe('useFloorEstimate', () => {
  let baroCb: ((d: { pressure: number }) => void) | null = null;
  beforeEach(() => {
    baroCb = null;
    mockBaro.isAvailableAsync.mockResolvedValue(true);
    mockBaro.addListener.mockImplementation(((cb: (d: { pressure: number }) => void) => {
      baroCb = cb;
      return { remove: jest.fn() };
    }) as never);
  });

  it('is {null, null} without a block', async () => {
    const { out, r } = await mount(() => useFloorEstimate(null));
    expect(out.current.floor).toBeNull();
    expect(out.current.source).toBeNull();
    await act(async () => r.unmount());
  });

  it('is {null, null} when the device has no barometer', async () => {
    mockBaro.isAvailableAsync.mockResolvedValue(false);
    const { out, r } = await mount(() => useFloorEstimate('B11'));
    expect(out.current.barometer).toBe(false);
    expect(out.current.floor).toBeNull();
    expect(out.current.source).toBeNull();
    await act(async () => r.unmount());
  });

  it('takes the first reading in the block as floor 1 (baro)', async () => {
    const { out, r } = await mount(() => useFloorEstimate('B11'));
    await act(async () => baroCb!({ pressure: 1010 }));
    expect(out.current.floor).toBe(1);
    expect(out.current.source).toBe('baro');
    await act(async () => r.unmount());
  });

  it('manual choice overrides, is clamped, and clears on block change', async () => {
    let block: string | null = 'B11';
    const { out, r } = await mount(() => useFloorEstimate(block));
    await act(async () => baroCb!({ pressure: 1010 }));
    await act(async () => out.current.setManualFloor(3));
    expect(out.current.floor).toBe(3);
    expect(out.current.source).toBe('manual');
    await act(async () => out.current.setManualFloor(99));
    expect(out.current.floor).toBe(b11.floors);
    block = 'B8';
    await act(async () => {
      r.update(<Probe use={() => useFloorEstimate(block)} out={out as { current: UseFloorEstimateResult }} />);
    });
    expect(out.current.source).not.toBe('manual');
    await act(async () => r.unmount());
  });

  it('works for manual choice even with no barometer', async () => {
    mockBaro.isAvailableAsync.mockResolvedValue(false);
    const { out, r } = await mount(() => useFloorEstimate('B11'));
    await act(async () => out.current.setManualFloor(2));
    expect(out.current.floor).toBe(2);
    expect(out.current.source).toBe('manual');
    await act(async () => r.unmount());
  });

  it('clampFloor', () => {
    expect(clampFloor(0, 4)).toBe(1);
    expect(clampFloor(9, 4)).toBe(4);
    expect(clampFloor(2.4, 4)).toBe(2);
  });
});
