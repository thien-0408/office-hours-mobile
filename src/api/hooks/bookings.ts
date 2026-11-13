import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  createBooking,
  declineBooking,
  getBooking,
  getBookingTimeline,
  listBookings,
  markNoShow,
  rescheduleBooking,
  updateBookingMeetingUrl,
  updateMeetingRecord,
} from '../bookings';
import type {
  Booking,
  BookingListQuery,
  CreateBookingPayload,
  MeetingRecordPayload,
} from '../domainTypes';
import { DEFAULT_PAGE_SIZE, pageInfiniteOptions } from './pagination';
import { queryKeys } from './queryKeys';

export function useBookings(filters: Omit<BookingListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: ({ pageParam }) =>
      listBookings({ size: DEFAULT_PAGE_SIZE, ...filters, page: pageParam }),
    ...pageInfiniteOptions,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id ?? ''),
    queryFn: () => getBooking(id as string),
    enabled: !!id,
  });
}

export function useBookingTimeline(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookings.timeline(id ?? ''),
    queryFn: () => getBookingTimeline(id as string),
    enabled: !!id,
  });
}

/**
 * Shared by every booking mutation: write the returned booking into the detail cache, refresh
 * lists and the timeline. Slot-bearing views (lecturer slots, suggestions) and the waitlist can
 * change as a side effect (freed slots, waitlist offers), so those are invalidated too.
 */
function useAfterBookingChange() {
  const qc = useQueryClient();
  return (booking?: Booking) => {
    if (booking) {
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking);
      qc.invalidateQueries({
        queryKey: queryKeys.bookings.timeline(booking.id),
      });
    }
    qc.invalidateQueries({ queryKey: ['bookings', 'list'] });
    qc.invalidateQueries({ queryKey: ['lecturers', 'slots'] });
    qc.invalidateQueries({ queryKey: ['suggested-slots'] });
    qc.invalidateQueries({ queryKey: queryKeys.waitlist.all });
  };
}

export function useCreateBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (p: CreateBookingPayload) => createBooking(p),
    onSuccess: after,
  });
}

export function useCancelBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: after,
  });
}

export function useRescheduleBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (v: { id: string; newSlotId: string }) =>
      rescheduleBooking(v.id, v.newSlotId),
    onSuccess: after,
  });
}

export function useConfirmBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (id: string) => confirmBooking(id),
    onSuccess: after,
    // A losing confirm (SLOT_ALREADY_CONFIRMED) means the list is stale.
    onError: () => after(),
  });
}

export function useDeclineBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (v: { id: string; reason?: string }) =>
      declineBooking(v.id, v.reason),
    onSuccess: after,
  });
}

export function useUpdateBookingMeetingUrl() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (v: { id: string; meetingUrl: string | null }) =>
      updateBookingMeetingUrl(v.id, v.meetingUrl),
    onSuccess: after,
  });
}

export function useCompleteBooking() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (id: string) => completeBooking(id),
    onSuccess: after,
  });
}

export function useMarkNoShow() {
  const after = useAfterBookingChange();
  return useMutation({
    mutationFn: (id: string) => markNoShow(id),
    onSuccess: after,
  });
}

export function useUpdateMeetingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; record: MeetingRecordPayload }) =>
      updateMeetingRecord(v.id, v.record),
    onSuccess: (_rec, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(v.id) });
      qc.invalidateQueries({ queryKey: queryKeys.bookings.timeline(v.id) });
    },
  });
}
