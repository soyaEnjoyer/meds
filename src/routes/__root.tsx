import { displayName } from '@root/package.json';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { ComponentProps } from 'react';

import { ThemeProvider, useThemeResult } from '@/hooks/theme';
import { cn } from '@/lib/utils';

import appCss from '@/globals.css?url';

const title = `${import.meta.hot ? '[DEV] ' : ''}${displayName}`;

export const Route = createRootRoute({
  component: RootLayout,
  head: () => ({
    links: [
      { href: 'icon/default.png', rel: 'icon', type: 'image/png' },
      { href: 'icon/default.webp', rel: 'icon', type: 'image/webp' },
      { href: appCss, rel: 'stylesheet' },
    ],
    meta: [{ charSet: 'utf8' }, { content: 'width=device-width, initial-scale=1', name: 'viewport' }, { title }],
  }),
});

const headProps: ComponentProps<typeof HeadContent> = {
  assetCrossOrigin: {
    modulepreload: 'anonymous',
    stylesheet: 'anonymous',
  },
};

function RootLayoutThemed() {
  const { className, style } = useThemeResult();

  return (
    <html lang='en' style={style} suppressHydrationWarning>
      <head>
        <HeadContent {...headProps} />
      </head>
      <body className={cn('@container h-dvh overflow-y-auto', className)}>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutThemed />
    </ThemeProvider>
  );
}
