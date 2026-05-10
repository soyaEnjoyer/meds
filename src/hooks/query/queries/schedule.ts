import { useQuery } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';

import { ItemState, useFilter } from '@/hooks/filter';
import {
  useCategoriesMapQuery,
  useItemsMapQuery,
  useSchedulesQuery,
  useUnitsMapQuery,
} from '@/hooks/query/queries/base';
import { dateAdd, daysDiff, formatDateIso, formatTimeIso, MINUTE_MS } from '@/lib/date';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import type { MonthTuple, WeekdayTuple } from '@/lib/enums';
import { months, weekdays } from '@/lib/enums';

// oxlint-disable oxc/no-map-spread
const REPEAT_RULE_DAY_LENGTH = 2;
const REPEAT_RULE_MONTH_LENGTH = 3;

export type ScheduleRowWithNames = ReturnType<typeof useSchedulesQuery>['data'][number] & {
  itemName: string | undefined;
  unitName: string | undefined;
  categoryName: string | undefined;
  formattedRepeat: string;
  formattedAmount: string | null;
};

export interface ScheduleGroup {
  key: string;
  categoryId: number;
  categoryName: string;
  dueAtLabel: string;
  dueAtIso: string;
  items: ScheduleRowWithNames[];
  hue: number;
}

function formatRepeatRules({
  cycleOffDays,
  cycleOnDays,
  dayMask,
  dueAt,
  monthMask,
  restDays,
  startAt,
}: ScheduleRow): string {
  if (dueAt === null || dayMask === 0 || monthMask === 0) return 'Never';
  const items: (string | { toString: () => string })[] = [];
  if (restDays) items.push(`${restDays + 1}d`);
  if (cycleOffDays) {
    const cycleLength = cycleOnDays + cycleOffDays;
    const cycleDay = daysDiff(startAt, new Date()) % cycleLength;
    if (cycleOffDays) items.push(cycleOnDays, cycleOffDays, cycleDay);
  }
  if (dayMask < 127)
    items.push(
      weekdays
        .reduce<WeekdayTuple[][]>((acc, item) => {
          if (!(item[0] & dayMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 1) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_DAY_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_DAY_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_DAY_LENGTH)}`
        )
        .join(', ')
    );
  if (monthMask < 4095)
    items.push(
      months
        .reduce<MonthTuple[][]>((acc, item) => {
          if (!(item[0] & monthMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 1) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_MONTH_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_MONTH_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_MONTH_LENGTH)}`
        )
        .join(', ')
    );

  return items.length ? items.join('/') : 'Daily';
}

function formatAmount({ amount, lastAmount, unitName }: ScheduleRow & { unitName: string | undefined }): string | null {
  if (amount === 1 && (lastAmount ?? 1) === 1) return null;
  return [
    amount,
    ...((lastAmount ?? amount) === amount ? [] : [`(${lastAmount})`]),
    ...(unitName?.length ? [unitName] : []),
  ].join(' ');
}

export function useFilteredSchedulesWithNamesQuery() {
  const schedulesQuery = useSchedulesQuery();
  const categoriesMapQuery = useCategoriesMapQuery();
  const itemsMapQuery = useItemsMapQuery();
  const unitsMapQuery = useUnitsMapQuery();
  const filterState = useFilter((state) => state.state);
  const filterSearch = useFilter((state) => state.search).toLocaleLowerCase();
  const now = new Date();
  const pathName = useRouterState({ select: (state) => state.location.pathname });

  const queryFn = () =>
    (
      schedulesQuery.data.map((schedule) => {
        const unitName = unitsMapQuery.data.get(schedule.unitId)?.name;
        return {
          ...schedule,
          categoryName: categoriesMapQuery.data.get(schedule.categoryId)?.name,
          formattedAmount: formatAmount({ ...schedule, unitName }),
          formattedRepeat: formatRepeatRules(schedule),
          itemName: itemsMapQuery.data.get(schedule.itemId)?.name,
          unitName,
        };
      }) satisfies ScheduleRowWithNames[]
    ).filter(
      (schedule) =>
        (filterSearch === '' ||
          schedule.categoryName?.toLocaleLowerCase().includes(filterSearch) ||
          schedule.itemName?.toLocaleLowerCase().includes(filterSearch)) &&
        ((filterState === ItemState.Active && schedule.dueAt) ||
          filterState === ItemState.All ||
          (filterState === ItemState.Due && schedule.dueAt && schedule.dueAt <= now) ||
          (filterState === ItemState.Inactive && !schedule.dueAt) ||
          (filterState === ItemState.AdHoc && schedule.adHoc) ||
          (filterState === ItemState.NotDue && schedule.dueAt && schedule.dueAt > now))
    );
  return useQuery({
    enabled: pathName === '/',
    gcTime: MINUTE_MS,
    initialData: queryFn(),
    queryFn,
    queryKey: [
      'schedule',
      'with-names',
      {
        cat: categoriesMapQuery.dataUpdatedAt,
        item: itemsMapQuery.dataUpdatedAt,
        sch: schedulesQuery.dataUpdatedAt,
        search: filterSearch,
        state: filterState,
        unit: unitsMapQuery.dataUpdatedAt,
      },
    ],
  });
}

export function useFilteredScheduleGroupsQuery() {
  const schedulesWithNamesQuery = useFilteredSchedulesWithNamesQuery();
  const now = new Date();
  const in24H = dateAdd(now, { hour: 24, ms: -1 });
  const queryFn = () =>
    Object.entries(
      Object.groupBy(
        schedulesWithNamesQuery.data,
        (item) =>
          `${
            item.dueAt === null
              ? 'Unscheduled'
              : item.dueAt < now
                ? 'Due'
                : item.dueAt < in24H
                  ? formatTimeIso(item.dueAt)
                  : formatDateIso(item.dueAt)
          }.${formatDateIso(item.dueAt) || 'Unscheduled'}.${item.categoryId}.${item.categoryName}`
      )
    )
      .filter((item): item is Required<typeof item> => Boolean(item[1]?.length))
      .map(([key, items]) => {
        const [dueAtLabel, dueAtIso, categoryIdStr, categoryName] = key.split('.');
        const categoryId = Number(categoryIdStr);
        const hue =
          // oxlint-disable-next-line typescript/no-misused-spread
          [...categoryName]
            .map((char) => char.charCodeAt(0))
            .reduce((acc, item, i, arr) => acc + (item ^ (arr[(i + 3) % categoryName.length] * 3)), 0) % 360;
        return {
          categoryId,
          categoryName,
          dueAtIso,
          dueAtLabel,
          hue,
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion already filtered out undefined
          items: items as ScheduleRowWithNames[],
          key,
        };
      }) satisfies ScheduleGroup[];

  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: [
      'schedule',
      'groups',
      {
        at: schedulesWithNamesQuery.dataUpdatedAt,
      },
    ],
  });
}
