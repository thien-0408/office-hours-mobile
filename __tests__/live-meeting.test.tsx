import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const mockNavigate = jest.fn();
const mockSetQuality = jest.fn();
let mockConsent = 'granted';
let mockBooking: unknown;
let mockBookingError = false;
let mockOffice: unknown = null;
let mockFix: unknown = null;
let mockLocStatus = 'ok';

jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      canGoBack: () => true,
    }),
    useRoute: () => ({ params: { bookingId: 'bk1' } }),
    useIsFocused: () => true,
    useFocusEffect: (cb: () => void | (() => void)) => {
      R.useEffect(cb, [cb]);
    },
  };
});
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: (p: object) => R.createElement(View, p),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('../src/campus/consent', () => ({
  useLocationConsent: () => ({ status: mockConsent }),
}));
jest.mock('../src/api/hooks', () => ({
  useBooking: () => ({
    data: mockBooking,
    isError: mockBookingError,
    error: new Error('boom'),
  }),
  useLecturer: () => ({ data: { officeRoom: mockOffice } }),
}));
jest.mock('../src/navigation/devSession', () => ({
  useAppSession: () => ({ role: 'STUDENT' }),
}));
jest.mock('../src/campus/location/useCampusLocation', () => ({
  useCampusLocation: () => ({ fix: mockFix, status: mockLocStatus }),
}));
jest.mock('../src/campus/location/useFloorEstimate', () => ({
  useFloorEstimate: () => ({ floor: 2, source: 'baro' }),
}));
jest.mock('../src/components/motion', () => {
  const actual = jest.requireActual('../src/components/motion');
  return {
    ...actual,
    useGlass: () => ({ quality: 'auto', setQuality: mockSetQuality }),
  };
});

import { LiveMeetingScreen } from '../src/features/campus/screens/LiveMeetingScreen';
import {
  createStubTransport,
  getLiveLocationTransport,
  setLiveLocationTransport,
  type StubTransport,
} from '../src/realtime/location';

const MIN = 60_000;
const iso = (offsetMin: number) =>
  new Date(Date.now() + offsetMin * MIN).toISOString();
const makeBooking = (startOff: number, endOff: number) => ({
  id: 'bk1',
  lecturerId: 'lec1',
  studentId: 'stu1',
  lecturerName: 'Cô Lan',
  studentName: 'An',
  topic: 'Đồ án',
  startAt: iso(startOff),
  endAt: iso(endOff),
  status: 'CONFIRMED',
  meetingUrl: null,
});

async function render() {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    r = ReactTestRenderer.create(
      <GestureHandlerRootView>
        <LiveMeetingScreen />
      </GestureHandlerRootView>,
    );
  });
  return r;
}
const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));
const press = async (r: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const btn = r.root.findAll(
    n =>
      n.props.accessibilityRole === 'button' &&
      typeof n.props.onPress === 'function' &&
      n.findAllByType(Text).some(x => x.props.children === label),
  )[0];
  expect(btn).toBeDefined();
  await act(async () => {
    btn.props.onPress();
  });
};

let original: ReturnType<typeof getLiveLocationTransport>;
let transport: StubTransport;

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetQuality.mockClear();
  mockConsent = 'granted';
  mockBooking = makeBooking(-5, 25);
  mockBookingError = false;
  mockOffice = null;
  mockFix = null;
  mockLocStatus = 'ok';
  original = getLiveLocationTransport();
  transport = createStubTransport({ uid: 'stu1' });
  setLiveLocationTransport(transport);
});
afterEach(() => setLiveLocationTransport(original));

