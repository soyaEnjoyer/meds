import { createServerFn } from '@tanstack/react-start';
import { eq, isNull } from 'drizzle-orm';

import { getClientId } from '@/functions.server/client';
import { db } from '@/lib/drizzle/db.server';
import { itemTable } from '@/lib/drizzle/schema';
import type { ItemRow } from '@/lib/drizzle/zod';
import { itemInsertSchema, itemUpdateSchema } from '@/lib/drizzle/zod';
import { MessageClient } from '@/lib/messaging.server';

const client = new MessageClient(import.meta.url);

export const itemGet = createServerFn().handler(
  async (): Promise<ItemRow[]> =>
    await db.select().from(itemTable).where(isNull(itemTable.deletedAt)).orderBy(itemTable.name)
);

export const itemCreate = createServerFn()
  .inputValidator(itemInsertSchema)
  .handler(async ({ data: { name, ...rest } }): Promise<ItemRow> => {
    const [result] = await db
      .insert(itemTable)
      .values({ name, ...rest })
      .onConflictDoUpdate({ set: { ...rest, deletedAt: null }, target: itemTable.name })
      .returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });

    return result;
  });

export const itemUpdate = createServerFn()
  .inputValidator(itemUpdateSchema)
  .handler(async ({ data: { id, ...rest } }): Promise<ItemRow> => {
    const [result] = await db
      .update(itemTable)
      .set({ ...rest })
      .where(eq(itemTable.id, id))
      .returning();
    client.send({ source: await getClientId(), topic: 'invalidate' });

    return result;
  });

export const itemDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(itemTable).set({ deletedAt: new Date() }).where(eq(itemTable.id, id));
    client.send({ source: await getClientId(), topic: 'invalidate' });
  });
