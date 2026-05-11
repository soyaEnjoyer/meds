import process from 'node:process';

import handler from '@tanstack/react-start/server-entry';

import { worker as gotifyWorker } from '@/workers/gotify';
// https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point

const workers: { start: () => void; stop: () => void }[] = [gotifyWorker];
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

function setWorkers(method: 'start' | 'stop'): void {
  for (const worker of workers) worker[method]();
}

function shutdown(): void {
  setWorkers('stop');
  process.exit(0);
}

function hmrCleanup(event: unknown): void {
  console.log('server hmr cleanup', event);
  for (const signal of signals) process.removeListener(signal, shutdown);
  setWorkers('stop');
}

setWorkers('start');
for (const signal of signals) process.addListener(signal, shutdown);

// cleanup old instance during hmr in dev
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', hmrCleanup);
  import.meta.hot.on('vite:beforePrune', hmrCleanup);
  import.meta.hot.on('vite:beforeUpdate', hmrCleanup);
}

// export the default server unchanged
export default handler;
