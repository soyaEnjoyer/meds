import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';

import { categoryCreate, categoryDelete, categoryUpdate } from '@/functions.server/category';
import { historyDelete, historyUpdate } from '@/functions.server/history';
import { itemCreate, itemDelete, itemUpdate } from '@/functions.server/item';
import {
  scheduleCreate,
  scheduleDelete,
  scheduleReschedule,
  scheduleSetDone,
  scheduleSetSkipped,
  scheduleUpdate,
} from '@/functions.server/schedule';
import { unitCreate, unitDelete, unitUpdate } from '@/functions.server/unit';
import { useSchedulesMapQuery } from '@/hooks/query/queries/base';
import { useToast } from '@/hooks/toast';
import type { CategoryRow, ItemRow, ScheduleRow, UnitRow } from '@/lib/drizzle/zod';

const STATUS_TIMEOUT_THROTTLE_MS = 3000;
let statusTimeout: NodeJS.Timeout | null = null;

//#region schedule
async function updateScheduleQueryData(queryClient: QueryClient, ids: number[], updated: ScheduleRow[] | null) {
  await queryClient.setQueryData(['schedule'], (prev: ScheduleRow[]) =>
    [...prev.filter((item) => !ids.includes(item.id)), ...(updated ?? [])].toSorted(
      (a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity)
    )
  );
  statusTimeout ??= setTimeout(() => {
    void queryClient.invalidateQueries({ exact: false, queryKey: ['status'] });
    statusTimeout = null;
  }, STATUS_TIMEOUT_THROTTLE_MS);
}

export function useScheduleCreateMutator() {
  const mutationFn = useServerFn(scheduleCreate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateScheduleQueryData(queryClient, [data.id], [data]),
  });
}

export function useScheduleUpdateMutator() {
  const mutationFn = useServerFn(scheduleUpdate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateScheduleQueryData(queryClient, [data.id], [data]),
  });
}

export function useScheduleDeleteMutator() {
  const mutationFn = useServerFn(scheduleDelete);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (_data, vars) => updateScheduleQueryData(queryClient, [vars.data], null),
  });
}

export function useScheduleDoneMutator() {
  const mutationFn = useServerFn(scheduleSetDone);
  const queryClient = useQueryClient();
  const schedulesMapQuery = useSchedulesMapQuery();
  const showToast = useToast((state) => state.actions.show);

  // oxlint-disable-next-line sort-keys tanstack requires a specific order
  return useMutation({
    mutationFn,
    onMutate: async ({ data }) => {
      showToast('check');
      const previous = data
        .map(({ id }) => schedulesMapQuery.data.get(id))
        .filter((item) => typeof item !== 'undefined');
      await updateScheduleQueryData(
        queryClient,
        data.map(({ id }) => id),
        previous.map((item) => ({ ...item, dueAt: null }))
      );
      return previous;
    },
    onError: async (_error, { data }, prev: ScheduleRow[] | undefined) => {
      if (Array.isArray(prev))
        return await updateScheduleQueryData(
          queryClient,
          data.map(({ id }) => id),
          prev
        );
      // this can't actually happen - it exists to satisfy typescript since prev is typed as optional
      return await queryClient.invalidateQueries({ exact: true, queryKey: ['schedule'] });
    },
    onSuccess: async (data) =>
      updateScheduleQueryData(
        queryClient,
        data.map(({ id }) => id),
        data
      ),
  });
}

export function useScheduleSkipMutator() {
  const mutationFn = useServerFn(scheduleSetSkipped);
  const queryClient = useQueryClient();
  const schedulesMapQuery = useSchedulesMapQuery();
  const showToast = useToast((state) => state.actions.show);

  // oxlint-disable-next-line sort-keys tanstack requires a specific order
  return useMutation({
    mutationFn,
    onMutate: async ({ data }) => {
      showToast('x');
      const previous = data.ids
        .map((id) => schedulesMapQuery.data.get(id))
        .filter((item) => typeof item !== 'undefined');
      await updateScheduleQueryData(
        queryClient,
        data.ids.map((id) => id),
        previous.map((item) => ({ ...item, dueAt: null }))
      );
      return previous;
    },
    onError: async (_error, { data }, prev: ScheduleRow[] | undefined) => {
      if (Array.isArray(prev))
        return await updateScheduleQueryData(
          queryClient,
          data.ids.map((id) => id),
          prev
        );
      // this can't actually happen - it exists to satisfy typescript since prev is typed as optional
      return await queryClient.invalidateQueries({ exact: true, queryKey: ['schedule'] });
    },
    onSuccess: async (data) =>
      updateScheduleQueryData(
        queryClient,
        data.map(({ id }) => id),
        data
      ),
  });
}

