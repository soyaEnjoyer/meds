import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { dateAdd, dateSet } from '@/lib/date';
import { db } from '@/lib/drizzle/db.server';
import { historyTable, scheduleTable } from '@/lib/drizzle/schema';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import { scheduleInsertSchema, scheduleUpdateSchema } from '@/lib/drizzle/zod';

const MAX_SEARCH_ITERATIONS = 1000;

const doneSchema = z.array(
  z.object({
    amount: z.number().optional(),
    id: z.int(),
    unitId: z.int().optional(),
    update: z.boolean().optional(),
  })
);

const skipSchema = z
  .array(
    z.object({
      id: z.int(),
    })
  )
  .transform((value) => value.map(({ id }) => ({ amount: null, id })));

export const scheduleGet = createServerFn().handler(
  async (): Promise<ScheduleRow[]> =>
    await db
      .select()
      .from(scheduleTable)
      .where(isNull(scheduleTable.deletedAt))
      .orderBy(isNull(scheduleTable.dueAt), scheduleTable.dueAt)
);

export const scheduleGetOne = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<ScheduleRow> => {
    const [result] = await db.select().from(scheduleTable).where(eq(scheduleTable.id, id));
    return result;
  });

export const scheduleCreate = createServerFn()
  .inputValidator(scheduleInsertSchema)
  .handler(async ({ data: { dueAt: dueAtDate, ...rest } }): Promise<ScheduleRow> => {
    const dueAt = dueAtDate ? dateSet(dueAtDate, rest.time) : null;
    const [result] = await db
      .insert(scheduleTable)
      .values({ dueAt, ...rest })
      .onConflictDoUpdate({ set: { dueAt, ...rest, deletedAt: null }, target: scheduleTable.id })
      .returning();
    return result;
  });

export const scheduleUpdate = createServerFn()
  .inputValidator(scheduleUpdateSchema)
  .handler(async ({ data: { id, dueAt: dueAtDate, ...rest } }): Promise<ScheduleRow> => {
    const dueAt = dueAtDate ? dateSet(dueAtDate, rest.time) : null;
    const [result] = await db
      .update(scheduleTable)
      .set({ dueAt, ...rest })
      .where(eq(scheduleTable.id, id))
      .returning();
    return result;
  });

export const scheduleDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(scheduleTable).set({ deletedAt: new Date() }).where(eq(scheduleTable.id, id));
  });

const scheduleAction = createServerOnlyFn(
  async (data: { id: number; amount?: number | null; unitId?: number; update?: boolean }[]): Promise<ScheduleRow[]> => {
    /** @param amount undefined = scheduled amount, number = custom amount, null = skipped */
    // FIXME: needs optimisation
    function getNextDueAt(schedule: ScheduleRow, amount: number | null): Date | null {
      if (!schedule.dueAt) return null;
      const now = new Date();
      const intermediate = dateAdd(schedule.dueAt ?? now, {
        day: typeof amount === 'undefined' ? 1 : schedule.restDays + 1,
      });
      const tomorrow = dateAdd(now, { day: 1 });
      const nextDueAt = intermediate < tomorrow ? tomorrow : intermediate;
      // console.log('scheduleAction getNextDueAt init', { amount, intermediate, nextDueAt });
      nextDueAt.setHours(0, 0, 0, 0);

      for (let i = 0; i < MAX_SEARCH_ITERATIONS; ++i) {
        // console.log('scheduleAction getNextDueAt loop', { dueAt: schedule.dueAt, i, nextDueAt });
        if (i) nextDueAt.setDate(nextDueAt.getDate() + 1);
        if (schedule.endAt && nextDueAt >= schedule.endAt) return null;

        // convert from amerikkkan to normal
        const weekdayBit = 1 << ((nextDueAt.getDay() || 7) - 1);
        if ((weekdayBit & schedule.dayMask) !== weekdayBit) continue;

        const monthBit = 1 << nextDueAt.getMonth();
        if ((monthBit & schedule.monthMask) !== monthBit) continue;

        // cycle is n on, n off. startAt is a date with no time
        const cycleDay =
          Math.round((nextDueAt.getTime() - schedule.startAt.getTime()) / 86_400_000) %
          (schedule.cycleOnDays + schedule.cycleOffDays);
        if (cycleDay >= schedule.cycleOnDays) continue;

        nextDueAt.setHours(schedule.time.hour, schedule.time.minute, 0, 0);
        // console.log('scheduleAction getNextDueAt found:', nextDueAt, 'prev:', schedule.dueAt);
        return nextDueAt;
      }
      throw new Error('could not find next dueAt');
    }

    const result: ScheduleRow[] = [];
    for (const { id: scheduleId, amount, unitId, update } of data)
      result.push(
        // oxlint-disable-next-line no-await-in-loop sqlite does not support multiple simultaneous transactions
        await db.transaction(async (tx) => {
          const [schedule] = await tx.select().from(scheduleTable).where(eq(scheduleTable.id, scheduleId));
          const [{ at }] = await tx
            .insert(historyTable)
            .values({
              amount: amount === null ? null : (amount ?? schedule.amount),
              categoryId: schedule.categoryId,
              itemId: schedule.itemId,
              scheduleId,
              scheduledAmount: schedule.amount,
              scheduledAt: schedule.dueAt,
              unitId: unitId ?? schedule.unitId,
            })
            .returning();
          const nextDueAt = getNextDueAt(schedule, amount ?? null);
          const [transactionResult] = await tx
            .update(scheduleTable)
            .set({
              dueAt: nextDueAt,
              ...(amount === null ? { skippedAt: at } : { completedAt: at, lastAmount: amount }),
              ...(update ? { amount: amount ?? undefined, unitId } : {}),
            })
            .where(eq(scheduleTable.id, scheduleId))
            .returning();
          return transactionResult;
        })
      );
    return result;
  }
);

export const scheduleSetDone = createServerFn()
  .inputValidator(doneSchema)
  .handler(async ({ data }) => await scheduleAction(data));

export const scheduleSetSkipped = createServerFn()
  .inputValidator(skipSchema)
  .handler(async ({ data }) => await scheduleAction(data));
