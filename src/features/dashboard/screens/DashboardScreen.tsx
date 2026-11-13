import { PlaceholderScreen } from '../../../navigation/PlaceholderScreen';

export function DashboardScreen() {
  return (
    <PlaceholderScreen
      screen="Dashboard"
      title="Dashboard realtime"
      links={[
        'Notifications',
        'LecturerSearch',
        'BookingList',
        'ReviewQueue',
        'BookingDetail',
        'Waitlist',
      ]}
    />
  );
}
