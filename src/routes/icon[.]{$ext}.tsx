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
  webp: 'webp',
} as const satisfies Record<string, keyof sharp.FormatEnum>;

const cache = new Map<keyof sharp.FormatEnum, ArrayBuffer>();

export const Route = createFileRoute('/icon.{$ext}')({
  server: {
    handlers: {
      GET: async ({ params: { ext } }) => {
        const lower = ext.toLocaleLowerCase();
        // oxlint-disable-next-line eslint/no-unsafe-type-assertion
        const format = lower in formats ? formats[lower as keyof typeof formats] : formats.png;
        let response = cache.get(format);
        if (!response) {
          const svg = renderToStaticMarkup(
            <AppIcon width='256px' height='256px' fill='#9810fa' stroke='#9810fa' backgroundFill='#f5f5f5' />
          );
          // oxlint-disable-next-line eslint/no-unsafe-type-assertion
          response = (await sharp(Buffer.from(svg)).toFormat(format, { quality: 95 }).toBuffer()).buffer as ArrayBuffer;
          cache.set(format, response);
        }
        return new Response(response, { headers: { 'Content-Type': `image/${format}` } });
      },
    },
  },
});
