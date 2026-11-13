import { PlaceholderScreen } from '../../../navigation/PlaceholderScreen';

export function BookingListScreen() {
  return (
    <PlaceholderScreen
      screen="BookingList"
      title="Danh sách booking"
      links={['BookingDetail', 'Waitlist', 'Availability']}
    />
  );
}
