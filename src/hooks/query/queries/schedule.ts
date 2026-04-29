import { useQuery } from '@tanstack/react-query';

import { useCategoriesQuery, useItemsQuery, useSchedulesQuery, useUnitsQuery } from '@/hooks/query/queries/base';
import { formatDateIso } from '@/lib/date';

export type ScheduleItem = ReturnType<typeof useSchedulesQuery>['data'][number] & {
  itemName: string;
  unitName: string;
};

export interface ScheduleGroup {
  key: string;
  categoryId: number;
  categoryName: string;
  dueAtIso: string;
  items: ScheduleItem[];
}

function useCategoriesMapQuery() {
  const categoriesQuery = useCategoriesQuery();
  const queryFn = () => new Map(categoriesQuery.data.map(({ id, name }) => [id, name]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['category', 'map', { cat: categoriesQuery.dataUpdatedAt }],
  });
}

function useItemsMapQuery() {
  const itemsQuery = useItemsQuery();
  const queryFn = () => new Map(itemsQuery.data.map(({ id, name }) => [id, name]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['item', 'map', { cat: itemsQuery.dataUpdatedAt }],
  });
}

function useUnitsMapQuery() {
  const unitsQuery = useUnitsQuery();
  const queryFn = () => new Map(unitsQuery.data.map(({ id, name }) => [id, name]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['unit', 'map', { cat: unitsQuery.dataUpdatedAt }],
  });
}

export function useScheduleGroupsQuery() {
  const schedulesQuery = useSchedulesQuery();
  const categoriesMapQuery = useCategoriesMapQuery();
  const itemsMapQuery = useItemsMapQuery();
  const unitsMapQuery = useUnitsMapQuery();

  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    queryFn: () =>
      Object.entries(
        Object.groupBy(
          schedulesQuery.data,
          (item) => `${formatDateIso(item.dueAt) || 'Unscheduled'}.${item.categoryId}`
        )
      )
        .filter((item): item is Required<typeof item> => Boolean(item[1]?.length))
        .map(([key, items]) => {
          const [dueAtIso, categoryIdStr] = key.split('.');
          const categoryId = Number(categoryIdStr);
          return {
            categoryId,
            // oxlint-disable-next-line typescript/no-non-null-assertion
            categoryName: categoriesMapQuery.data.get(categoryId)!,
            dueAtIso,
            // oxlint-disable-next-line typescript/no-non-null-assertion, oxc/no-map-spread
            items: items!.map((schedule) => ({
              ...schedule,
              // oxlint-disable-next-line typescript/no-non-null-assertion
              itemName: itemsMapQuery.data.get(schedule.itemId)!,
              // oxlint-disable-next-line typescript/no-non-null-assertion
              unitName: unitsMapQuery.data.get(schedule.unitId)!,
            })),
            key,
          };
        }) satisfies ScheduleGroup[],
    queryKey: [
      'schedule-groups',
      {
        cat: categoriesMapQuery.dataUpdatedAt,
        item: itemsMapQuery.dataUpdatedAt,
        sched: schedulesQuery.dataUpdatedAt,
        unit: unitsMapQuery.dataUpdatedAt,
      },
    ],
  });
}
