import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { categoryTable, historyTable, itemTable } from '@/lib/drizzle/schema';

// Category
export const categorySchema = createSelectSchema(categoryTable);

export const categoryUpdateSchema = categorySchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const categoryInsertSchema = categoryUpdateSchema.omit({
  id: true,
});

export type CategoryRow = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;

// Item
export const itemSchema = createSelectSchema(itemTable);

export const itemUpdateSchema = itemSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const itemInsertSchema = itemUpdateSchema.omit({
  id: true,
});

export type ItemRow = z.infer<typeof itemSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
export type ItemInsert = z.infer<typeof itemInsertSchema>;

// History
export const historySchema = createSelectSchema(historyTable);

export const historyUpdateSchema = historySchema.omit({
  scheduleId: true,
  scheduledAmount: true,
  scheduledAt: true,
});

export type HistoryRow = z.infer<typeof historySchema>;
export type HistoryUpdate = z.infer<typeof historyUpdateSchema>;
