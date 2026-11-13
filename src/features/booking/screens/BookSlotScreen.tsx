import { PlaceholderScreen } from '../../../navigation/PlaceholderScreen';

export function BookSlotScreen() {
  return (
    <PlaceholderScreen
      screen="BookSlot"
      title="Đặt lịch"
      links={['BookingDetail', 'Waitlist']}
    />
  );
}
