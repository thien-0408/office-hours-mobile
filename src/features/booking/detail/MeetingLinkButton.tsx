import { Alert, Linking } from 'react-native';
import { Button } from '../../../components';
import { GoogleCalendarLogo, ProviderLogo } from './BrandLogos';
import {
  googleCalendarUrl,
  meetingProvider,
  PROVIDER_BUTTON_LABEL,
} from './bookingLogic';
import type { Booking } from '../../../api/domainTypes';

async function open(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Không mở được liên kết', url);
  }
}

/** "Tham gia trên Zoom / Google Meet / Teams" chosen from the meetingUrl domain. */
export function MeetingLinkButton({ url }: { url: string }) {
  const provider = meetingProvider(url);
  if (!provider) {
    return null;
  }
  const label = PROVIDER_BUTTON_LABEL[provider];
  return (
    <Button
      title={label}
      leading={<ProviderLogo provider={provider} />}
      onPress={() => open(url)}
      accessibilityLabel={label}
    />
  );
}

/** "Thêm vào Google Calendar": opens the template URL, no backend call. */
export function AddToCalendarButton({ booking }: { booking: Booking }) {
  return (
    <Button
      variant="ghost"
      title="Thêm vào Google Calendar"
      leading={<GoogleCalendarLogo />}
      onPress={() => open(googleCalendarUrl(booking))}
      accessibilityLabel="Thêm vào Google Calendar"
    />
  );
}
