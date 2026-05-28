import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60_000,  // 24h — doit dépasser maxAge du persister
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'always', // navigator.onLine ne fonctionne pas en React Native
    },
    mutations: {
      networkMode: 'always',
    },
  },
});
