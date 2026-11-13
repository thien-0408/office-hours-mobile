import type { InfiniteData } from '@tanstack/react-query';
import type { Page } from '../domainTypes';

/** Backend pagination is page-index based (0-based) with PageResponse; no cursors. */
export const DEFAULT_PAGE_SIZE = 20;

export const pageInfiniteOptions = {
  initialPageParam: 0,
  getNextPageParam: (last: Page<unknown>): number | undefined =>
    last.page + 1 < last.totalPages ? last.page + 1 : undefined,
};

/** Flattens loaded pages into one array. */
export function flattenPages<T>(
  data: InfiniteData<Page<T>, number> | undefined,
): T[] {
  return data ? data.pages.flatMap(p => p.content) : [];
}
