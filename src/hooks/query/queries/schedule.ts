import { useQuery } from '@tanstack/react-query';

import {
  useCategoriesMapQuery,
  useItemsMapQuery,
  useSchedulesQuery,
  useUnitsMapQuery,
} from '@/hooks/query/queries/base';
import { formatDatetimeIso } from '@/lib/date';

// oxlint-disable oxc/no-map-spread

export type ScheduleItem = ReturnType<typeof useSchedulesQuery>['data'][number] & {
  itemName: string | undefined;
  unitName: string | undefined;
  categoryName: string | undefined;
};

export interface ScheduleGroup {
  key: string;
  categoryId: number;
  categoryName: string;
  dueAtIso: string;
  items: ScheduleItem[];
}

export function useSchedulesWithNamesQuery() {
  const schedulesQuery = useSchedulesQuery();
  const categoriesMapQuery = useCategoriesMapQuery();
  const itemsMapQuery = useItemsMapQuery();
  const unitsMapQuery = useUnitsMapQuery();
  const queryFn = () =>
    schedulesQuery.data.map((schedule) => ({
      ...schedule,
      categoryName: categoriesMapQuery.data.get(schedule.categoryId)?.name,
      itemName: itemsMapQuery.data.get(schedule.itemId)?.name,
      unitName: unitsMapQuery.data.get(schedule.unitId)?.name,
    })) satisfies ScheduleItem[];
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
          items: items as ScheduleItem[],
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
