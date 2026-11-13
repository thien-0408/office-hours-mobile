import { useAppSession } from '../../../navigation/devSession';
import {
  PlaceholderButton,
  PlaceholderScreen,
} from '../../../navigation/PlaceholderScreen';

export function ProfileScreen() {
  const { signOut } = useAppSession();
  return (
    <PlaceholderScreen
      screen="Profile"
      title="Hồ sơ"
      links={['Settings', 'Help', 'MySchedule', 'Availability', 'ScheduleScan']}
    >
      <PlaceholderButton label="Đăng xuất" onPress={signOut} />
    </PlaceholderScreen>
  );
}
