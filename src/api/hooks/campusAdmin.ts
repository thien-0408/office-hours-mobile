import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { deactivateUser, getUser, listUsers, updateUser } from '../admin';
import { listCampusRooms } from '../campus';
import type {
  AdminUpdateUserPayload,
  AdminUserListQuery,
} from '../domainTypes';
import { DEFAULT_PAGE_SIZE, pageInfiniteOptions } from './pagination';
import { queryKeys } from './queryKeys';

/** Rooms change rarely: cache for an hour. */
export function useCampusRooms(buildingCode?: string) {
  return useQuery({
    queryKey: queryKeys.campusRooms(buildingCode),
    queryFn: () => listCampusRooms(buildingCode),
    staleTime: 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
  });
}

export function useAdminUsers(filters: Omit<AdminUserListQuery, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: ({ pageParam }) =>
      listUsers({ size: DEFAULT_PAGE_SIZE, ...filters, page: pageParam }),
    ...pageInfiniteOptions,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.user(id ?? ''),
    queryFn: () => getUser(id as string),
    enabled: !!id,
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; payload: AdminUpdateUserPayload }) =>
      updateUser(v.id, v.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });
}
