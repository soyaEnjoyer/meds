import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cwd, env } from 'node:process';
import { parseEnv } from 'node:util';

const MAX_ENV_TRAVERSALS = 2;

// vite processes .env files in the project root, but nitro builds to a subdirectory
export function loadEnv(): void {
  let dirPath = cwd();
  for (let i = 0; i < MAX_ENV_TRAVERSALS; ++i) {
    const envPath = join(dirPath, '.env');
    if (existsSync(envPath)) {
      const parsed = parseEnv(readFileSync(envPath, { encoding: 'utf8' }));
      for (const [key, val] of Object.entries(parsed)) env[key] = val;
      return;
    }
    dirPath = dirname(dirPath);
  }
}

export function envOrThrow(key: string, fallback?: string): string {
  const value = env[key] ?? fallback;
  if (typeof value === 'undefined') throw new Error(`undefined env var: ${key}`);
  return value;
}
