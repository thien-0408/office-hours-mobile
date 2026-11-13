import { ListRow, StatusPill } from '../../../components';
import type { Booking } from '../../../api/domainTypes';
import type { UserRole } from '../../../api/types';
import { bookingSubtitle, otherParty, STATUS_LABEL } from './bookingLogic';

/** `.rw`: other party photo 48 + name + "Thứ Tư 18/11 · 14:00 · Online" + StatusPill. */
export function BookingRow({
  booking,
  role,
  onPress,
  divider,
}: {
  booking: Booking;
  role: UserRole | null;
  onPress: () => void;
  divider?: boolean;
}) {
  const who = otherParty(booking, role);
  return (
    <ListRow
      title={who.name}
      subtitle={bookingSubtitle(booking)}
      // Booking DTO carries no photoUrl, so the avatar falls back to the memoji for this id.
      avatarId={who.id}
      trailing={
        <StatusPill
          status={booking.status}
          label={STATUS_LABEL[booking.status]}
        />
      }
      divider={divider}
      onPress={onPress}
    />
  );
}
