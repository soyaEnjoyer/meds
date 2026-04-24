import { createServerFn } from '@tanstack/react-start';
import { eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/drizzle/db.server';
import { unitTable } from '@/lib/drizzle/schema';
import type { UnitRow } from '@/lib/drizzle/zod';
import { unitInsertSchema, unitUpdateSchema } from '@/lib/drizzle/zod';

export const unitGet = createServerFn().handler(
  async (): Promise<UnitRow[]> =>
    await db.select().from(unitTable).where(isNull(unitTable.deletedAt)).orderBy(unitTable.name)
);

export const unitCreate = createServerFn()
  .inputValidator(unitInsertSchema)
  .handler(async ({ data: { name, ...rest } }): Promise<UnitRow> => {
    const [result] = await db
      .insert(unitTable)
      .values({ name, ...rest })
      .onConflictDoUpdate({ set: { ...rest, deletedAt: null }, target: unitTable.name })
      .returning();
    return result;
  });

export const unitUpdate = createServerFn()
  .inputValidator(unitUpdateSchema)
  .handler(async ({ data: { id, ...rest } }): Promise<UnitRow> => {
    const [result] = await db
      .update(unitTable)
      .set({ ...rest })
      .where(eq(unitTable.id, id))
      .returning();
    return result;
  });

export const unitDelete = createServerFn()
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }): Promise<void> => {
    await db.update(unitTable).set({ deletedAt: new Date() }).where(eq(unitTable.id, id));
  });
