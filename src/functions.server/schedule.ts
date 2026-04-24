import { createServerFn } from '@tanstack/react-start';
import { desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/drizzle/db.server';
import { historyTable, scheduleTable } from '@/lib/drizzle/schema';
import type { ScheduleRow } from '@/lib/drizzle/zod';
import { scheduleInsertSchema, scheduleUpdateSchema } from '@/lib/drizzle/zod';

const doneSchema = z.object({
  amount: z.number(),
  id: z.int(),
});

export const scheduleGet = createServerFn().handler(
  async (): Promise<ScheduleRow[]> =>
    await db
      .select()
      .from(scheduleTable)
      .where(isNull(scheduleTable.deletedAt))
      .orderBy(desc(scheduleTable.enabled), scheduleTable.dueAt)
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
  .inputValidator((data: { id: number; amount: number | null }) => data)
  .handler(
    async ({ data: { amount, id: scheduleId } }): Promise<ScheduleRow> =>
      await db.transaction(async (tx) => {
        const [{ categoryId, itemId, unitId, amount: scheduledAmount, dueAt: scheduledAt, ...schedule }] = await tx
          .select()
          .from(scheduleTable)
          .where(eq(scheduleTable.id, scheduleId));
        const [{ createdAt }] = await tx
          .insert(historyTable)
          .values({
            amount,
            categoryId,
            itemId,
            scheduleId,
            scheduledAmount,
            scheduledAt,
            unitId,
          })
          .returning();
        console.log('todo: calculate next dueAt from', createdAt, schedule);
        const [result] = await tx
          .update(scheduleTable)
          .set({
            // TODO: calculate next dueAt. it's quite complicated because of all the variables
            dueAt: new Date(),
            ...(amount === null ? { skippedAt: createdAt } : { completedAt: createdAt, lastAmount: amount }),
          })
          .where(eq(scheduleTable.id, scheduleId))
          .returning();
        return result;
      })
  );

export const scheduleSetDone = createServerFn()
  .inputValidator(doneSchema)
  .handler(async ({ data }) => scheduleAction({ data }));

export const scheduleSetSkipped = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => scheduleAction({ data: { amount: null, id } }));
