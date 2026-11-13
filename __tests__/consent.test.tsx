import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as SecureStore from 'expo-secure-store';
import {
  clearConsent,
  ensureInitialized,
  getConsent,
  getExplanationForStep,
  LOCATION_CONSENT_KEY,
  nextStepFor,
  resetConsentCache,
  setConsent,
  useLocationConsent,
} from '../src/features/campus/consent';
import { LocationConsentScreen } from '../src/features/campus/screens/LocationConsentScreen';
import * as permissions from '../src/platform/permissions';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
let mockRouteParams: { next?: string } | undefined;

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      canGoBack: mockCanGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

describe('consentStore', () => {
  let memoryStore: Record<string, string> = {};

  beforeEach(() => {
    memoryStore = {};
    resetConsentCache();
    jest.clearAllMocks();

    mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
      return memoryStore[key] ?? null;
    });
    mockSecureStore.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        memoryStore[key] = value;
      },
    );
    mockSecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
      delete memoryStore[key];
    });
  });

  it('returns null and status unknown when no consent has been stored', async () => {
    const consent = await getConsent();
    expect(consent).toBeNull();
  });

  it('saves granted consent with version 1 and ISO timestamp', async () => {
    const record = await setConsent(true);
    expect(record.granted).toBe(true);
    expect(record.version).toBe(1);
    expect(typeof record.at).toBe('string');
    expect(new Date(record.at).toString()).not.toBe('Invalid Date');

    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      LOCATION_CONSENT_KEY,
      JSON.stringify(record),
    );

    const retrieved = await getConsent();
    expect(retrieved).toEqual(record);
  });

  it('saves declined consent properly', async () => {
    const record = await setConsent(false);
    expect(record.granted).toBe(false);
    expect(record.version).toBe(1);

    const retrieved = await getConsent();
    expect(retrieved?.granted).toBe(false);
  });

  it('clears stored consent and resets to null', async () => {
    await setConsent(true);
    expect(await getConsent()).not.toBeNull();

    await clearConsent();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      LOCATION_CONSENT_KEY,
    );

    const retrieved = await getConsent();
    expect(retrieved).toBeNull();
  });

  it('handles corrupted JSON in secure store gracefully by falling back to null (unknown)', async () => {
    memoryStore[LOCATION_CONSENT_KEY] = '{ corrupted json string...';
    const retrieved = await getConsent();
    expect(retrieved).toBeNull();
  });

  it('handles invalid schema in secure store gracefully', async () => {
    // Missing version
    memoryStore[LOCATION_CONSENT_KEY] = JSON.stringify({
      granted: true,
      at: new Date().toISOString(),
    });
    expect(await getConsent()).toBeNull();

    // Wrong types
    memoryStore[LOCATION_CONSENT_KEY] = JSON.stringify({
      granted: 'yes',
      at: 12345,
      version: 1,
    });
    expect(await getConsent()).toBeNull();
  });

  it('tolerates secure store read exceptions and returns null', async () => {
    mockSecureStore.getItemAsync.mockRejectedValueOnce(
      new Error('Keystore corrupted'),
    );
    expect(await getConsent()).toBeNull();
  });

  it('tolerates secure store write/delete exceptions without crashing', async () => {
    mockSecureStore.setItemAsync.mockRejectedValueOnce(
      new Error('Write failed'),
    );
    const record = await setConsent(true);
    expect(record.granted).toBe(true);

    mockSecureStore.deleteItemAsync.mockRejectedValueOnce(
      new Error('Delete failed'),
    );
    await expect(clearConsent()).resolves.toBeUndefined();
  });
});

