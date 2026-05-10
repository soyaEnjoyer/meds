import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { categoryTable, historyTable, itemTable, scheduleTable, unitTable } from '@/lib/drizzle/schema';

// Category
export const categorySchema = createSelectSchema(categoryTable);

export const categoryUpdateSchema = categorySchema
  .omit({
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  })
  .extend({
    name: categorySchema.shape.name.min(1),
  });

export const categoryInsertSchema = categoryUpdateSchema.omit({
  id: true,
});

export type CategoryRow = z.infer<typeof categorySchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;

// Unit
export const unitSchema = createSelectSchema(unitTable);

export const unitUpdateSchema = unitSchema
  .omit({
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  })
  .extend({
    name: unitSchema.shape.name.min(1),
  });

export const unitInsertSchema = unitUpdateSchema.omit({
  id: true,
});

export type UnitRow = z.infer<typeof unitSchema>;
export type UnitUpdate = z.infer<typeof unitUpdateSchema>;
export type UnitInsert = z.infer<typeof unitInsertSchema>;

// Item
export const itemSchema = createSelectSchema(itemTable);

export const itemUpdateSchema = itemSchema
  .omit({
    createdAt: true,
    deletedAt: true,
    updatedAt: true,
  })
  .extend({
    name: itemSchema.shape.name.min(1),
  });

export const itemInsertSchema = itemUpdateSchema.omit({
  id: true,
});

export type ItemRow = z.infer<typeof itemSchema>;
export type ItemUpdate = z.infer<typeof itemUpdateSchema>;
export type ItemInsert = z.infer<typeof itemInsertSchema>;

// Schedule
export const scheduleSchema = createSelectSchema(scheduleTable);

export const scheduleUpdateSchema = scheduleSchema
  .omit({
    completedAt: true,
    createdAt: true,
    deletedAt: true,
    lastAmount: true,
    skippedAt: true,
    updatedAt: true,
  })
  .extend({
    cycleOffDays: scheduleSchema.shape.cycleOffDays.min(0).max(365),
    cycleOnDays: scheduleSchema.shape.cycleOnDays.min(1).max(365),
    restDays: scheduleSchema.shape.restDays.min(0).max(365),
    sort: scheduleSchema.shape.sort.min(0).max(99),
    time: z.object({ hour: z.int().min(0).max(23), minute: z.int().min(0).max(59) }),
  });

export const scheduleInsertSchema = scheduleUpdateSchema.omit({
  id: true,
});

export type ScheduleRow = z.infer<typeof scheduleSchema>;
export type ScheduleUpdate = z.infer<typeof scheduleUpdateSchema>;
export type ScheduleInsert = z.infer<typeof scheduleInsertSchema>;

// History
export const historySchema = createSelectSchema(historyTable);

export const historyUpdateSchema = historySchema
  .omit({
    categoryId: true,
    createdAt: true,
    deletedAt: true,
    itemId: true,
    scheduleId: true,
    scheduledAmount: true,
    scheduledAt: true,
    updatedAt: true,
  })
  .extend({
    amount: z
      .int()
      .min(0)
      .nullable()
      .transform((value) => value || null),
  });

export type HistoryRow = z.infer<typeof historySchema>;
export type HistoryUpdate = z.infer<typeof historyUpdateSchema>;

// Derived
export type HistoryWithItemCatUnitRow = HistoryRow & { categoryName: string; itemName: string; unitName: string };
