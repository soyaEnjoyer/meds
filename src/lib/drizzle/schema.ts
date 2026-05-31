import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// oxlint-disable eslint/sort-keys

export interface Time {
  hour: number;
  minute: number;
}

export const categoryTable = sqliteTable('category', {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull().unique(),

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
  deletedAt: integer({ mode: 'timestamp_ms' }),
});

export const unitTable = sqliteTable('unit', {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull().unique(),

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
  deletedAt: integer({ mode: 'timestamp_ms' }),
});

export const itemTable = sqliteTable('item', {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  name: text().notNull().unique(),

  defaultCategoryId: integer()
    .notNull()
    .references(() => categoryTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  defaultUnitId: integer()
    .notNull()
    .references(() => unitTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  defaultAmount: real().notNull().default(1),

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
  deletedAt: integer({ mode: 'timestamp_ms' }),
});

export const scheduleTable = sqliteTable(
  'schedule',
  {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    categoryId: integer()
      .notNull()
      .references(() => categoryTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    itemId: integer()
      .notNull()
      .references(() => itemTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    unitId: integer()
      .notNull()
      .references(() => unitTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    amount: real(),
    description: text(),

    cycleOffDays: integer().notNull(),
    cycleOnDays: integer().notNull(),
    restDays: integer().notNull(),
    repeatCount: integer().notNull(),

    dayMask: integer().notNull(),
    monthMask: integer().notNull(),

    time: text({ mode: 'json' }).notNull().$type<Time>(),

    startAt: integer({ mode: 'timestamp_ms' }).notNull(),
    endAt: integer({ mode: 'timestamp_ms' }),

    adHoc: integer({ mode: 'boolean' }).notNull(),
    sort: integer().notNull(),

    dueAt: integer({ mode: 'timestamp_ms' }),
    completedAt: integer({ mode: 'timestamp_ms' }),
    skippedAt: integer({ mode: 'timestamp_ms' }),
    lastAmount: real(),

    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
    deletedAt: integer({ mode: 'timestamp_ms' }),
  },
  (table) => [uniqueIndex('scheduleUnique').on(table.categoryId, table.itemId, table.unitId, table.time)]
);

export const historyTable = sqliteTable(
  'history',
  {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    scheduleId: integer()
      .notNull()
      .references(() => scheduleTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    categoryId: integer()
      .notNull()
      .references(() => categoryTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    itemId: integer()
      .notNull()
      .references(() => itemTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    unitId: integer()
      .notNull()
      .references(() => unitTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    scheduledAt: integer({ mode: 'timestamp_ms' }),
    scheduledAmount: real(),

    amount: real(),
    at: integer({ mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),

    createdAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: integer({ mode: 'timestamp_ms' })
      .notNull()
      .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
    deletedAt: integer({ mode: 'timestamp_ms' }),
  },
  (table) => [
    index('ix_history_deletedAt').on(table.deletedAt),
    index('ix_history_scheduleId_deletedAt').on(table.scheduleId, table.deletedAt),
  ]
);
