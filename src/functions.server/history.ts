import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, getTableColumns, isNotNull, isNull, like } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/drizzle/db.server';
import { categoryTable, historyTable, itemTable, unitTable } from '@/lib/drizzle/schema';
import type { HistoryRow, HistoryWithItemCatUnitRow } from '@/lib/drizzle/zod';

const pagerSchema = z.object({
  pageNum: z.int().min(0).default(0),
  pageSize: z.int().min(10).max(100).default(10),
});

const getSchema = pagerSchema.extend({
  scheduleId: z.int(),
});

const getWithItemSchema = pagerSchema.extend({
  search: z.string().default(''),
});

export const historyGet = createServerFn()
  .inputValidator(getSchema)
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
        .where(
          and(isNull(historyTable.deletedAt), isNotNull(historyTable.amount), eq(historyTable.scheduleId, scheduleId))
        )
        .orderBy(desc(historyTable.createdAt))
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

export const historyWithItemGet = createServerFn()
  .inputValidator(getWithItemSchema)
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
            isNotNull(historyTable.amount),
            search ? like(itemTable.name, `%${search.replaceAll('%', String.raw`\%`)}%`) : undefined
          )
        )
        .orderBy(desc(historyTable.createdAt))
        .limit(pageSize)
        .offset(pageSize * pageNum)
  );

// TODO: add update and delete fns when the schema is a bit more finalised
