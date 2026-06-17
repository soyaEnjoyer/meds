import { getTextStatusServer } from '@/functions.server/status.server-only';
import { HOUR_MS } from '@/lib/date';
import { envOrThrow, loadEnv } from '@/lib/env.server';
import { createLoggerServer } from '@/lib/logger/server';

const INTERVAL_MS = HOUR_MS / 4;

let timeout: NodeJS.Timeout | null = null;
let interval: NodeJS.Timeout | null = null;
const logger = createLoggerServer(import.meta.url);

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
    logger.error(String(error));
    return;
  }

  let prevHash: string | null = null;

  async function send(): Promise<void> {
    const { hash, message, title } = await getTextStatusServer();
    if (hash === prevHash) return;
    const response = await fetch(new URL('/message', gotifyUrl), {
      body: JSON.stringify({
        extras: {
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
      logger.debug('sent', title);
      prevHash = hash;
    } else logger.error('error sending', await response.text());
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
