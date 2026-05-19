import { randomUUID } from 'node:crypto';

import { name } from '@root/package.json';
import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';

import { DAY_MS } from '@/lib/date';

export const getClientId = createServerFn().handler(() => {
  const cookieName = `${name}.clientId`;
  const clientId = getCookie(cookieName) || randomUUID();
  setCookie(cookieName, clientId, { maxAge: DAY_MS * 365 });
  return clientId;
});
