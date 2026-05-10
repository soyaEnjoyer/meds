import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, getTableColumns, isNull, like, sql } from 'drizzle-orm';
import { z } from 'zod';

import { scheduleGetOne } from '@/functions.server/schedule';
import { db, nullableDateMapper } from '@/lib/drizzle/db.server';
import { categoryTable, historyTable, itemTable, scheduleTable, unitTable } from '@/lib/drizzle/schema';
import {
  historyUpdateSchema,
  type HistoryRow,
  type HistoryWithItemCatUnitRow,
  type ScheduleRow,
} from '@/lib/drizzle/zod';

const pagerSchema = z.object({
  pageNum: z.int().min(0).default(0),
  pageSize: z.int().min(10).max(100).default(10),
});

const getScheduleSchema = pagerSchema.extend({
  scheduleId: z.int(),
});

const getAllSchema = pagerSchema.extend({
  search: z.string().default(''),
});

export const historyScheduleGet = createServerFn()
  .inputValidator(getScheduleSchema)
  .handler(
    async ({ data: { pageSize, pageNum, scheduleId } }): Promise<HistoryWithItemCatUnitRow[]> =>
      await db
        .select({
          ...getTableColumns(historyTable),
          categoryName: categoryTable.name,
          itemName: itemTable.name,
          unitName: unitTable.name,
        })
        .from(historyTable)
        .innerJoin(itemTable, eq(itemTable.id, historyTable.itemId))
        .innerJoin(categoryTable, eq(categoryTable.id, historyTable.categoryId))
        .innerJoin(unitTable, eq(unitTable.id, historyTable.unitId))
        .where(and(isNull(historyTable.deletedAt), eq(historyTable.scheduleId, scheduleId)))
        .orderBy(desc(historyTable.at))
        .limit(pageSize)
        .offset(pageSize * pageNum)
  );

export const historyGetOne = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<HistoryRow> => {
    const [result] = await db
      .select()
      .from(historyTable)
      .where(and(eq(historyTable.id, id), isNull(historyTable.deletedAt)));
    return result;
  });

export const historyAllGet = createServerFn()
  .inputValidator(getAllSchema)
  .handler(
    async ({ data: { pageSize, pageNum, search } }): Promise<HistoryWithItemCatUnitRow[]> =>
      await db
        .select({
          ...getTableColumns(historyTable),
          categoryName: categoryTable.name,
          itemName: itemTable.name,
          unitName: unitTable.name,
        })
        .from(historyTable)
        .innerJoin(itemTable, eq(itemTable.id, historyTable.itemId))
        .innerJoin(categoryTable, eq(categoryTable.id, historyTable.categoryId))
        .innerJoin(unitTable, eq(unitTable.id, historyTable.unitId))
        .where(
          and(
            isNull(historyTable.deletedAt),
            search ? like(itemTable.name, `%${search.replaceAll('%', String.raw`\%`)}%`) : undefined
          )
        )
        .orderBy(desc(historyTable.at))
        .limit(pageSize)
        .offset(pageSize * pageNum)
  );

export const historyDelete = createServerFn()
  .inputValidator((historyId: number) => historyId)
  .handler(async ({ data: historyId }): Promise<ScheduleRow> => {
    const data = await db.transaction(async (tx) => {
      const [{ scheduleId, scheduledAt: dueAt, at }] = await tx
        .update(historyTable)
        .set({ deletedAt: new Date() })
        .where(eq(historyTable.id, historyId))
        .returning();
      const [{ completedAt, skippedAt }] = await tx
        .select({
          completedAt: sql`max(${historyTable.at}) filter (where amount is not null)`.mapWith(nullableDateMapper),
          skippedAt: sql`max(${historyTable.at}) filter (where amount is null)`.mapWith(nullableDateMapper),
        })
        .from(historyTable)
        .where(and(eq(historyTable.scheduleId, scheduleId), isNull(historyTable.deletedAt)));
      const old = new Date(0);
      // revert dueAt if we deleted the latest history entry
      const isLatest = at > (completedAt ?? old) && at > (skippedAt ?? old);
      await tx
        .update(scheduleTable)
        .set({ completedAt, skippedAt, ...(isLatest ? { dueAt } : {}) })
        .where(eq(scheduleTable.id, scheduleId));
      return scheduleId;
    });
    return await scheduleGetOne({ data });
  });

export const historyUpdate = createServerFn()
  .inputValidator(historyUpdateSchema)
  .handler(async ({ data: { id, ...rest } }): Promise<ScheduleRow> => {
    const data = await db.transaction(async (tx) => {
      const [{ scheduleId }] = await tx
        .update(historyTable)
        .set({ ...rest })
        .where(eq(historyTable.id, id))
        .returning();
      const [{ completedAt, skippedAt }] = await tx
        .select({
          completedAt: sql`max(${historyTable.at}) filter (where amount is not null)`.mapWith(nullableDateMapper),
          skippedAt: sql`max(${historyTable.at}) filter (where amount is null)`.mapWith(nullableDateMapper),
        })
        .from(historyTable)
        .where(and(eq(historyTable.scheduleId, scheduleId), isNull(historyTable.deletedAt)));
      await tx.update(scheduleTable).set({ completedAt, skippedAt }).where(eq(scheduleTable.id, scheduleId));
      return scheduleId;
    });
    return await scheduleGetOne({ data });
  });
