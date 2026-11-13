import { useQuery } from '@tanstack/react-query';
import { getSlot } from '../../../api/lecturers';

/** GET /slots/{id}. Not in src/api/hooks, so it lives with the slot UI. */
export function useSlot(id: string | undefined) {
  return useQuery({
    queryKey: ['slots', 'detail', id ?? ''] as const,
    queryFn: () => getSlot(id as string),
    enabled: !!id,
    staleTime: 10_000,
  });
}
