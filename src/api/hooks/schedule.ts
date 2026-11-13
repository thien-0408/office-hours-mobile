import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMyScheduleEntry,
  deleteScheduleEntry,
  importMySchedule,
  listMyScheduleEntries,
  listMyScheduleImports,
} from '../schedule';
import type {
  CreateScheduleEntryPayload,
  ScheduleBatchPayload,
} from '../domainTypes';
import { queryKeys } from './queryKeys';

export function useScheduleEntries() {
  return useQuery({
    queryKey: queryKeys.schedule.entries,
    queryFn: listMyScheduleEntries,
  });
}

export function useScheduleImports() {
  return useQuery({
    queryKey: queryKeys.schedule.imports,
    queryFn: listMyScheduleImports,
  });
}

/** Schedule changes alter which slots are conflict-free, so slot views refresh as well. */
function useAfterScheduleChange() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.schedule.all });
    qc.invalidateQueries({ queryKey: ['lecturers', 'slots'] });
    qc.invalidateQueries({ queryKey: ['suggested-slots'] });
  };
}

export function useAddScheduleEntry() {
  const after = useAfterScheduleChange();
  return useMutation({
    mutationFn: (p: CreateScheduleEntryPayload) => addMyScheduleEntry(p),
    onSuccess: after,
  });
}

export function useDeleteScheduleEntry() {
  const after = useAfterScheduleChange();
  return useMutation({
    mutationFn: (id: string) => deleteScheduleEntry(id),
    onSuccess: after,
  });
}

export function useImportSchedule() {
  const after = useAfterScheduleChange();
  return useMutation({
    mutationFn: (p: ScheduleBatchPayload) => importMySchedule(p),
    onSuccess: after,
  });
}
