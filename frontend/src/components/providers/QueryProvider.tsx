import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider — wraps the app in TanStack Query's QueryClientProvider.
 * Must be mounted with client:load in Astro layouts so it only runs client-side.
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

