import process from 'node:process';

import handler from '@tanstack/react-start/server-entry';

import { worker as gotifyWorker } from '@/workers/gotify';
// https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point

const workers: { start: () => void; stop: () => void }[] = [gotifyWorker];
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

function startWorkers(): void {
  for (const worker of workers) worker.start();
}

function stopWorkers(): void {
  for (const worker of workers) worker.stop();
}

function shutdown(): void {
  stopWorkers();
  process.exit(0);
}

startWorkers();
for (const signal of signals) process.addListener(signal, shutdown);

// cleanup old instance during hmr in dev
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('server hmr stop workers');
    for (const signal of signals) process.removeListener(signal, shutdown);
    stopWorkers();
  });
}

// export the default server unchanged
export default handler;
