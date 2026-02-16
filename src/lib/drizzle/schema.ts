import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { ScheduleConfig } from '@/lib/schedule';

export const categoryTable = sqliteTable('category', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});

export const itemTable = sqliteTable('item', {
  id: integer().primaryKey({ autoIncrement: true }),
  categoryId: integer()
    .notNull()
    .references(() => categoryTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  name: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});

export const unitTable = sqliteTable('unit', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});

export const scheduleTable = sqliteTable('schedule', {
  id: integer().primaryKey({ autoIncrement: true }),
  itemId: integer()
    .notNull()
    .references(() => itemTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  config: text({ mode: 'json' }).notNull().$type<ScheduleConfig>(),
  amount: real().notNull(),
  unitId: integer().references(() => unitTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});

export const historyTable = sqliteTable('history', {
  id: integer().primaryKey({ autoIncrement: true }),
  itemId: integer()
    .notNull()
    .references(() => itemTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  scheduleId: integer().references(() => scheduleTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  amount: real().notNull(),
  unitId: integer().references(() => unitTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});

export const keyValTable = sqliteTable('keyVal', {
  key: text().primaryKey().notNull(),
  value: text({ mode: 'json' }),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' })
    .notNull()
    .$onUpdate(() => sql`(unixepoch())`),
});
