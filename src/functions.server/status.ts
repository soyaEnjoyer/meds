import { createServerFn } from '@tanstack/react-start';

import { getTextStatusServer } from '@/functions.server/status.server-only';

// this has to be in a different file otherwise the server and serverOnly fns get bundled together
export const getTextStatus = createServerFn().handler(getTextStatusServer);
