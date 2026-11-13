import { QueryClient } from '@tanstack/react-query';
import { ApiError, NetworkError } from './errors';

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    // 4xx is the caller's problem (401 already went through refresh); 5xx may be transient.
    return error.status >= 500 && failureCount < 2;
  }
  if (error instanceof NetworkError) {
    return failureCount < 2;
  }
  return false;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false, // not meaningful on RN
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