export function useScheduleRescheduleMutator() {
  const mutationFn = useServerFn(scheduleReschedule);
  const queryClient = useQueryClient();
  const schedulesMapQuery = useSchedulesMapQuery();
  const showToast = useToast((state) => state.actions.show);

  // oxlint-disable-next-line sort-keys tanstack requires a specific order
  return useMutation({
    mutationFn,
    onMutate: async ({ data: { ids } }) => {
      showToast('clock');
      const previous = ids.map((id) => schedulesMapQuery.data.get(id)).filter((item) => typeof item !== 'undefined');
      await updateScheduleQueryData(
        queryClient,
        ids,
        previous.map((item) => ({ ...item, dueAt: null }))
      );
      return previous;
    },
    onError: async (_error, { data: { ids } }, prev: ScheduleRow[] | undefined) => {
      if (Array.isArray(prev)) return await updateScheduleQueryData(queryClient, ids, prev);
      // this can't actually happen - it exists to satisfy typescript since prev is typed as optional
      return await queryClient.invalidateQueries({ exact: true, queryKey: ['schedule'] });
    },
    onSuccess: async (data) =>
      updateScheduleQueryData(
        queryClient,
        data.map(({ id }) => id),
        data
      ),
  });
}
//#endregion

//#region category
async function updateCategoryQueryData(queryClient: QueryClient, id: number, updated: CategoryRow | null) {
  await queryClient.setQueryData(['category'], (prev: CategoryRow[]) =>
    [...prev.filter((item) => item.id !== id), ...(updated ? [updated] : [])].toSorted((a, b) =>
      a.name.localeCompare(b.name)
    )
  );
}

export function useCategoryCreateMutator() {
  const mutationFn = useServerFn(categoryCreate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateCategoryQueryData(queryClient, data.id, data),
  });
}

export function useCategoryUpdateMutator() {
  const mutationFn = useServerFn(categoryUpdate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateCategoryQueryData(queryClient, data.id, data),
  });
}

export function useCategoryDeleteMutator() {
  const mutationFn = useServerFn(categoryDelete);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (_data, vars) => updateCategoryQueryData(queryClient, vars.data, null),
  });
}
//#endregion

//#region item
async function updateItemQueryData(queryClient: QueryClient, id: number, updated: ItemRow | null) {
  await queryClient.setQueryData(['item'], (prev: ItemRow[]) =>
    [...prev.filter((item) => item.id !== id), ...(updated ? [updated] : [])].toSorted((a, b) =>
      a.name.localeCompare(b.name)
    )
  );
}

export function useItemCreateMutator() {
  const mutationFn = useServerFn(itemCreate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateItemQueryData(queryClient, data.id, data),
  });
}

export function useItemUpdateMutator() {
  const mutationFn = useServerFn(itemUpdate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateItemQueryData(queryClient, data.id, data),
  });
}

export function useItemDeleteMutator() {
  const mutationFn = useServerFn(itemDelete);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (_data, vars) => updateItemQueryData(queryClient, vars.data, null),
  });
}
//#endregion

//#region unit
async function updateUnitQueryData(queryClient: QueryClient, id: number, updated: UnitRow | null) {
  await queryClient.setQueryData(['unit'], (prev: UnitRow[]) =>
    [...prev.filter((item) => item.id !== id), ...(updated ? [updated] : [])].toSorted((a, b) =>
      a.name.localeCompare(b.name)
    )
  );
}

export function useUnitCreateMutator() {
  const mutationFn = useServerFn(unitCreate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateUnitQueryData(queryClient, data.id, data),
  });
}

export function useUnitUpdateMutator() {
  const mutationFn = useServerFn(unitUpdate);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => updateUnitQueryData(queryClient, data.id, data),
  });
}

export function useUnitDeleteMutator() {
  const mutationFn = useServerFn(unitDelete);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (_data, vars) => updateUnitQueryData(queryClient, vars.data, null),
  });
}
//#endregion

//#region history
export function useHistoryDeleteMutator() {
  // useScheduleHistoryQuery.updatedAt is part of the queryKey so we don't need to invalidate anything
  const queryClient = useQueryClient();
  const mutationFn = useServerFn(historyDelete);
  return useMutation({
    mutationFn,
    onSuccess: async (data) => await updateScheduleQueryData(queryClient, [data.id], [data]),
  });
}

export function useHistoryUpdateMutator() {
  // schedule.updatedAt is part of the queryKey so we don't need to invalidate anything
  const queryClient = useQueryClient();
  const mutationFn = useServerFn(historyUpdate);
  return useMutation({
    mutationFn,
    onSuccess: async (data) => await updateScheduleQueryData(queryClient, [data.id], [data]),
  });
}
//#endregion
