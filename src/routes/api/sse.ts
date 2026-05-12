import { randomUUID } from 'node:crypto';

import { createFileRoute } from '@tanstack/react-router';

import { getTextStatus } from '@/functions.server/status';
import { MINUTE_MS } from '@/lib/date';

const INTERVAL_MS = MINUTE_MS * 5;
const DEPLOYMENT_ID_LENGTH = 8;
// TODO: strip out if not using. also doing client-only notifications in <Notifier/> component, which is probably fine
const ENABLE_NOTIFICATIONS = false;

const deploymentId = randomUUID().slice(-DEPLOYMENT_ID_LENGTH);
const streamControllers = new Set<ReadableStreamDefaultController<unknown>>();

let timeout: NodeJS.Timeout | null = null;
let interval: NodeJS.Timeout | null = null;
let prevHash: string | null = null;

function stopNotifications() {
  if (timeout) clearTimeout(timeout);
  if (interval) clearInterval(interval);
  timeout = null;
  interval = null;
}

async function notify() {
  if (!streamControllers.size) stopNotifications();
  const { hash, message, title } = await getTextStatus();
  if (hash === prevHash) return;
  const chunk = `event: notification\ndata: ${JSON.stringify({ message, title })}\n\n`;
  for (const controller of streamControllers) controller.enqueue(chunk);
  prevHash = hash;
}

function startNotifications() {
  if (!ENABLE_NOTIFICATIONS) return;
  if (timeout) return;
  const now = Date.now();
  const next = now - (now % INTERVAL_MS) + INTERVAL_MS;
  timeout = setTimeout(() => {
    void notify();
    interval = setInterval(notify, INTERVAL_MS);
  }, next - now);
  void notify();
}

export const Route = createFileRoute('/api/sse')({
  server: {
    handlers: {
      GET: async () => {
        const abortController = new AbortController();
        return new Response(
          new ReadableStream({
            cancel: () => abortController.abort(),
            start: (streamController) => {
              streamControllers.add(streamController);
              abortController.signal.addEventListener('abort', () => streamControllers.delete(streamController));
              // first message fires the `open` event on the client
              streamController.enqueue(`event: connected\ndata: ${deploymentId}\n\n`);
              startNotifications();
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      },
    },
  },
});
