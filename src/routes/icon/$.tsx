import { createFileRoute } from '@tanstack/react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';

import { AppIcon } from '@/components/app-icon';

// https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
// https://sharp.pixelplumbing.com/api-output/
// https://developer.mozilla.org/en-US/docs/Web/API/Response/Response

const formats = {
  jpeg: 'jpeg',
  jpg: 'jpeg',
  png: 'png',
  svg: 'svg',
  webp: 'webp',
} as const satisfies Record<string, keyof sharp.FormatEnum>;

type CacheKey = `${keyof sharp.FormatEnum}.${boolean}`;

const cache = new Map<CacheKey, ArrayBuffer>();

export const Route = createFileRoute('/icon/$')({
  server: {
    handlers: {
      /** `icon.{$kind}[.]{$ext}.ts` should work but does not get matched, so splat
       *
       * url: `/icon/[kind].[ext]`
       *  - kind: 'due'|string - parsed as boolean, determines whether badge is shown
       *  - ext: string - matched to keyof `format` with fallback
       */
      GET: async ({ params: { _splat: splat } }) => {
        const parts = (splat ?? '').split(/[.-]/);
        const ext = parts.pop()?.toLocaleLowerCase() ?? 'png';
        const due = parts.shift()?.toLocaleLowerCase() === 'due';
        // oxlint-disable-next-line eslint/no-unsafe-type-assertion
        const format = ext in formats ? formats[ext as keyof typeof formats] : formats.png;
        const cacheKey: CacheKey = `${format}.${due}`;
        let buffer = cache.get(cacheKey);
        if (!buffer) {
          const svg = renderToStaticMarkup(<AppIcon width='256px' height='256px' withBadge={due} opaque />);
          // oxlint-disable-next-line eslint/no-unsafe-type-assertion
          buffer = (
            format === 'svg'
              ? Buffer.from(svg)
              : (await sharp(Buffer.from(svg)).toFormat(format, { quality: 95 }).toBuffer()).buffer
          ) as ArrayBuffer;
          cache.set(cacheKey, buffer);
        }
        return new Response(buffer, { headers: { 'Content-Type': `image/${format}` } });
      },
    },
  },
});
