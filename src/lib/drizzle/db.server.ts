import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { env } from 'node:process';

// TODO: switch from libsql to node:sqlite when drizzle 1.0.0 is stable
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

// oxlint-disable-next-line import/no-namespace
import * as schema from './schema';

const url = env.DB_FILE_NAME ?? 'file:.local/data.db';
const dir = dirname(url.replace(/^file:/, ''));
await mkdir(dir, { recursive: true });
export const db = drizzle({ connection: { url }, schema });

if (!env.NO_MIGRATE) await migrate(db, { migrationsFolder: './drizzle' });

export const numberArrayMapper = {
  mapFromDriverValue(value: string): number[] {
    if (value === '[]') return [];
    return value.split(',').map(Number);
  },
};
