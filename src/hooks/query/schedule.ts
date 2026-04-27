import { useQuery } from '@tanstack/react-query';

import { useCategoriesQuery, useItemsQuery, useSchedulesQuery, useUnitsQuery } from '@/hooks/query/base';
import { formatDateIso } from '@/lib/date';

export function useScheduleGroupsQuery() {
  const categoriesQuery = useCategoriesQuery();
  const itemsQuery = useItemsQuery();
  const schedulesQuery = useSchedulesQuery();
  const unitsQuery = useUnitsQuery();

  const categoriesMap = new Map(categoriesQuery.data.map(({ id, name }) => [id, name]));
  const itemsMap = new Map(itemsQuery.data.map(({ id, name }) => [id, name]));
  const unitsMap = new Map(unitsQuery.data.map(({ id, name }) => [id, name]));

  return useQuery({
    queryFn: () =>
      Object.entries(
        Object.groupBy(
          schedulesQuery.data,
          (item) => `${formatDateIso(item.dueAt) || 'Unscheduled'}.${item.categoryId}`
        )
      )
        .filter((item): item is Required<typeof item> => !!item[1]?.length)
        .map(([key, items]) => {
          const [dueAtIso, categoryIdStr] = key.split('.');
          const categoryId = Number(categoryIdStr);
          return {
            key,
            categoryId,
            categoryName: categoriesMap.get(categoryId),
            dueAtIso,
            items: items!.map((schedule) => ({
              ...schedule,
              itemName: itemsMap.get(schedule.itemId),
              unitName: unitsMap.get(schedule.unitId),
            })),
          };
        }),
    queryKey: [
      'schedule-groups',
      {
        cat: categoriesQuery.dataUpdatedAt,
        item: itemsQuery.dataUpdatedAt,
        sched: schedulesQuery.dataUpdatedAt,
        unit: unitsQuery.dataUpdatedAt,
      },
    ],
  });
}
