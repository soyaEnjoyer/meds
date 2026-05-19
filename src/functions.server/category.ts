import { createServerFn } from '@tanstack/react-start';
import { eq, isNull } from 'drizzle-orm';

import { getClientId } from '@/functions.server/client';
import { db } from '@/lib/drizzle/db.server';
import { categoryTable } from '@/lib/drizzle/schema';
import type { CategoryRow } from '@/lib/drizzle/zod';
import { categoryInsertSchema, categoryUpdateSchema } from '@/lib/drizzle/zod';
import { MessageClient } from '@/lib/messaging.server';

const client = new MessageClient(import.meta.url);

export const categoryGet = createServerFn().handler(
  async (): Promise<CategoryRow[]> =>
    await db.select().from(categoryTable).where(isNull(categoryTable.deletedAt)).orderBy(categoryTable.name)
);

export const categoryCreate = createServerFn()
  .inputValidator(categoryInsertSchema)
  .handler(async ({ data: { name, ...rest } }): Promise<CategoryRow> => {
    const [result] = await db
      .insert(categoryTable)
      .values({ name, ...rest })
      .onConflictDoUpdate({ set: { ...rest, deletedAt: null }, target: categoryTable.name })
      .returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });
    return result;
  });

export const categoryUpdate = createServerFn()
  .inputValidator(categoryUpdateSchema)
  .handler(async ({ data: { id, ...rest } }): Promise<CategoryRow> => {
    const [result] = await db
      .update(categoryTable)
      .set({ ...rest })
      .where(eq(categoryTable.id, id))
      .returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });
    return result;
  });

export const categoryDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(categoryTable).set({ deletedAt: new Date() }).where(eq(categoryTable.id, id));
    client.send({ source: await getClientId(), topic: 'invalidate' });
  });
