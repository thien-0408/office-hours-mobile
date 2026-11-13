import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAvailabilityException,
  createAvailabilityRule,
  deleteAvailabilityException,
  deleteAvailabilityRule,
  getActiveSemester,
  listAvailabilityExceptions,
  listAvailabilityRules,
  updateAvailabilityRule,
} from '../availability';
import type {
  AvailabilityExceptionPayload,
  AvailabilityRulePatch,
  AvailabilityRulePayload,
} from '../domainTypes';
import { queryKeys } from './queryKeys';

export function useAvailabilityRules(
  lecturerId: string | undefined,
  semesterId?: string,
) {
  return useQuery({
    queryKey: queryKeys.availability.rules(lecturerId ?? '', semesterId),
    queryFn: () => listAvailabilityRules(lecturerId as string, semesterId),
    enabled: !!lecturerId,
  });
}

export function useAvailabilityExceptions(lecturerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.availability.exceptions(lecturerId ?? ''),
    queryFn: () => listAvailabilityExceptions(lecturerId as string),
    enabled: !!lecturerId,
  });
}

export function useActiveSemester() {
  return useQuery({
    queryKey: queryKeys.availability.activeSemester,
    queryFn: getActiveSemester,
    staleTime: 10 * 60_000,
  });
}

/** Rules/exceptions regenerate the lecturer's slots server-side. */
function useAfterAvailabilityChange() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.availability.all });
    qc.invalidateQueries({ queryKey: ['lecturers', 'slots'] });
  };
}

export function useCreateAvailabilityRule(lecturerId: string) {
  const after = useAfterAvailabilityChange();
  return useMutation({
    mutationFn: (p: AvailabilityRulePayload) =>
      createAvailabilityRule(lecturerId, p),
    onSuccess: after,
  });
}

export function useUpdateAvailabilityRule() {
  const after = useAfterAvailabilityChange();
  return useMutation({
    mutationFn: (v: { id: string; patch: AvailabilityRulePatch }) =>
      updateAvailabilityRule(v.id, v.patch),
    onSuccess: after,
  });
}

export function useDeleteAvailabilityRule() {
  const after = useAfterAvailabilityChange();
  return useMutation({
    mutationFn: (id: string) => deleteAvailabilityRule(id),
    onSuccess: after,
  });
}

export function useCreateAvailabilityException(lecturerId: string) {
  const after = useAfterAvailabilityChange();
  return useMutation({
    mutationFn: (p: AvailabilityExceptionPayload) =>
      createAvailabilityException(lecturerId, p),
    onSuccess: after,
  });
}

export function useDeleteAvailabilityException() {
  const after = useAfterAvailabilityChange();
  return useMutation({
    mutationFn: (id: string) => deleteAvailabilityException(id),
    onSuccess: after,
  });
}
