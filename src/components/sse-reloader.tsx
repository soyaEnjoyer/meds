import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useRef } from 'react';

export function SseReloader() {
  const deploymentId = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const invalidateQueries = useEffectEvent(async () => {
    await queryClient.invalidateQueries();
  });

  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    eventSource.addEventListener('connected', (event) => {
      if (!deploymentId.current) {
        console.debug('sse connected', event.data);
        deploymentId.current = event.data;
      } else if (deploymentId.current !== event.data) {
        console.info('detected new deployment', deploymentId.current, '->', event.data);
        window.location.reload();
      } else {
        console.debug('sse reconnected', event.data);
        void invalidateQueries();
      }
    });

    eventSource.addEventListener('invalidate', () => {
      console.debug('sse invalidate');
      void invalidateQueries();
    });

    function cleanup() {
      eventSource.close();
    }

    window.addEventListener('beforeunload', cleanup, { once: true });

    return cleanup;
  }, [queryClient]);

  return null;
}
