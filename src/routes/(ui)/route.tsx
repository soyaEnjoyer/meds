import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { SseReloader } from '@/components/sse-reloader';

export const Route = createFileRoute('/(ui)')({
  component: UiLayout,
  loader: async () => {
    const [categories, items] = [null, null];
    return { categories, items };
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // these options are actually refetch on x **if stale** (i.e. they were inactive then were invalidated via sse)
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      refetchOnWindowFocus: true,
      // don't mark stale after some timeout
      staleTime: Infinity,
      // make sure errors actually get logged
      throwOnError(error, query) {
        console.error('query error', query.queryKey, query, error);
        return false;
      },
    },
  },
});

function UiLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav />
      <main className='mx-auto mt-18 mb-2 max-w-2xl px-4'>
        <Outlet />
      </main>
      <SseReloader />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
