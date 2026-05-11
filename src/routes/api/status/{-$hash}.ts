// oxlint-disable unicorn/filename-case
import { createFileRoute } from '@tanstack/react-router';

import { getTextStatus } from '@/functions.server/status';

export const Route = createFileRoute('/api/status/{-$hash}')({
  server: {
    handlers: {
      GET: async ({ params: { hash: prevHash } }) => {
        const status = await getTextStatus();
        if (status.hash === prevHash) return new Response(null, { status: 204 });
        return Response.json(status);
      },
    },
  },
});
