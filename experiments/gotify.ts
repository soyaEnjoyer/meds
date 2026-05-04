#!/usr/bin/env -S node --experimental-transform-types
// oxlint-disable import/no-nodejs-modules

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { parseEnv } from 'node:util';

const envPath = join(cwd(), '.env');
const env = parseEnv(await readFile(envPath, { encoding: 'utf8' }));

function envOrThrow(key: string): string {
  const val = env[key];
  if (typeof val === 'undefined') throw new Error(`missing env var ${key}`);
  return val;
}

const baseUrl = envOrThrow('GOTIFY_URL');
const appToken = envOrThrow('GOTIFY_APP_TOKEN');
const clientToken = envOrThrow('GOTIFY_CLIENT_TOKEN');
const appUrl = envOrThrow('APP_URL');
console.log({ appToken, appUrl, baseUrl, clientToken });

function makeHeaders(kind: 'app' | 'client'): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Gotify-Key': kind === 'app' ? appToken : clientToken,
  };
}

const { id }: { id: number } = await fetch(new URL('/message', baseUrl), {
  body: JSON.stringify({
    extras: {
      'client::display': {
        contentType: 'text/markdown',
      },
      'client::notification': {
        click: {
          url: appUrl,
        },
      },
    },
    message: Array.from({ length: 5 }, (_, i) => `line ${i}`).join('  \n'),
    priority: 5,
    title: `Title ${Date.now()}`,
  }),
  headers: makeHeaders('app'),
  method: 'POST',
}).then(async (response) => response.json());
console.log('sent message', { id });

// deleting the individual message or all messages for the given application requires a hard refresh on the client to take effect and the notifications are not removed. it's not very useful
const deletedMessage = await fetch(new URL(`/message/${id}`, baseUrl), {
  headers: makeHeaders('client'),
  method: 'DELETE',
}).then(async (response) => response.text());
console.log(deletedMessage);

const applications: [{ id: number; name: string }] = await fetch(new URL('/application', baseUrl), {
  headers: makeHeaders('client'),
  method: 'GET',
}).then(async (response) => response.json());
console.log('applications', applications);

const application = applications.find((item) => item.name === 'Meds');
console.log(application);
if (!application) throw new Error('aaaa');

const deletedAppMessages = await fetch(new URL(`/application/${application.id}/message`, baseUrl), {
  headers: makeHeaders('client'),
  method: 'DELETE',
}).then(async (response) => response.text());
console.log('deleted app messages', deletedAppMessages);

// a sent message cannot be replaced or updated

// const replaced = await fetch(new URL('/message', baseUrl), {
//   body: JSON.stringify({
//     id,
//     message: 'Replaced message',
//     priority: 5,
//     title: 'Replaced title',
//   }),
//   headers: makeHeaders('client'),
//   method: 'POST',
// }).then(async (response) => response.json());
// console.log('replaced', replaced);