describe('useLocationConsent hook', () => {
  let memoryStore: Record<string, string> = {};

  beforeEach(() => {
    memoryStore = {};
    resetConsentCache();
    jest.clearAllMocks();

    mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
      return memoryStore[key] ?? null;
    });
    mockSecureStore.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        memoryStore[key] = value;
      },
    );
    mockSecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
      delete memoryStore[key];
    });
  });

  function TestComponent({
    onUpdate,
  }: {
    onUpdate: (state: ReturnType<typeof useLocationConsent>) => void;
  }) {
    const consent = useLocationConsent();
    React.useEffect(() => {
      onUpdate(consent);
    }, [consent, onUpdate]);
    return null;
  }

  it('synchronizes grant, decline, and revoke across hook instances', async () => {
    const states: {
      s1: ReturnType<typeof useLocationConsent> | null;
      s2: ReturnType<typeof useLocationConsent> | null;
    } = {
      s1: null,
      s2: null,
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(TestComponent, {
            onUpdate: s => {
              states.s1 = s;
            },
          }),
          React.createElement(TestComponent, {
            onUpdate: s => {
              states.s2 = s;
            },
          }),
        ),
      );
      await ensureInitialized();
    });

    expect(states.s1?.status).toBe('unknown');
    expect(states.s2?.status).toBe('unknown');

    // Grant
    await ReactTestRenderer.act(async () => {
      await states.s1?.grant();
    });
    expect(states.s1?.status).toBe('granted');
    expect(states.s2?.status).toBe('granted');
    expect(states.s1?.record?.granted).toBe(true);

    // Decline
    await ReactTestRenderer.act(async () => {
      await states.s2?.decline();
    });
    expect(states.s1?.status).toBe('declined');
    expect(states.s2?.status).toBe('declined');
    expect(states.s1?.record?.granted).toBe(false);

    // Revoke (clear)
    await ReactTestRenderer.act(async () => {
      await states.s1?.revoke();
    });
    expect(states.s1?.status).toBe('unknown');
    expect(states.s2?.status).toBe('unknown');
    expect(states.s1?.record).toBeNull();

    await ReactTestRenderer.act(async () => {
      renderer!.unmount();
    });
  });
});

describe('nextStepFor & permission flow logic', () => {
  it('maps granted permission to navigate', () => {
    expect(nextStepFor('granted')).toBe('navigate');
    expect(getExplanationForStep('navigate')).toBeNull();
  });

  it('maps denied permission to retry with explanation', () => {
    expect(nextStepFor('denied')).toBe('retry');
    const explanation = getExplanationForStep('retry');
    expect(explanation).toBeTruthy();
    expect(explanation).toContain('chưa cấp quyền');
  });

  it('maps blocked permission to settings with explanation', () => {
    expect(nextStepFor('blocked')).toBe('settings');
    const explanation = getExplanationForStep('settings');
    expect(explanation).toBeTruthy();
    expect(explanation).toContain('Cài đặt');
  });
});

