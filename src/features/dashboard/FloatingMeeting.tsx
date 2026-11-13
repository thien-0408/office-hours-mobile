import { useEffect } from 'react';
import type { UserRole } from '../../api/types';
import { useLecturer } from '../../api/hooks';
import {
  isWithinJoinWindow,
  nextMeetingInWindow,
  nowCardSubtitle,
} from '../../api/bookingTime';
import { NowCard, setNowCardVisible } from '../../components/motion';
import { useNowTick, useUpcomingConfirmed } from './hooks';

export type FloatingMeetingProps = {
  role: UserRole;
  /** True on screens where the card must not show (campus map). */
  hidden?: boolean;
  onOpenBooking: (bookingId: string) => void;
  onOpenChat: (bookingId: string) => void;
  onOpenLive: (bookingId: string) => void;
};

/**
 * Floating "next meeting" card: the viewer's next CONFIRMED booking whose window
 * [start - 60 min, end] contains now. Re-evaluated every 30 s; bookings are re-fetched every
 * 60 s in the foreground (TODO(MO-20): Firestore realtime replaces this polling).
 * Mounted by RoleNavigator's tab bar, so it never shows over Chat / LiveMeeting (stack screens).
 */
export function FloatingMeeting({
  role,
  hidden,
  onOpenBooking,
  onOpenChat,
  onOpenLive,
}: FloatingMeetingProps) {
  const enabled = role === 'STUDENT' || role === 'LECTURER';
  const bookings = useUpcomingConfirmed(enabled);
  const now = useNowTick(30_000);
  const booking =
    enabled && !hidden ? nextMeetingInWindow(bookings.data ?? [], now) : null;
  // The booking DTO has no photo or room: students get both from the (cached) lecturer.
  const lecturer = useLecturer(
    role === 'STUDENT' ? booking?.lecturerId : undefined,
  );

  const visible = booking !== null;
  useEffect(() => {
    setNowCardVisible(visible);
    return () => setNowCardVisible(false);
  }, [visible]);

  if (!booking) {
    return null;
  }
  const student = role === 'STUDENT';
  const room = lecturer.data?.officeRoom;
  const roomText = student
    ? ((room?.code ?? '').trim() || room?.name.trim() || null)
    : null;

  return (
    <NowCard
      name={student ? booking.lecturerName : booking.studentName}
      subtitle={nowCardSubtitle(booking, roomText, now)}
      avatarUri={student ? lecturer.data?.photoUrl : null}
      avatarId={student ? booking.lecturerId : booking.studentId}
      onPress={() =>
        isWithinJoinWindow(booking)
          ? onOpenLive(booking.id)
          : onOpenBooking(booking.id)
      }
      onChat={() => onOpenChat(booking.id)}
    />
  );
}
