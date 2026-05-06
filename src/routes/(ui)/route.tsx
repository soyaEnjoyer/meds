import { TanStackDevtools } from '@tanstack/react-devtools';
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

import { CategoryDialog } from '@/components/dialogs/category';
import { ItemDialog } from '@/components/dialogs/item';
import { ScheduleDialog } from '@/components/dialogs/schedule';
import { UnitDialog } from '@/components/dialogs/unit';
import { Nav } from '@/components/nav';
import { SseReloader } from '@/components/sse-reloader';
import { categoryGet } from '@/functions.server/category';
import { itemGet } from '@/functions.server/item';
import { scheduleGet } from '@/functions.server/schedule';
import { unitGet } from '@/functions.server/unit';
import { DialogProvider } from '@/hooks/dialog';
import { FilterProvider } from '@/hooks/filter';

export const Route = createFileRoute('/(ui)')({
  component: UiLayout,
  loader: async () => {
    const [categories, items, schedules, units] = await Promise.all([
      categoryGet(),
      itemGet(),
      scheduleGet(),
      unitGet(),
    ]);
    // need to explicitly set queryClient data otherwise ssr will use stale data and cause a hydration error
    queryClient.setQueryData(['category'], categories);
    queryClient.setQueryData(['item'], items);
    queryClient.setQueryData(['schedule'], schedules);
    queryClient.setQueryData(['unit'], units);
    return { categories, items, schedules, units };
  },
  pendingComponent: Pending,
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
      throwOnError: (error, query) => {
        console.error('query error', query.queryKey, query, error);
        return false;
      },
    },
  },
});

function Pending() {
  return (
    <div className='flex h-dvh w-full flex-col items-center justify-center gap-4'>
      Loading
      <LoaderCircle className='size-12 animate-spin' />
    </div>
  );
}

const plugins: ComponentProps<typeof TanStackDevtools>['plugins'] = [
  formDevtoolsPlugin(),
  {
    name: 'Tanstack Query',
    render: <ReactQueryDevtoolsPanel />,
  },
  {
    name: 'Tanstack Router',
    render: <TanStackRouterDevtoolsPanel />,
  },
];

function UiLayout() {
  return (
    <DialogProvider>
      <QueryClientProvider client={queryClient}>
        <FilterProvider>
          <Nav />
          <main className='mx-auto mt-20 mb-2 max-w-2xl px-4'>
            <Outlet />
          </main>
          <CategoryDialog />
          <ItemDialog />
          <ScheduleDialog />
          <UnitDialog />
        </FilterProvider>
        <SseReloader />
        <TanStackDevtools plugins={plugins} />
      </QueryClientProvider>
    </DialogProvider>
  );
}
