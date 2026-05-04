import { useQuery } from '@tanstack/react-query';

import {
  useCategoriesMapQuery,
  useItemsMapQuery,
  useSchedulesQuery,
  useUnitsMapQuery,
} from '@/hooks/query/queries/base';
import { daysDiff, formatDatetimeIso } from '@/lib/date';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import type { MonthTuple, WeekdayTuple } from '@/lib/enums';
import { months, weekdays } from '@/lib/enums';

// oxlint-disable oxc/no-map-spread
const REPEAT_RULE_NAME_LENGTH = 2;

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
  dueAtIso: string;
  items: ScheduleRowWithNames[];
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
  if (restDays || cycleOffDays) {
    const cycleLength = cycleOnDays + cycleOffDays;
    const cycleDay = daysDiff(startAt, new Date()) % cycleLength;
    items.push(`${restDays + 1}d`);
    if (cycleOffDays) items.push(cycleOnDays, cycleOffDays, cycleDay);
  }
  if (dayMask < 127)
    items.push(
      weekdays
        .reduce<WeekdayTuple[][]>((acc, item) => {
          if (!(item[0] & dayMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 2) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_NAME_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_NAME_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_NAME_LENGTH)}`
        )
        .join(', ')
    );
  if (monthMask < 4095)
    items.push(
      months
        .reduce<MonthTuple[][]>((acc, item) => {
          if (!(item[0] & monthMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 2) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_NAME_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_NAME_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_NAME_LENGTH)}`
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

export function useSchedulesWithNamesQuery() {
  const schedulesQuery = useSchedulesQuery();
  const categoriesMapQuery = useCategoriesMapQuery();
  const itemsMapQuery = useItemsMapQuery();
  const unitsMapQuery = useUnitsMapQuery();
  const queryFn = () =>
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
    }) satisfies ScheduleRowWithNames[];
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: [
      'schedule',
      'with-names',
      {
        cat: categoriesMapQuery.dataUpdatedAt,
        item: itemsMapQuery.dataUpdatedAt,
        sch: schedulesQuery.dataUpdatedAt,
        unit: unitsMapQuery.dataUpdatedAt,
      },
    ],
  });
}

export function useScheduleGroupsQuery() {
  const schedulesWithNamesQuery = useSchedulesWithNamesQuery();
  const queryFn = () =>
    Object.entries(
      Object.groupBy(
        schedulesWithNamesQuery.data,
        (item) => `${formatDatetimeIso(item.dueAt) || 'Unscheduled'}.${item.categoryId}.${item.categoryName}`
      )
    )
      .filter((item): item is Required<typeof item> => Boolean(item[1]?.length))
      .map(([key, items]) => {
        const [dueAtIso, categoryIdStr, categoryName] = key.split('.');
        const categoryId = Number(categoryIdStr);
        return {
          categoryId,
          categoryName,
          dueAtIso,
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
        upd: schedulesWithNamesQuery.dataUpdatedAt,
      },
    ],
  });
}
