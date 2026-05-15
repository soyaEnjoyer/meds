import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import { eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { dateAdd, dateMax, dateSet, daysDiff } from '@/lib/date';
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

const rescheduleSchema = z.object({
  ids: z.array(z.int()),
  to: z.date(),
});

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
    function getNextDueAt(schedule: ScheduleRow, amount: number | null | undefined): Date | null {
      if (!schedule.dueAt) return null;

      const now = new Date();
      const nextDueAt =
        amount === null
          ? dateAdd(dateMax(schedule.dueAt, now), { day: 1 })
          : dateAdd(now, { day: schedule.restDays + 1 });
      nextDueAt.setHours(0, 0, 0, 0);

      // week starts on monday
      let weekDay = (nextDueAt.getDay() || 7) - 1;
      const cycleLength = schedule.cycleOnDays + schedule.cycleOffDays;
      console.log('scheduleAction getNextDueAt init', { amount, nextDueAt });
      let cycleDay = daysDiff(schedule.startAt, nextDueAt) % cycleLength;

      for (let i = 0; i < MAX_SEARCH_ITERATIONS; ++i) {
        if (i > 0) {
          nextDueAt.setDate(nextDueAt.getDate() + 1);
          cycleDay = (cycleDay + 1) % cycleLength;
          weekDay = (weekDay + 1) % 7;
        }
        console.log('scheduleAction getNextDueAt loop', {
          cycleDay,
          cycleLength,
          dueAt: schedule.dueAt,
          i,
          nextDueAt,
          weekDay,
        });

        // schedule has ended
        if (schedule.endAt && nextDueAt >= schedule.endAt) return null;

        // weekday not in mask
        if (((1 << weekDay) & schedule.dayMask) === 0) continue;

        // month not in mask
        if (((1 << nextDueAt.getMonth()) & schedule.monthMask) === 0) continue;

        // in `off` part of cycle (on is first)
        if (cycleDay >= schedule.cycleOnDays) continue;

        nextDueAt.setHours(schedule.time.hour, schedule.time.minute, 0, 0);
        console.log('scheduleAction getNextDueAt found:', nextDueAt, 'prev:', schedule.dueAt);
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
          const nextDueAt = getNextDueAt(schedule, amount);
          const [transactionResult] = await tx
            .update(scheduleTable)
            .set({
              dueAt: nextDueAt,
              ...(amount === null ? { skippedAt: at } : { completedAt: at, lastAmount: amount ?? schedule.amount }),
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

export const scheduleReschedule = createServerFn()
  .inputValidator(rescheduleSchema)
  .handler(
    async ({ data: { ids, to } }) =>
      await db.update(scheduleTable).set({ dueAt: to }).where(inArray(scheduleTable.id, ids)).returning()
  );
