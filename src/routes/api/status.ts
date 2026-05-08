import { createFileRoute } from '@tanstack/react-router';

import { getTextStatus } from '@/functions.server/status';

export const Route = createFileRoute('/api/status')({
  server: {
    handlers: {
      GET: async () => Response.json(await getTextStatus()),
    },
  },
});
