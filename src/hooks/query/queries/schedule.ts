import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

import { ItemState, useFilter } from '@/hooks/filter';
import {
  useCategoriesMapQuery,
  useItemsMapQuery,
  useSchedulesQuery,
  useUnitsMapQuery,
} from '@/hooks/query/queries/base';
import { dateAdd, dateSet, formatDateIso, formatDatetimeIso, formatTimeIso, MINUTE_MS } from '@/lib/date';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import { weekdays } from '@/lib/enums';

// oxlint-disable oxc/no-map-spread
export interface ScheduleRowWithNames extends ScheduleRow {
  itemName: string | undefined;
  unitName: string | undefined;
  categoryName: string | undefined;
}

export interface ScheduleGroup {
  key: string;
  categoryId: number;
  categoryName: string;
  dueAtLabel: string;
  dueAtIso: string;
  dueAtTs: number;
  items: ScheduleRowWithNames[];
}

export function useFilteredScheduleGroupsQuery() {
  const schedulesQuery = useSchedulesQuery();
  const categoriesMapQuery = useCategoriesMapQuery();
  const itemsMapQuery = useItemsMapQuery();
  const unitsMapQuery = useUnitsMapQuery();
  const filterSearch = useFilter((state) => state.search).toLocaleLowerCase();
  const pathName = useRouterState({ select: (state) => state.location.pathname });
  const filterState = useFilter((state) => state.state);
  const now = new Date();
  const todayEnd = dateSet(now, { hour: 23, minute: 59, ms: 999, second: 59 });
  const in7dEnd = dateAdd(todayEnd, { day: 6 });
  const queryFn = () =>
    Object.entries(
      Object.groupBy(
        (
          schedulesQuery.data.map((schedule) => ({
            ...schedule,
            categoryName: categoriesMapQuery.data.get(schedule.categoryId)?.name,
            itemName: itemsMapQuery.data.get(schedule.itemId)?.name,
            unitName: unitsMapQuery.data.get(schedule.unitId)?.name,
          })) satisfies ScheduleRowWithNames[]
        )
          .filter(
            (schedule) =>
              (filterSearch === '' ||
                schedule.categoryName?.toLocaleLowerCase().includes(filterSearch) ||
                schedule.itemName?.toLocaleLowerCase().includes(filterSearch)) &&
              ((filterState === ItemState.Scheduled && schedule.dueAt) ||
                filterState === ItemState.All ||
                (filterState === ItemState.Due && schedule.dueAt && schedule.dueAt <= now) ||
                (filterState === ItemState.Unscheduled && !schedule.dueAt) ||
                (filterState === ItemState.AdHoc && schedule.adHoc) ||
                (filterState === ItemState.NotDue && schedule.dueAt && schedule.dueAt > now))
          )
          .toSorted(
            (a, b) =>
              (filterState === ItemState.AdHoc
                ? 0
                : (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity)) ||
              (a.categoryName ?? '').localeCompare(b.categoryName ?? '', undefined, { sensitivity: 'base' }) ||
              a.sort - b.sort ||
              (a.itemName ?? '').localeCompare(b.itemName ?? '', undefined, { sensitivity: 'base' })
          ),
        (item) =>
          `${
            filterState === ItemState.AdHoc
              ? 'Ad hoc'
              : item.dueAt === null
                ? 'Unscheduled'
                : item.dueAt < now
                  ? 'Due'
                  : item.dueAt < todayEnd
                    ? formatTimeIso(item.dueAt)
                    : item.dueAt < in7dEnd
                      ? `${weekdays[(item.dueAt.getDay() || 7) - 1][1].slice(0, 3)} ${formatTimeIso(item.dueAt)}`
                      : formatDateIso(item.dueAt)
          }|${item.categoryId}|${item.categoryName}`
      )
    )
      .filter(
        (item): item is [string, ScheduleRowWithNames[]] =>
          typeof item[1] !== 'undefined' && Array.isArray(item[1]) && item[1].length > 0
      )
      .map(([key, items]) => {
        const [dueAtLabel, categoryIdStr, categoryName] = key.split('|');
        const categoryId = Number(categoryIdStr);
        const dueAtTs = items.reduce((acc, item) => Math.min(acc, item.dueAt?.getTime() ?? Infinity), Infinity);
        const dueAtIso = dueAtTs === Infinity ? 'Unscheduled' : formatDatetimeIso(new Date(dueAtTs));
        return {
          categoryId,
          categoryName,
          dueAtIso,
          dueAtLabel,
          dueAtTs,
          items,
          key,
        };
      }) satisfies ScheduleGroup[];

  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    enabled: pathName === '/',
    gcTime: MINUTE_MS,
    initialData: queryFn(),
    queryFn,
    queryKey: [
      'schedule',
      'groups',
      {
        cat: categoriesMapQuery.dataUpdatedAt,
        item: itemsMapQuery.dataUpdatedAt,
        sch: schedulesQuery.dataUpdatedAt,
        search: filterSearch,
        state: filterState,
        unit: unitsMapQuery.dataUpdatedAt,
      },
    ],
    staleTime: ({ state }) => {
      // mark stale when the next schedule item is due, or never (infinity)
      // this will force a group key recalc
      const nowTs = now.getTime();
      const nextDueAtTs =
        state.data?.reduce((acc, item) => (item.dueAtTs > nowTs ? Math.min(item.dueAtTs, acc) : acc), Infinity) ??
        Infinity;
      // infinity - n === infinity
      return nextDueAtTs - nowTs;
    },
  });
}