describe('LocationConsentScreen (Screen 21)', () => {
  let memoryStore: Record<string, string> = {};

  beforeEach(() => {
    memoryStore = {};
    resetConsentCache();
    jest.clearAllMocks();
    mockRouteParams = undefined;

    mockSecureStore.getItemAsync.mockImplementation(async (key: string) => {
      return memoryStore[key] ?? null;
    });
    mockSecureStore.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        memoryStore[key] = value;
      },
    );
    mockSecureStore.deleteItemAsync.mockImplementation(async (key: string) => {
      delete memoryStore[key];
    });
  });

  function findByLabel(r: ReactTestRenderer.ReactTestRenderer, label: string) {
    return r.root.find(
      n => n.props.accessibilityLabel === label && n.props.onPress,
    );
  }

  it('renders screen elements: title, subtitle, and all 4 fact rows without icons', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const renderedTexts = renderer.root
      .findAllByType('Text' as never)
      .map(n => [n.props.children].flat().join(''));

    expect(renderedTexts).toContain('Chia sẻ vị trí trong buổi hẹn');
    expect(
      renderedTexts.some(t =>
        t.includes('Để hai bên tìm thấy nhau khi gặp trực tiếp'),
      ),
    ).toBe(true);

    // 4 explanation facts
    expect(renderedTexts).toContain('Chia sẻ gì');
    expect(renderedTexts).toContain('Với ai');
    expect(renderedTexts).toContain('Khi nào');
    expect(renderedTexts).toContain('Lưu ở đâu');

    // Values & explanations
    expect(
      renderedTexts.some(t =>
        t.includes('Block, vị trí trong campus, tầng ước lượng'),
      ),
    ).toBe(true);
    expect(renderedTexts.some(t => t.includes('Chỉ người trong buổi hẹn'))).toBe(
      true,
    );
    expect(
      renderedTexts.some(t =>
        t.includes('Từ giờ hẹn tới tối đa 15 phút sau'),
      ),
    ).toBe(true);
    expect(
      renderedTexts.some(t =>
        t.includes('Không lưu lên máy chủ OfficeHours'),
      ),
    ).toBe(true);
  });

  it('closes screen when close button (X) is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const closeBtn = findByLabel(renderer, 'Đóng');
    await ReactTestRenderer.act(async () => {
      closeBtn.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('declines consent and goes back when "Để sau" is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const declineBtn = findByLabel(renderer, 'Để sau');
    await ReactTestRenderer.act(async () => {
      await declineBtn.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
    const stored = await getConsent();
    expect(stored?.granted).toBe(false);
  });

  it('navigates to Help when "Đọc thêm về quyền riêng tư" is tapped', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const helpLink = findByLabel(renderer, 'Đọc thêm về quyền riêng tư');
    await ReactTestRenderer.act(async () => {
      helpLink.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Help');
  });

  it('grants consent and goes back when permission is granted', async () => {
    jest
      .spyOn(permissions, 'requestForegroundLocation')
      .mockResolvedValueOnce('granted');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const primaryBtn = findByLabel(renderer, 'Cho phép vị trí');
    await ReactTestRenderer.act(async () => {
      await primaryBtn.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
    const stored = await getConsent();
    expect(stored?.granted).toBe(true);
  });

  it('navigates to next route param when provided on granted permission', async () => {
    mockRouteParams = { next: 'LiveMeeting' };
    jest
      .spyOn(permissions, 'requestForegroundLocation')
      .mockResolvedValueOnce('granted');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const primaryBtn = findByLabel(renderer, 'Cho phép vị trí');
    await ReactTestRenderer.act(async () => {
      await primaryBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('LiveMeeting');
  });

  it('shows retry explanation and updates button to "Thử lại" on denied permission', async () => {
    const locSpy = jest
      .spyOn(permissions, 'requestForegroundLocation')
      .mockResolvedValueOnce('denied');

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const primaryBtn = findByLabel(renderer, 'Cho phép vị trí');
    await ReactTestRenderer.act(async () => {
      await primaryBtn.props.onPress();
    });

    const renderedTexts = renderer.root
      .findAllByType('Text' as never)
      .map(n => [n.props.children].flat().join(''));

    expect(
      renderedTexts.some(t => t.includes('chưa cấp quyền truy cập vị trí')),
    ).toBe(true);

    const retryBtn = findByLabel(renderer, 'Thử lại');
    expect(retryBtn).toBeDefined();

    locSpy.mockResolvedValueOnce('granted');
    await ReactTestRenderer.act(async () => {
      await retryBtn.props.onPress();
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows settings explanation and calls openSettings when permission is blocked', async () => {
    jest
      .spyOn(permissions, 'requestForegroundLocation')
      .mockResolvedValueOnce('blocked');
    const openSettingsSpy = jest
      .spyOn(permissions, 'openSettings')
      .mockResolvedValueOnce();

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<LocationConsentScreen />);
    });

    const primaryBtn = findByLabel(renderer, 'Cho phép vị trí');
    await ReactTestRenderer.act(async () => {
      await primaryBtn.props.onPress();
    });

    const renderedTexts = renderer.root
      .findAllByType('Text' as never)
      .map(n => [n.props.children].flat().join(''));

    expect(
      renderedTexts.some(t => t.includes('bị chặn trong Cài đặt hệ thống')),
    ).toBe(true);

    const settingsBtn = findByLabel(renderer, 'Mở Cài đặt');
    expect(settingsBtn).toBeDefined();

    await ReactTestRenderer.act(async () => {
      await settingsBtn.props.onPress();
    });

    expect(openSettingsSpy).toHaveBeenCalled();
  });
});
