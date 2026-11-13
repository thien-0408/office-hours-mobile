import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const mockNavigate = jest.fn();
const mockSetQuality = jest.fn();
let mockParams: { roomId?: string } | undefined;
let mockConsent = 'unknown';
let mockRooms: { data?: unknown[]; isError?: boolean; isLoading?: boolean; error?: unknown } = {
  data: [],
};

jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      canGoBack: () => true,
    }),
    useRoute: () => ({ params: mockParams }),
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
  useCampusRooms: () => mockRooms,
}));
jest.mock('../src/components/motion', () => {
  const actual = jest.requireActual('../src/components/motion');
  return {
    ...actual,
    useGlass: () => ({ quality: 'auto', setQuality: mockSetQuality }),
  };
});

import { CampusMapScreen } from '../src/features/campus/screens/CampusMapScreen';
import { FloorPlan } from '../src/campus/map/components/FloorPlan';
import { LocationSourceLabel } from '../src/campus/map/components/LocationSourceLabel';
import { campus } from '../src/campus/campusData';

async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    r = ReactTestRenderer.create(
      <GestureHandlerRootView>{el}</GestureHandlerRootView>,
    );
  });
  return r;
}
const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

beforeEach(() => {
  mockNavigate.mockClear();
  mockSetQuality.mockClear();
  mockParams = undefined;
  mockConsent = 'unknown';
  mockRooms = { data: [] };
});

describe('CampusMapScreen', () => {
  it('renders the map shell with title, attribution and no-room hint', async () => {
    const r = await render(<CampusMapScreen />);
    const t = texts(r);
    expect(t).toContain('Bản đồ campus');
    expect(t).toContain('© OpenStreetMap contributors');
    expect(t).toContain('Chạm vào một block để xem thông tin.');
    await act(async () => r.unmount());
  });

  it('forces solid glass on focus and restores on blur', async () => {
    const r = await render(<CampusMapScreen />);
    expect(mockSetQuality).toHaveBeenCalledWith('solid');
    await act(async () => r.unmount());
    expect(mockSetQuality).toHaveBeenLastCalledWith('auto');
  });

  it('shows the destination room card for roomId', async () => {
    mockParams = { roomId: 'r-306' };
    mockRooms = {
      data: [
        { id: 'r-306', buildingCode: 'B11', floor: 3, name: 'VP K.ĐD', code: '306.B11' },
      ],
    };
    const r = await render(<CampusMapScreen />);
    const t = texts(r);
    expect(t).toContain('Phòng 306.B11 · tầng 3');
    expect(t.some(x => x.startsWith('Block 11'))).toBe(true);
    await act(async () => r.unmount());
  });

  it('sends the user to LocationConsent when there is no consent', async () => {
    const r = await render(<CampusMapScreen />);
    const btn = r.root.findAll(
      n => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function',
    );
    const mine = btn.find(n => {
      try {
        return n.findAllByType(Text).some(x => x.props.children === 'Vị trí của tôi');
      } catch {
        return false;
      }
    });
    expect(mine).toBeDefined();
    await act(async () => {
      mine!.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('LocationConsent');
    await act(async () => r.unmount());
  });

  it('shows an error line when the room list fails', async () => {
    mockParams = { roomId: 'x' };
    mockRooms = { isError: true, error: new Error('boom') };
    const r = await render(<CampusMapScreen />);
    expect(texts(r).some(x => x.length > 0 && !x.startsWith('Campus'))).toBe(true);
    expect(r.root.findAll(n => n.props.accessibilityRole === 'alert').length).toBeGreaterThan(0);
    await act(async () => r.unmount());
  });
});

describe('FloorPlan (20b)', () => {
  it('lists rooms of the first floor and highlights the target', async () => {
    const target = campus.rooms.find(r => r.building === 'B11' && r.floor === 3)!;
    const block = campus.blocks.find(b => b.code === 'B11')!;
    const onBack = jest.fn();
    const r = await render(
      <FloorPlan
        block={block}
        rooms={campus.rooms}
        targetCode={target.code}
        initialFloor={3}
        onBack={onBack}
      />,
    );
    const t = texts(r);
    expect(t).toContain(target.name);
    expect(t).toContain('Tầng 3');
    const on = r.root.findAll(n => n.props.accessibilityState?.selected === true && n.props.style);
    expect(on.length).toBeGreaterThan(0);
    await act(async () => r.unmount());
  });
});

describe('LocationSourceLabel', () => {
  it('uses a dashed border for estimated and solid for manual', async () => {
    const est = await render(<LocationSourceLabel text="B11 · tầng 2 (ước lượng)" source="baro" />);
    const man = await render(<LocationSourceLabel text="B11 · tầng 2 (tự chọn)" source="manual" />);
    const style = (r: ReactTestRenderer.ReactTestRenderer) =>
      r.root.findByProps({ testID: 'location-source-label' }).props.style;
    expect(JSON.stringify(style(est))).toContain('dashed');
    expect(JSON.stringify(style(man))).toContain('solid');
  });
});
