import { displayName } from '@root/package.json';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useRef } from 'react';

export function SseClient() {
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
        globalThis.location.reload();
      } else {
        console.debug('sse reconnected', event.data);
        void invalidateQueries();
      }
    });

    eventSource.addEventListener('invalidate', () => {
      console.debug('sse invalidate');
      void invalidateQueries();
    });

    eventSource.addEventListener('notification', (event) => {
      const { message, title } = JSON.parse(event.data);
      void new Notification(title, {
        body: message,
        icon: '/icon/default.svg',
        tag: displayName,
      });
    });

    function cleanup() {
      eventSource.close();
    }

    window.addEventListener('beforeunload', cleanup, { once: true });

    return cleanup;
  }, [queryClient]);

  return null;
}
