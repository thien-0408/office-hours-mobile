import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getLecturer,
  getLecturerSlots,
  getSuggestedSlots,
  listLecturers,
} from '../lecturers';
import type { LecturerListQuery, SuggestedCategory } from '../domainTypes';
import { DEFAULT_PAGE_SIZE, pageInfiniteOptions } from './pagination';
import { queryKeys } from './queryKeys';

/** Infinite lecturer directory. Filters are part of the key; `page` is managed by the hook. */
export function useLecturers(filters: Omit<LecturerListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.lecturers.list(filters),
    queryFn: ({ pageParam }) =>
      listLecturers({ size: DEFAULT_PAGE_SIZE, ...filters, page: pageParam }),
    ...pageInfiniteOptions,
  });
}

export function useLecturer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lecturers.detail(id ?? ''),
    queryFn: () => getLecturer(id as string),
    enabled: !!id,
  });
}

/** Slots of one lecturer for an ISO week ("YYYY-Www"); undefined week = current week. */
export function useLecturerSlots(
  lecturerId: string | undefined,
  week?: string,
) {
  return useQuery({
    queryKey: queryKeys.lecturers.slots(lecturerId ?? '', week),
    queryFn: () => getLecturerSlots(lecturerId as string, { week }),
    enabled: !!lecturerId,
    staleTime: 15_000, // availability changes as others book
  });
}

export function useSuggestedSlots(
  category: SuggestedCategory = 'ALL',
  limit = 6,
) {
  return useQuery({
    queryKey: queryKeys.suggestedSlots(category, limit),
    queryFn: () => getSuggestedSlots({ category, limit }),
  });
}
