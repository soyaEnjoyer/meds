import { createIsomorphicFn } from '@tanstack/react-start';

import { createLoggerServer } from '@/lib/logger/server';

export const createLogger = createIsomorphicFn()
  .server(createLoggerServer)
  .client((importMetaUrl: string, subName?: string) => {
    const name = `${importMetaUrl}${subName ? `:${subName}` : ''}`;

    function make(levelName: string) {
      const prefix = `[${levelName} ${name}]`;
      return (...args: unknown[]): void => {
        // oxlint-disable-next-line no-console
        console.log(prefix, ...args);
      };
    }

    return {
      debug: make('DEBUG'),
      error: make('ERROR'),
      info: make('INFO'),
      success: make('SUCCESS'),
      warn: make('WARN'),
    };
  });
