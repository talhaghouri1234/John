import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: (count, error) => error.response?.status >= 500 && count < 1 } },
});
