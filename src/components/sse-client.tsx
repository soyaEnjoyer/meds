import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { createLogger } from '@/lib/logger/isomorphic';

export function SseClient() {
  const deploymentIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const [sseErrorAt, setSseErrorAt] = useState<Date | null>(null);
  const sseErrorCountRef = useRef(0);
  const logger = createLogger(import.meta.url);

  useEffect(() => {
    function invalidateQueries() {
      void queryClient.invalidateQueries({ refetchType: 'all', type: 'all' });
    }

    function triggerReconnect(reason: string) {
      setSseErrorAt((prev) => {
        logger.info('sse triggering reconnect', { count: sseErrorCountRef.current, prev, reason });
        ++sseErrorCountRef.current;
        return new Date();
      });
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const typedGlobalThis = globalThis as typeof globalThis & { eventSource: EventSource };
    const abortController = new AbortController();

    typedGlobalThis.eventSource = new EventSource('/api/sse');

    typedGlobalThis.eventSource.addEventListener('connected', (event) => {
      // reset error count on (re)?connect
      sseErrorCountRef.current = 0;
      const deploymentId: string = event.data;
      if (!deploymentIdRef.current) {
        logger.debug('sse connected', { deploymentId });
        deploymentIdRef.current = deploymentId;
      } else if (deploymentIdRef.current !== deploymentId) {
        logger.info('detected new deployment', deploymentIdRef.current, '->', deploymentId);
        typedGlobalThis.location.reload();
      } else {
        logger.info('sse reconnected', { deploymentId });
        invalidateQueries();
      }
    });

    typedGlobalThis.eventSource.addEventListener('invalidate', () => {
      logger.debug('sse invalidate');
      invalidateQueries();
    });

    typedGlobalThis.eventSource.addEventListener('error', () => {
      typedGlobalThis.eventSource.close();
      const delayMs = Math.min((sseErrorCountRef.current + 1) ** 2, 900) * 1000;
      logger.warn('sse error', { delayMs });
      const timeout = setTimeout(() => triggerReconnect('timeout'), delayMs);
      abortController.signal.addEventListener('abort', () => clearTimeout(timeout));
      document.addEventListener('visibilitychange', () => triggerReconnect('visibility'), {
        once: true,
        signal: abortController.signal,
      });
    });

    abortController.signal.addEventListener('abort', () => typedGlobalThis.eventSource.close());
    window.addEventListener('beforeunload', () => abortController.abort());

    return () => abortController.abort();
  }, [queryClient, sseErrorAt, logger]);

  return null;
}
