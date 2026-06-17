import { getTextStatusServer } from '@/functions.server/status.server-only';
import { envOrThrow, loadEnv } from '@/lib/env.server';
import { createLoggerServer } from '@/lib/logger/server';
import type { Unsubscribe } from '@/lib/messaging.server';
import { MessageClient } from '@/lib/messaging.server';

let unsubscribe: Unsubscribe | null = null;
const logger = createLoggerServer(import.meta.url);
const client = new MessageClient(import.meta.url);

function start(): void {
  loadEnv();

  // oxlint-disable init-declarations
  let webhookUrl: string;
  let webhookMethod: string;
  // oxlint-enable init-declarations
  try {
    webhookUrl = envOrThrow('WEBHOOK_URL');
    webhookMethod = envOrThrow('WEBHOOK_METHOD', 'POST');
  } catch (error) {
    logger.error(String(error));
    return;
  }

  let prevHash: string | null = null;

  async function send(): Promise<void> {
    const { hash, message, title } = await getTextStatusServer();
    if (hash === prevHash) return;
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        message,
        title,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: webhookMethod,
    });
    if (response.ok) {
      logger.debug('sent', title);
      prevHash = hash;
    } else logger.error('error sending to', webhookUrl, await response.text());
  }

  void send();
  unsubscribe = client.subscribe('invalidate', send);
}

function stop(): void {
  unsubscribe?.();
  unsubscribe = null;
}

export const worker = { start, stop };
