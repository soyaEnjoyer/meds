import { sql } from 'drizzle-orm';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// oxlint-disable eslint/sort-keys

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

export const scheduleTable = sqliteTable('schedule', {
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

  amount: real().notNull(),

  cycleOffDays: integer().notNull().default(0),
  cycleOnDays: integer().notNull().default(0),
  restDays: integer().notNull().default(0),
  repeatCount: integer().notNull().default(1),

  dayMask: integer().notNull().default(127),
  monthMask: integer().notNull().default(4095),
  hour: integer().notNull().default(7),
  minute: integer().notNull().default(0),

  startAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('now','start of day'))`),
  endAt: integer({ mode: 'timestamp_ms' }),

  enabled: integer({ mode: 'boolean' }).notNull().default(true),
  adHoc: integer({ mode: 'boolean' }).notNull().default(false),
  sort: integer().default(0).notNull(),

  dueAt: integer({ mode: 'timestamp_ms' }),
  completedAt: integer({ mode: 'timestamp_ms' }),
  skippedAt: integer({ mode: 'timestamp_ms' }),
  lastAmount: real(),

  createdAt: integer({ mode: 'timestamp_ms' })
    .default(sql`(unixepoch('subsec') * 1000)`)
    .notNull(),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .default(sql`(unixepoch('subsec') * 1000)`)
    .notNull(),
  deletedAt: integer({ mode: 'timestamp_ms' }),
});

export const historyTable = sqliteTable('history', {
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

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch('subsec') * 1000)`),
  deletedAt: integer({ mode: 'timestamp_ms' }),
});
