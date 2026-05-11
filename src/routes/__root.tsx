import { displayName } from '@root/package.json';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';

import { ThemedHtmlElement, ThemeProvider } from '@/hooks/theme';

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
    meta: [{ charSet: 'utf8' }, { content: 'width=device-width, initial-scale=1', name: 'viewport' }, { title }],
  }),
});

function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedHtmlElement>
        <head>
          <HeadContent
            // oxlint-disable-next-line react_perf/jsx-no-new-object-as-prop
            assetCrossOrigin={{
              modulepreload: 'anonymous',
              stylesheet: 'anonymous',
            }}
          />
        </head>
        <body className='@container min-h-dvh'>
          <Outlet />
          <Scripts />
        </body>
      </ThemedHtmlElement>
    </ThemeProvider>
  );
}
