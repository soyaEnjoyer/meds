// oxlint-disable import/no-nodejs-modules
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cwd, env } from 'node:process';
import { parseEnv } from 'node:util';

import { getTextStatus } from '@/functions.server/status';
import { HOUR_MS } from '@/lib/date';

const INTERVAL_MS = HOUR_MS / 4;
const MAX_ENV_TRAVERSALS = 2;

let timeout: NodeJS.Timeout | null = null;
let interval: NodeJS.Timeout | null = null;

// vite processes .env files in the project root, but nitro builds to a subdirectory
function loadEnv(): void {
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

function envOrThrow(key: string): string {
  const value = env[key];
  if (typeof value === 'undefined') throw new Error(`undefined env var: ${key}`);
  return value;
}

function start(): void {
  loadEnv();

  // oxlint-disable init-declarations
  let gotifyUrl: string;
  let token: string;
  let appUrl: string;
  // oxlint-enable init-declarations
  try {
    gotifyUrl = envOrThrow('GOTIFY_URL');
    token = envOrThrow('GOTIFY_APP_TOKEN');
    appUrl = envOrThrow('APP_URL');
  } catch (error) {
    console.error('gotify:', String(error));
    return;
  }

  let prevMessage: string | undefined = undefined;
  let prevTitle: string | undefined = undefined;

  async function send(): Promise<void> {
    const { message, title } = await getTextStatus();
    if (message === prevMessage && title === prevTitle) {
      console.debug('gotify: title and message are unchanged');
      return;
    }
    const response = await fetch(new URL('/message', gotifyUrl), {
      body: JSON.stringify({
        extras: {
          // 'client::display': {
          //   contentType: 'text/markdown',
          // },
          'client::notification': {
            click: {
              url: appUrl,
            },
          },
        },
        message,
        title,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Gotify-Key': token,
      },
      method: 'POST',
    });
    if (response.ok) {
      console.debug('gotify: sent', title);
      prevMessage = message;
      prevTitle = title;
    } else console.error('gotify: error sending', await response.text());
  }

  void send();
  const now = Date.now();
  const next = now - (now % INTERVAL_MS) + INTERVAL_MS;
  timeout = setTimeout(() => {
    void send();
    interval = setInterval(send, INTERVAL_MS);
  }, next - now);
}

function stop(): void {
  if (timeout) clearTimeout(timeout);
  if (interval) clearInterval(interval);
  timeout = null;
  interval = null;
}

export const worker = { start, stop };
