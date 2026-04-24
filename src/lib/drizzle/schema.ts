import { sql } from 'drizzle-orm';
import { sqliteTable, uniqueIndex, integer, text, real, index } from 'drizzle-orm/sqlite-core';

export const unitTable = sqliteTable(
  'unit',
  {
    createdAt: integer('created_at')
      .default(sql`(unixepoch())`)
      .notNull(),
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    unitName: text('unit_name').notNull(),
    updatedAt: integer('updated_at')
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex('unit_unit_name_unique').on(table.unitName)]
);

export const categoryTable = sqliteTable(
  'category',
  {
    categoryName: text('category_name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    hue: real().notNull(),
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex('category_category_name_unique').on(table.categoryName)]
);

export const itemTable = sqliteTable(
  'item',
  {
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    itemName: text('item_name').notNull(),
    stepSize: real('step_size').default(1).notNull(),
    sumTotal: integer('sum_total', { mode: 'boolean' }).default(true).notNull(),
    tags: text(),
    unitId: integer('unit_id')
      .notNull()
      .references(() => unitTable.id),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex('item_item_name_unit_id_unique').on(table.itemName, table.unitId)]
);

export const scheduleTable = sqliteTable(
  'schedule',
  {
    amount: real().default(1).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categoryTable.id),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    cycleOffDays: integer('cycle_off_days').default(0).notNull(),
    cycleOnDays: integer('cycle_on_days').default(0).notNull(),
    cycleTotalDaysGen: integer('cycle_total_days_gen').generatedAlwaysAs(sql`cycle_on_days+cycle_off_days`, {
      mode: 'virtual',
    }),
    dayMask: integer('day_mask').default(127).notNull(),
    dueAt: integer('due_at', { mode: 'timestamp' }),
    enabled: integer({ mode: 'boolean' }).default(true).notNull(),
    endAt: integer('end_at', { mode: 'timestamp' }),
    hour: integer().default(7).notNull(),
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    itemId: integer('item_id')
      .notNull()
      .references(() => itemTable.id),
    lastAmount: real('last_amount'),
    migratedId: integer('migrated_id'),
    minute: integer().default(0).notNull(),
    monthMask: integer('month_mask').default(4095).notNull(),
    repeatCount: integer('repeat_count').default(1).notNull(),
    restDays: integer('rest_days').default(0).notNull(),
    skippedAt: integer('skipped_at', { mode: 'timestamp' }),
    sort: integer().default(0).notNull(),
    startAt: integer('start_at', { mode: 'timestamp' })
      .default(sql`(unixepoch('now','start of day'))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex('schedule_migrated_id_unique').on(table.migratedId)]
);

export const historyTable = sqliteTable(
  'history',
  {
    amount: real(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    scheduleId: integer('schedule_id')
      .notNull()
      .references(() => scheduleTable.id),
    scheduledAmount: real('scheduled_amount'),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  },
  (table) => [index('schedule_id_created_at_ix').on(table.scheduleId, table.createdAt)]
);
