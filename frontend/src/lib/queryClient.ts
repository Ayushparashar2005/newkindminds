import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds (humanitarian data changes frequently)
      staleTime: 30 * 1000,
      // Retry failed queries up to 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Refetch on window focus so helpers get fresh request counts
      refetchOnWindowFocus: true,
      // Show cached data while refetching (keeps UI stable)
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      retry: 1,
    },
  },
});

