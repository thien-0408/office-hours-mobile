import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  departmentLabel,
  FALLBACK_DEPARTMENTS,
  listDepartments,
  type Department,
} from '../departments';

export const DEPARTMENTS_KEY = ['departments'] as const;

/** The department list; starts from the bundled fallback and refreshes from the API. */
export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: listDepartments,
    placeholderData: FALLBACK_DEPARTMENTS as Department[],
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

/** `code -> Vietnamese label` bound to the loaded list. */
export function useDepartmentLabel() {
  const { data } = useDepartments();
  const list = data ?? FALLBACK_DEPARTMENTS;
  return useCallback(
    (code: string | null | undefined) => departmentLabel(code, list),
    [list],
  );
}
