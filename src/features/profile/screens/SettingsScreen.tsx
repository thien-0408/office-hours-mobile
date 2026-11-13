import { useAppSession } from '../../../navigation/devSession';
import {
  PlaceholderButton,
  PlaceholderScreen,
} from '../../../navigation/PlaceholderScreen';

export function SettingsScreen() {
  const { signOut } = useAppSession();
  return (
    <PlaceholderScreen
      screen="Settings"
      title="Cài đặt"
      links={['LocationConsent', 'Help']}
    >
      <PlaceholderButton label="Đăng xuất" onPress={signOut} />
    </PlaceholderScreen>
  );
}
