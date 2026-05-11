import { useQuery } from '@tanstack/react-query';
import { useLoaderData } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';

import { categoryGet } from '@/functions.server/category';
import { itemGet } from '@/functions.server/item';
import { scheduleGet } from '@/functions.server/schedule';
import { unitGet } from '@/functions.server/unit';
import { HOUR_MS } from '@/lib/date';

// oxlint-disable oxc/no-map-spread

// base queries have a defined staleTime so that they'll periodically refetch
// all other queries are derived so use the default value of Infinity defined in `route.ts`
const staleTime = HOUR_MS;

//#region base
export function useCategoriesQuery() {
  const queryFn = useServerFn(categoryGet);
  const initialData = useLoaderData({
    from: '/(ui)',
    select: (match) => match.categories,
  });

  return useQuery({
    initialData,
    queryFn,
    queryKey: ['category'],
    staleTime,
  });
}

export function useItemsQuery() {
  const queryFn = useServerFn(itemGet);
  const initialData = useLoaderData({
    from: '/(ui)',
    select: (match) => match.items,
  });

  return useQuery({
    initialData,
    queryFn,
    queryKey: ['item'],
    staleTime,
  });
}

export function useSchedulesQuery() {
  const queryFn = useServerFn(scheduleGet);
  const initialData = useLoaderData({
    from: '/(ui)',
    select: (match) => match.schedules,
  });

  return useQuery({
    initialData,
    queryFn,
    queryKey: ['schedule'],
    staleTime,
  });
}

export function useUnitsQuery() {
  const queryFn = useServerFn(unitGet);
  const initialData = useLoaderData({
    from: '/(ui)',
    select: (match) => match.units,
  });

  return useQuery({
    initialData,
    queryFn,
    queryKey: ['unit'],
    staleTime,
  });
}
//#endregion

//#region maps
export function useCategoriesMapQuery() {
  const query = useCategoriesQuery();
  const queryFn = () => new Map(query.data.map((item) => [item.id, item]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['category', 'map', { at: query.dataUpdatedAt }],
  });
}

export function useItemsMapQuery() {
  const query = useItemsQuery();
  const queryFn = () => new Map(query.data.map((item) => [item.id, item]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['item', 'map', { at: query.dataUpdatedAt }],
  });
}

export function useSchedulesMapQuery() {
  const query = useSchedulesQuery();
  const queryFn = () => new Map(query.data.map((item) => [item.id, item]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['schedule', 'map', { at: query.dataUpdatedAt }],
  });
}

export function useUnitsMapQuery() {
  const query = useUnitsQuery();
  const queryFn = () => new Map(query.data.map((item) => [item.id, item]));
  // oxlint-disable-next-line tanstack-query/exhaustive-deps
  return useQuery({
    initialData: queryFn(),
    queryFn,
    queryKey: ['unit', 'map', { at: query.dataUpdatedAt }],
  });
}
//#endregion
