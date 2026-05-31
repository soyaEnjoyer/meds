import { MessageServer } from '@/lib/messaging.server';

let server: MessageServer | null = null;

function start(): void {
  if (server === null) server = new MessageServer();
}

function stop(): void {
  server?.stop();
}

export const worker = { start, stop };
