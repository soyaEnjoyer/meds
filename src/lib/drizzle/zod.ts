import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { categoryTable, historyTable, itemTable, scheduleTable, unitTable } from '@/lib/drizzle/schema';

// Category
export const categorySchema = createSelectSchema(categoryTable);

export const categoryUpdateSchema = categorySchema.omit({
  createdAt: true,
  deletedAt: true,
  updatedAt: true,
});

export const categoryInsertSchema = categoryUpdateSchema.omit({
  id: true,
});

export type CategoryRow = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;

// Unit
export const unitSchema = createSelectSchema(unitTable);

export const unitUpdateSchema = unitSchema.omit({
  createdAt: true,
  deletedAt: true,
  updatedAt: true,
});

export const unitInsertSchema = unitUpdateSchema.omit({
  id: true,
});

export type UnitRow = z.infer<typeof unitSchema>;
export type UnitUpdate = z.infer<typeof unitUpdateSchema>;
export type UnitInsert = z.infer<typeof unitInsertSchema>;

// Item
export const itemSchema = createSelectSchema(itemTable);

export const itemUpdateSchema = itemSchema.omit({
  createdAt: true,
  deletedAt: true,
  updatedAt: true,
});

export const itemInsertSchema = itemUpdateSchema.omit({
  id: true,
});

export type ItemRow = z.infer<typeof itemSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
export type ItemInsert = z.infer<typeof itemInsertSchema>;

// Schedule
export const scheduleSchema = createSelectSchema(scheduleTable);

export const scheduleUpdateSchema = scheduleSchema.omit({
  completedAt: true,
  createdAt: true,
  deletedAt: true,
  lastAmount: true,
  skippedAt: true,
  updatedAt: true,
});

export const scheduleInsertSchema = scheduleUpdateSchema.omit({
  id: true,
});

export type ScheduleRow = z.infer<typeof scheduleSchema>;
export type ScheduleUpdate = z.infer<typeof scheduleUpdateSchema>;
export type ScheduleInsert = z.infer<typeof scheduleInsertSchema>;

// History
export const historySchema = createSelectSchema(historyTable);

export const historyUpdateSchema = historySchema.omit({
  categoryId: true,
  deletedAt: true,
  itemId: true,
  scheduleId: true,
  scheduledAmount: true,
  scheduledAt: true,
  unitId: true,
  updatedAt: true,
});

export type HistoryRow = z.infer<typeof historySchema>;
export type HistoryUpdate = z.infer<typeof historyUpdateSchema>;

// Derived
export type HistoryWithItemCatUnitRow = HistoryRow & { categoryName: string; itemName: string; unitName: string };
