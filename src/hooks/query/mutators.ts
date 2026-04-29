import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';

import { scheduleSetDone, scheduleSetSkipped } from '@/functions.server/schedule';
import type { ScheduleRow } from '@/lib/drizzle/zod';

async function updateScheduleQueryData(queryClient: QueryClient, ids: number[], updated: ScheduleRow[] | null) {
  await queryClient.setQueryData(['schedule'], (prev: ScheduleRow[]) =>
    [...prev.filter((item) => !ids.includes(item.id)), ...(updated ? updated : [])].toSorted(
      (a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity)
    )
  );
}

export function useScheduleDoneMutator() {
  const mutationFn = useServerFn(scheduleSetDone);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
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
  return useMutation({
    mutationFn,
    onSuccess: async (data) =>
      updateScheduleQueryData(
        queryClient,
        data.map(({ id }) => id),
        data
      ),
  });
}
