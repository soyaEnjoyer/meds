import process from 'node:process';

import handler from '@tanstack/react-start/server-entry';

// https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point

// libsql doesn't like to shut down
for (const signal of ['SIGINT', 'SIGTERM'] satisfies NodeJS.Signals[]) {
  process.removeAllListeners(signal);
  process.addListener(signal, () => process.exit(0));
}

// export the default server unchanged
export default handler;
