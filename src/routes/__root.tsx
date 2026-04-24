import { displayName } from '@root/package.json';
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';

import appCss from '@/globals.css?url';

// oxlint-disable node/no-process-env

const title =
  process.env.NODE_ENV === 'production'
    ? displayName
    : `[${process.env.NODE_ENV?.slice(0, 3).toLocaleUpperCase()}] ${displayName}`;

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    links: [
      { href: 'icon.png', rel: 'icon', type: 'image/png' },
      { href: 'icon.webp', rel: 'icon', type: 'image/webp' },
      { href: appCss, rel: 'stylesheet' },
    ],
    meta: [{ charSet: 'utf-8' }, { content: 'width=device-width, initial-scale=1', name: 'viewport' }, { title }],
  }),
});

function RootLayout() {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
