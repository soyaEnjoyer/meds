import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { scheduleSetDone, scheduleSetDue, scheduleSetSkipped } from '@/functions.server/schedule';

const schema = z.object({
  ids: z.array(z.int()),
  method: z.enum(['due', 'skip', 'done']),
});

export const Route = createFileRoute('/api/action')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) return Response.json({ error: `invalid params: ${parsed.error.message}`, ok: false });
        const { ids, method } = parsed.data;
        const data = await (method === 'done'
          ? scheduleSetDone({ data: ids.map((id) => ({ id })) })
          : method === 'skip'
            ? scheduleSetSkipped({ data: { ids } })
            : method === 'due'
              ? scheduleSetDue({ data: { ids } })
              : // oxlint-disable-next-line promise/avoid-new
                new Promise<void>((resolve) => resolve()));
        if (!data) return Response.json({ error: `invalid method: ${method}`, ok: false }, { status: 400 });
        return Response.json({ data, ok: true });
      },
    },
  },
});
