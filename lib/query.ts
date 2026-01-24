// lib/query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately stale - always refetch
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't auto-refetch on focus (causing issues)
      refetchOnMount: true, // Refetch when component mounts
      retry: 1, // Only retry once on failure
    },
  },
});
