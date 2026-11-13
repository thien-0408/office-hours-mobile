import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptWaitlistOffer,
  declineWaitlistOffer,
  getLecturerSlotWaitlist,
  getMyWaitlist,
  joinWaitlist,
  leaveWaitlist,
} from '../waitlist';
import { queryKeys } from './queryKeys';

export function useMyWaitlist() {
  return useQuery({
    queryKey: queryKeys.waitlist.mine,
    queryFn: getMyWaitlist,
  });
}

export function useLecturerSlotWaitlist() {
  return useQuery({
    queryKey: queryKeys.waitlist.lecturerQueues,
    queryFn: getLecturerSlotWaitlist,
  });
}

function useAfterWaitlistChange() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.waitlist.all });
    qc.invalidateQueries({ queryKey: ['lecturers', 'slots'] });
  };
}

export function useJoinWaitlist() {
  const after = useAfterWaitlistChange();
  return useMutation({
    mutationFn: (slotId: string) => joinWaitlist(slotId),
    onSuccess: after,
  });
}

export function useLeaveWaitlist() {
  const after = useAfterWaitlistChange();
  return useMutation({
    mutationFn: (entryId: string) => leaveWaitlist(entryId),
    onSuccess: after,
  });
}

export function useDeclineWaitlistOffer() {
  const after = useAfterWaitlistChange();
  return useMutation({
    mutationFn: (entryId: string) => declineWaitlistOffer(entryId),
    onSuccess: after,
  });
}

/** Accepting creates a CONFIRMED booking, so booking lists must refresh too. */
export function useAcceptWaitlistOffer() {
  const qc = useQueryClient();
  const after = useAfterWaitlistChange();
  return useMutation({
    mutationFn: (entryId: string) => acceptWaitlistOffer(entryId),
    onSuccess: booking => {
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking);
      qc.invalidateQueries({ queryKey: ['bookings', 'list'] });
      after();
    },
    // WAITLIST_OFFER_EXPIRED / transition errors: the entry state changed server-side.
    onError: after,
  });
}
