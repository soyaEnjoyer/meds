import { randomUUID } from 'node:crypto';

import { createFileRoute } from '@tanstack/react-router';
const deploymentId = randomUUID();
const streamControllers = new Set<ReadableStreamDefaultController<unknown>>();

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
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream' } }
        );
      },
    },
  },
});
