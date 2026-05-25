import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';
import { eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { getClientId } from '@/functions.server/client';
import { dateAdd, dateMax, dateSet, daysDiff } from '@/lib/date';
import { db } from '@/lib/drizzle/db.server';
import { historyTable, scheduleTable } from '@/lib/drizzle/schema';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import { scheduleInsertSchema, scheduleUpdateSchema } from '@/lib/drizzle/zod';
import { createLogger } from '@/lib/logger/isomorphic';
import { MessageClient } from '@/lib/messaging.server';

const MAX_SEARCH_ITERATIONS = 1000;
const MAX_OVERDUE_HOURS = 18;

const client = new MessageClient(import.meta.url);

const doneSchema = z.array(
  z.object({
    amount: z.number().optional(),
    id: z.int(),
    unitId: z.int().optional(),
    update: z.boolean().optional(),
  })
);

const rescheduleSchema = z.object({
  ids: z.array(z.int()),
  to: z.date(),
});

const dueSchema = z.object({
  ids: z.array(z.int()),
});

const skipSchema = dueSchema.transform(({ ids }) => ids.map((id) => ({ amount: null, id })));

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
    client.send({ source: await getClientId(), topic: 'invalidate' });
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
    client.send({ source: await getClientId(), topic: 'invalidate' });
    return result;
  });

export const scheduleDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(scheduleTable).set({ deletedAt: new Date() }).where(eq(scheduleTable.id, id));
    client.send({ source: await getClientId(), topic: 'invalidate' });
  });

const scheduleAction = createServerOnlyFn(
  async (data: { id: number; amount?: number | null; unitId?: number; update?: boolean }[]): Promise<ScheduleRow[]> => {
    const logger = createLogger(import.meta.url, 'scheduleAction');
    /** @param amount undefined = scheduled amount, number = custom amount, null = skipped */
    function getNextDueAt(schedule: ScheduleRow, amount: number | null | undefined): Date | null {
      if (!schedule.dueAt) return null;

      const now = new Date();
      const overdueAt = dateAdd(now, { hour: -MAX_OVERDUE_HOURS });
      const nextDueAt =
        amount === null
          ? dateAdd(overdueAt < schedule.dueAt ? overdueAt : dateMax(schedule.dueAt, now), { day: 1 })
          : dateAdd(overdueAt < schedule.dueAt ? overdueAt : now, { day: schedule.restDays + 1 });
      nextDueAt.setHours(0, 0, 0, 0);

      // week starts on monday
      let weekDay = (nextDueAt.getDay() || 7) - 1;
      const cycleLength = schedule.cycleOnDays + schedule.cycleOffDays;
      logger.debug('getNextDueAt init', { amount, nextDueAt });
      let cycleDay = daysDiff(schedule.startAt, nextDueAt) % cycleLength;

      for (let i = 0; i < MAX_SEARCH_ITERATIONS; ++i) {
        if (i > 0) {
          nextDueAt.setDate(nextDueAt.getDate() + 1);
          cycleDay = (cycleDay + 1) % cycleLength;
          weekDay = (weekDay + 1) % 7;
        }
        logger.debug('getNextDueAt loop', {
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
        logger.success('getNextDueAt found:', nextDueAt, 'prev:', schedule.dueAt);
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
    client.send({ source: await getClientId(), topic: 'invalidate' });
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
  .handler(async ({ data: { ids, to } }) => {
    const result = await db.update(scheduleTable).set({ dueAt: to }).where(inArray(scheduleTable.id, ids)).returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });
    return result;
  });

export const scheduleSetDue = createServerFn()
  .inputValidator(dueSchema)
  .handler(async ({ data: { ids } }) => {
    const result = await db
      .update(scheduleTable)
      .set({ dueAt: dateSet(new Date(), { minute: 0, ms: 0, second: 0 }) })
      .where(inArray(scheduleTable.id, ids))
      .returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });
    return result;
  });