describe('LiveMeetingScreen', () => {
  it('forces solid glass on focus and restores on blur', async () => {
    const r = await render();
    expect(mockSetQuality).toHaveBeenCalledWith('solid');
    await act(async () => r.unmount());
    expect(mockSetQuality).toHaveBeenLastCalledWith('auto');
  });

  it('no consent: explains and links to LocationConsent', async () => {
    mockConsent = 'unknown';
    const r = await render();
    expect(texts(r).some(t => t.includes('chưa đồng ý chia sẻ vị trí'))).toBe(
      true,
    );
    await press(r, 'Xem quyền riêng tư');
    expect(mockNavigate).toHaveBeenCalledWith('LocationConsent');
    await act(async () => r.unmount());
  });

  it('outside the window: shows the open hours and never publishes', async () => {
    mockBooking = makeBooking(-90, -60); // ended > 15 min ago
    const r = await render();
    expect(texts(r).some(t => t.startsWith('Chia sẻ vị trí mở từ '))).toBe(
      true,
    );
    expect(transport.calls.publish).toHaveLength(0);
    await act(async () => r.unmount());
  });

  it('in window, toggle off by default: nothing is shared', async () => {
    const r = await render();
    const t = texts(r);
    expect(t).toContain('Chia sẻ vị trí');
    expect(t).not.toContain('Dừng chia sẻ');
    expect(
      t.some(x => x.includes('Bật chia sẻ để thấy vị trí của Cô Lan')),
    ).toBe(true);
    await act(async () => r.unmount());
  });

  it('sharing on: waits for the other side, then shows their label and age', async () => {
    mockFix = { x: 1, z: 2, acc: 5, block: 'B11' };
    const r = await render();
    await press(r, 'Bật');
    let t = texts(r);
    expect(t).toContain('Dừng chia sẻ');
    expect(t).toContain('Đang chờ Cô Lan bật chia sẻ');
    expect(t).toContain('B11 · tầng 2 (ước lượng)');

    await act(async () => {
      transport.setPeer('bk1', 'lec1', {
        building: 'B10',
        x: 3,
        z: 4,
        acc: 5,
        floor: 1,
        floorSource: 'manual',
        updatedAt: Date.now() - 4000,
      });
    });
    t = texts(r);
    expect(t).toContain('B10 · tầng 1 (tự chọn)');
    expect(t.some(x => /^cập nhật \d+s trước$/.test(x))).toBe(true);

    await act(async () => {
      transport.setPeer('bk1', 'lec1', {
        building: 'B10',
        x: 3,
        z: 4,
        acc: 5,
        updatedAt: Date.now() - 60_000,
      });
    });
    expect(texts(r)).toContain('mất tín hiệu');
    await act(async () => r.unmount());
  });

  it('Dừng chia sẻ removes my location', async () => {
    mockFix = { x: 1, z: 2, acc: 5, block: 'B11' };
    const r = await render();
    await press(r, 'Bật');
    await press(r, 'Dừng chia sẻ');
    expect(transport.calls.remove).toContain('bk1');
    expect(texts(r)).not.toContain('Dừng chia sẻ');
    await act(async () => r.unmount());
  });

  it('unmount while sharing removes my location', async () => {
    const r = await render();
    await press(r, 'Bật');
    await act(async () => r.unmount());
    expect(transport.calls.remove).toEqual(['bk1']);
  });

  it('peer in the destination room reads "tại phòng"', async () => {
    mockOffice = {
      id: 'r1',
      buildingCode: 'B11',
      floor: 3,
      name: 'VP',
      code: '306.B11',
    };
    const r = await render();
    expect(texts(r).some(t => t.includes('Phòng 306.B11'))).toBe(true);
    await press(r, 'Bật');
    await act(async () => {
      transport.setPeer('bk1', 'lec1', {
        building: 'B11',
        x: 3,
        z: 4,
        acc: 5,
        floor: 3,
        floorSource: 'baro',
        updatedAt: Date.now(),
      });
    });
    expect(texts(r)).toContain('tại phòng 306.B11');
    await act(async () => r.unmount());
  });

  it('load failure shows an alert line, not the backend message', async () => {
    mockBooking = undefined;
    mockBookingError = true;
    const r = await render();
    expect(
      r.root.findAll(n => n.props.accessibilityRole === 'alert').length,
    ).toBeGreaterThan(0);
    expect(texts(r).join('|')).not.toContain('boom');
    await act(async () => r.unmount());
  });
});
