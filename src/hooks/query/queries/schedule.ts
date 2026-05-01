import { useQuery } from '@tanstack/react-query';

import {
  useCategoriesMapQuery,
  useItemsMapQuery,
  useSchedulesQuery,
  useUnitsMapQuery,
} from '@/hooks/query/queries/base';
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
            categoryName: categoriesMapQuery.data.get(categoryId)!.name,
            dueAtIso,
            // oxlint-disable-next-line typescript/no-non-null-assertion, oxc/no-map-spread
            items: items!.map((schedule) => ({
              ...schedule,
              // oxlint-disable-next-line typescript/no-non-null-assertion
              itemName: itemsMapQuery.data.get(schedule.itemId)!.name,
              // oxlint-disable-next-line typescript/no-non-null-assertion
              unitName: unitsMapQuery.data.get(schedule.unitId)!.name,
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
