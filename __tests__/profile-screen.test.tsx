/**
 * @format
 */

import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileScreen } from '../src/features/profile/screens/ProfileScreen';

const mockSignOut = jest.fn(() => Promise.resolve());

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => true,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 'u1',
      email: 'sv@eiu.edu.vn',
      fullName: 'Phạm Ngọc Mai',
      role: 'STUDENT',
      department: null,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));

jest.mock('../src/features/auth/session', () => ({
  useSession: () => ({ reloadUser: jest.fn() }),
}));

jest.mock('../src/navigation/devSession', () => ({
  useAppSession: () => ({ role: 'STUDENT', signOut: mockSignOut }),
}));

jest.mock('../src/components/motion', () => {
  const { View } = require('react-native');
  return {
    BlurTarget: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Skeleton: () => null,
    useTabBarSpace: () => 0,
  };
});

describe('ProfileScreen sign-out row', () => {
  it('renders and signs out only after the alert is confirmed', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      r = ReactTestRenderer.create(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 360, height: 800 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <ProfileScreen />
        </SafeAreaProvider>,
      );
    });

    const row = r.root.find(
      n => n.props.testID === 'profile-sign-out' && !!n.props.onPress,
    );
    await act(() => {
      row.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] ?? [];
    const confirm = buttons.find(b => b.style === 'destructive');
    await act(() => {
      confirm?.onPress?.();
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });
});
