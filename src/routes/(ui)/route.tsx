import { TanStackDevtools } from '@tanstack/react-devtools';
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { LoaderCircle } from 'lucide-react';

import { HeadUpdater } from '@/components/head-updater';
import { Nav } from '@/components/nav';
import { ScrollTopButton } from '@/components/scroll-top-button';
import { SseClient } from '@/components/sse-client';
import { BasicFormDialog, MultimodeFormDialog } from '@/dialogs/form';
import { ScheduleHistoryDialog } from '@/dialogs/schedule-history';
import { ThemeDialog } from '@/dialogs/theme';
import { CategoryForm } from '@/forms/category';
import { DoneCustomForm } from '@/forms/done-custom';
import { HistoryForm } from '@/forms/history';
import { ItemForm } from '@/forms/item';
import { ScheduleForm } from '@/forms/schedule';
import { UnitForm } from '@/forms/unit';
import { categoryGet } from '@/functions.server/category';
import { itemGet } from '@/functions.server/item';
import { scheduleGet } from '@/functions.server/schedule';
import { getTextStatus } from '@/functions.server/status';
import { unitGet } from '@/functions.server/unit';
import { DialogProvider } from '@/hooks/dialog';
import { FilterProvider, ItemState } from '@/hooks/filter';
import { PagerProvider } from '@/hooks/pager';
import { ToastProvider } from '@/hooks/toast';

// oxlint-disable-next-line sort-keys tanstack router requires a specific order
export const Route = createFileRoute('/(ui)')({
  component: UiLayout,
  loader: async () => {
    const [categories, items, schedules, units, status] = await Promise.all([
      categoryGet(),
      itemGet(),
      scheduleGet(),
      unitGet(),
      getTextStatus(),
    ]);
    // need to explicitly set queryClient data otherwise ssr will use stale data and cause a hydration error
    queryClient.setQueryData(['category'], categories);
    queryClient.setQueryData(['item'], items);
    queryClient.setQueryData(['schedule'], schedules);
    queryClient.setQueryData(['status'], status);
    queryClient.setQueryData(['unit'], units);
    return { categories, items, schedules, status, units };
  },
  head: (ctx) => ({
    // this is for ssr and initial render. <HeadUpdater/> handles dynamic updates
    links: [
      { href: `icon/${ctx.loaderData?.status.due ? 'due' : 'default'}.png`, rel: 'icon', type: 'image/png' },
      { href: `icon/${ctx.loaderData?.status.due ? 'due' : 'default'}.webp`, rel: 'icon', type: 'image/webp' },
    ],
    meta: [
      { charSet: 'utf8' },
      { content: 'width=device-width, initial-scale=1', name: 'viewport' },
      { title: ctx.loaderData?.status.title },
    ],
  }),
  pendingComponent: Pending,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // these options are actually refetch on x **if stale** (i.e. they were inactive then were invalidated via sse)
      refetchOnMount: true,
      refetchOnReconnect: 'always',
      refetchOnWindowFocus: true,
      // don't mark stale unless key changes or manually invalidated (base queries have an override)
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

function UiLayout() {
  return (
    <ToastProvider>
      <DialogProvider>
        <PagerProvider>
          <QueryClientProvider client={queryClient}>
            <FilterProvider defaultState={ItemState.Scheduled}>
              <Nav />
              <main className='@container mx-auto mt-16 mb-2 max-w-2xl px-4 has-[.snap-y]:px-0'>
                <Outlet />
              </main>
              <MultimodeFormDialog dialogName='category' form={CategoryForm} />
              <MultimodeFormDialog dialogName='item' form={ItemForm} />
              <MultimodeFormDialog dialogName='unit' form={UnitForm} />
              <MultimodeFormDialog dialogName='schedule' form={ScheduleForm} className='xl:max-w-xl' />
              <BasicFormDialog dialogName='doneCustom' form={DoneCustomForm} />
              <BasicFormDialog dialogName='history' form={HistoryForm} />
              <ThemeDialog />
              <ScheduleHistoryDialog />
              <ScrollTopButton />
              <HeadUpdater />
            </FilterProvider>
            <SseClient />
            <TanStackDevtools
              // defining this anywhere else breaks the build
              // oxlint-disable-next-line react_perf/jsx-no-new-array-as-prop
              plugins={[
                formDevtoolsPlugin(),
                {
                  name: 'Tanstack Query',
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </QueryClientProvider>
        </PagerProvider>
      </DialogProvider>
    </ToastProvider>
  );
}
