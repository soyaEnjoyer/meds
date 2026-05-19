import { randomUUID } from 'node:crypto';

import { createFileRoute } from '@tanstack/react-router';

import { getClientId } from '@/functions.server/client';
import { MessageClient } from '@/lib/messaging.server';

const DEPLOYMENT_ID_LENGTH = 8;

const deploymentId = randomUUID().slice(-DEPLOYMENT_ID_LENGTH);
const streamControllers = new Map<ReadableStreamDefaultController<unknown>, string>();
const client = new MessageClient(import.meta.url);

const unsubscribe = client.subscribe('invalidate', ({ source }) => {
  if (!streamControllers.size) return;
  const chunk = `event: invalidate\ndata: null\n\n`;
  for (const [controller, clientId] of streamControllers) {
    if (source !== clientId) controller.enqueue(chunk);
  }
});

export const Route = createFileRoute('/api/sse')({
  server: {
    handlers: {
      GET: async () => {
        const abortController = new AbortController();
        const clientId = await getClientId();
        return new Response(
          new ReadableStream({
            cancel: () => abortController.abort(),
            start: (streamController) => {
              streamControllers.set(streamController, clientId);
              abortController.signal.addEventListener('abort', () => streamControllers.delete(streamController));
              // first message fires the `open` event on the client
              streamController.enqueue(`event: connected\ndata: ${deploymentId}\n\n`);
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      },
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('sse hmr close streams');
    for (const [controller] of streamControllers) controller.close();
    unsubscribe();
  });
}
