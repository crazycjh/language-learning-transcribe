'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 資料在 5 分鐘內會被視為新鮮的，不會重新 fetch
            staleTime: 5 * 60 * 1000,
            // 快取資料保留 10 分鐘
            gcTime: 10 * 60 * 1000,
            // 當視窗重新聚焦時不自動重新 fetch
            refetchOnWindowFocus: false,
            // 失敗時重試 1 次
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
