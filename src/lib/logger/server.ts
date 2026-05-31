// oxlint-disable import/no-nodejs-modules
import { relative } from 'node:path';
import { cwd } from 'node:process';
import { fileURLToPath } from 'node:url';

import { createServerOnlyFn } from '@tanstack/react-start';

import { AnsiStyle } from '@/lib/logger/common';

export const createLoggerServer = createServerOnlyFn((importMetaUrl: string, subName?: string) => {
  const name = `${relative(cwd(), fileURLToPath(importMetaUrl))}${subName ? `:${subName}` : ''}`;

  function make(colour: AnsiStyle, levelName: string) {
    const prefix = `[${colour}${levelName}${AnsiStyle.Reset} ${name}]`;
    return (...args: unknown[]): void => {
      // oxlint-disable-next-line no-console
      console.log(prefix, ...args);
    };
  }

  return {
    debug: make(AnsiStyle.Blue, 'DEBUG'),
    error: make(AnsiStyle.Red, 'ERROR'),
    info: make(AnsiStyle.Blue, 'INFO'),
    success: make(AnsiStyle.Green, 'SUCCESS'),
    warn: make(AnsiStyle.Yellow, 'WARN'),
  };
});
