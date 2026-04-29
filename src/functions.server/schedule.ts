import { createServerFn } from '@tanstack/react-start';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/drizzle/db.server';
import { historyTable, scheduleTable } from '@/lib/drizzle/schema';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import { scheduleInsertSchema, scheduleUpdateSchema } from '@/lib/drizzle/zod';

const MAX_SEARCH_ITERATIONS = 1000;

const doneSchema = z.array(
  z.object({
    amount: z.number().optional(),
    id: z.int(),
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

export const scheduleCreate = createServerFn()
  .inputValidator(scheduleInsertSchema)
  .handler(async ({ data }): Promise<ScheduleRow> => {
    const [result] = await db
      .insert(scheduleTable)
      .values(data)
      .onConflictDoUpdate({ set: { ...data, deletedAt: null }, target: scheduleTable.id })
      .returning();
    return result;
  });

export const scheduleUpdate = createServerFn()
  .inputValidator(scheduleUpdateSchema)
  .handler(async ({ data: { id, ...rest } }): Promise<ScheduleRow> => {
    const [result] = await db
      .update(scheduleTable)
      .set({ ...rest })
      .where(eq(scheduleTable.id, id))
      .returning();
    return result;
  });

export const scheduleDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(scheduleTable).set({ deletedAt: new Date() }).where(eq(scheduleTable.id, id));
  });

const scheduleAction = createServerFn()
  .inputValidator((data: { id: number; amount?: number | null }[]) => data)
  .handler(
    async ({ data: items }): Promise<ScheduleRow[]> =>
      await Promise.all(
        items.map(async ({ id: scheduleId, amount }) =>
          db.transaction(async (tx) => {
            const [{ categoryId, itemId, unitId, amount: scheduledAmount, dueAt: scheduledAt, ...schedule }] = await tx
              .select()
              .from(scheduleTable)
              .where(eq(scheduleTable.id, scheduleId));
            const [{ createdAt }] = await tx
              .insert(historyTable)
              .values({
                amount: amount === null ? null : (amount ?? scheduledAmount),
                categoryId,
                itemId,
                scheduleId,
                scheduledAmount,
                scheduledAt,
                unitId,
              })
              .returning();
            // FIXME: this is wildly inneficient
            function getNextDueAt(): Date | null {
              if (!scheduledAt) return null;
              const step = amount ? schedule.restDays + 1 : 1;
              const now = new Date();
              const nextDueAt = scheduledAt && scheduledAt > now ? new Date(scheduledAt) : now;
              nextDueAt.setHours(0, 0, 0, 0);

              for (let i = 0; i < MAX_SEARCH_ITERATIONS; ++i) {
                nextDueAt.setDate(nextDueAt.getDate() + step);
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

                nextDueAt.setHours(schedule.hour, schedule.minute, 0, 0);
                return nextDueAt;
              }
              throw new Error('could not find next dueAt');
            }
            const nextDueAt = getNextDueAt();
            console.log('scheduleAction', { amount, nextDueAt, scheduledAt });
            const [result] = await tx
              .update(scheduleTable)
              .set({
                dueAt: nextDueAt,
                ...(amount === null ? { skippedAt: createdAt } : { completedAt: createdAt, lastAmount: amount }),
              })
              .where(eq(scheduleTable.id, scheduleId))
              .returning();
            return result;
          })
        )
      )
  );

export const scheduleSetDone = createServerFn()
  .inputValidator(doneSchema)
  .handler(async ({ data }) => scheduleAction({ data }));

export const scheduleSetSkipped = createServerFn()
  .inputValidator(skipSchema)
  .handler(async ({ data }) => scheduleAction({ data }));
