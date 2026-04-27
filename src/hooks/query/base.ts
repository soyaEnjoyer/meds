import { useQuery } from '@tanstack/react-query';
import { useLoaderData } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';

import { categoryGet } from '@/functions.server/category';
import { itemGet } from '@/functions.server/item';
import { scheduleGet } from '@/functions.server/schedule';
import { unitGet } from '@/functions.server/unit';

// oxlint-disable oxc/no-map-spread

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
  });
}
