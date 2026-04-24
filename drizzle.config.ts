import { env } from 'node:process';

import { defineConfig } from 'drizzle-kit';

const url = env.DB_FILE_NAME ?? 'file:.local/data.db';

export default defineConfig({
  dbCredentials: { url },
  dialect: 'sqlite',
  out: './drizzle',
  schema: './src/lib/drizzle.server/schema.ts',
});
