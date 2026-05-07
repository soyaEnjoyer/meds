import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';

import { historyGet, historyWithItemGet } from '@/functions.server/history';
import { useDialog } from '@/hooks/dialog';
import { useFilter } from '@/hooks/filter';
import { usePager } from '@/hooks/pager';
import { useItemsQuery } from '@/hooks/query/queries/base';

// oxlint-disable oxc/no-map-spread

export function useScheduleHistoryQuery() {
  const scheduleHistoryDialogState = useDialog((state) => state.scheduleHistory);
  const itemsQuery = useItemsQuery();
  const pagerState = usePager((state) => state.scheduleHistory);
  const historyGetFn = useServerFn(historyGet);
  const itemUpdatedAt = itemsQuery.data.find((item) => item.id === scheduleHistoryDialogState.id)?.updatedAt.getTime();

  return useQuery({
    enabled: scheduleHistoryDialogState.id !== null && scheduleHistoryDialogState.open,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      historyGetFn({
        data: {
          ...pagerState,
          scheduleId: scheduleHistoryDialogState.id ?? -1,
        },
      }),
    queryKey: ['history', 'item', { id: scheduleHistoryDialogState.id, itemUpdatedAt, ...pagerState, historyGetFn }],
  });
}

export function useHistoryQuery() {
  const itemsQuery = useItemsQuery();
  const search = useFilter((state) => state.search).toLocaleLowerCase();
  const pagerState = usePager((state) => state.history);
  const pathName = useRouterState({ select: (state) => state.location.pathname });
  const historyWithItemGetFn = useServerFn(historyWithItemGet);

  return useQuery({
    enabled: pathName === '/history',
    placeholderData: keepPreviousData,
    queryFn: async () => historyWithItemGetFn({ data: { ...pagerState, search } }),
    queryKey: ['history', { item: itemsQuery.dataUpdatedAt, search, ...pagerState, historyWithItemGetFn }],
  });
}
