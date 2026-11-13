// Pure helpers for the lecturer search screen.

import type { Lecturer, LecturerListQuery } from '../../api/domainTypes';
import { dayName } from '../../api/time';

export const SEARCH_DEBOUNCE_MS = 300;

export type LecturerFilters = {
  q: string;
  department?: string;
  /** ISO 1..7. */
  dayOfWeek?: number;
  availableOnly: boolean;
};

export const EMPTY_FILTERS: LecturerFilters = {
  q: '',
  availableOnly: false,
};

/** Filters -> query object with only the set keys (stable React Query key). */
export function toLecturerQuery(
  f: LecturerFilters,
): Omit<LecturerListQuery, 'page'> {
  const q: Omit<LecturerListQuery, 'page'> = {};
  const text = f.q.trim();
  if (text) {
    q.q = text;
  }
  if (f.department) {
    q.department = f.department;
  }
  if (f.dayOfWeek) {
    q.dayOfWeek = f.dayOfWeek;
  }
  if (f.availableOnly) {
    q.availableOnly = true;
  }
  return q;
}

export function hasActiveFilters(f: LecturerFilters): boolean {
  return Object.keys(toLecturerQuery(f)).length > 0;
}

/** Day-of-week chips: Monday..Saturday. */
export const DAY_CHIPS = [1, 2, 3, 4, 5, 6].map(d => ({
  value: d,
  label: dayName(d),
}));

/**
 * Second line of a list row. The list DTO has no next-free-slot field, so this is the
 * department and the blurb; the free-slot grid lives on the detail screen.
 */
export function lecturerSubtitle(
  l: Pick<Lecturer, 'department' | 'blurb'>,
): string {
  return [l.department, l.blurb]
    .map(s => (s ?? '').trim())
    .filter(Boolean)
    .join(' · ');
}

/** Departments seen in loaded results (the API has no departments endpoint). */
export function departmentsOf(
  lecturers: readonly Pick<Lecturer, 'department'>[],
  keep: readonly (string | undefined)[] = [],
): string[] {
  const set = new Set<string>();
  for (const d of [...keep, ...lecturers.map(l => l.department)]) {
    if (d && d.trim()) {
      set.add(d.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}
