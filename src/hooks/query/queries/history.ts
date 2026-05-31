import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';

import { historyAllGet, historyScheduleGet } from '@/functions.server/history';
import { useDialog } from '@/hooks/dialog';
import { useFilter } from '@/hooks/filter';
import { usePager } from '@/hooks/pager';
import { useSchedulesQuery } from '@/hooks/query/queries/base';

// oxlint-disable oxc/no-map-spread

export function useScheduleHistoryQuery() {
  const scheduleHistoryDialogState = useDialog((state) => state.scheduleHistory);
  const schedulesQuery = useSchedulesQuery();
  const pagerState = usePager((state) => state.scheduleHistory);
  const historyGetFn = useServerFn(historyScheduleGet);
  const scheduleAt = schedulesQuery.data.find((item) => item.id === scheduleHistoryDialogState.id)?.updatedAt.getTime();
  const showSkipped = Boolean(
    scheduleHistoryDialogState.meta &&
    'showSkipped' in scheduleHistoryDialogState.meta &&
    scheduleHistoryDialogState.meta.showSkipped
  );

  return useQuery({
    enabled: scheduleHistoryDialogState.id !== null && scheduleHistoryDialogState.open,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      historyGetFn({
        data: {
          ...pagerState,
          scheduleId: scheduleHistoryDialogState.id ?? -1,
          showSkipped,
        },
      }),
    queryKey: [
      'history',
      'item',
      {
        id: scheduleHistoryDialogState.id,
        scheduleAt,
        showSkipped,
        ...pagerState,
        historyGetFn,
      },
    ],
  });
}

export function useHistoryQuery() {
  const schedulesQuery = useSchedulesQuery();
  const search = useFilter((state) => state.search).toLocaleLowerCase();
  const pagerState = usePager((state) => state.history);
  const pathName = useRouterState({ select: (state) => state.location.pathname });
  const historyWithItemGetFn = useServerFn(historyAllGet);

  return useQuery({
    enabled: pathName === '/history',
    placeholderData: keepPreviousData,
    queryFn: async () => historyWithItemGetFn({ data: { ...pagerState, search } }),
    queryKey: [
      'history',
      {
        scheduleAt: schedulesQuery.dataUpdatedAt,
        search,
        ...pagerState,
        historyWithItemGetFn,
      },
    ],
  });
}
