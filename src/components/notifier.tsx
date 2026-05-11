import { displayName } from '@root/package.json';
import { useEffect, useRef } from 'react';

import { useSchedulesQuery } from '@/hooks/query/queries/base';
import { MINUTE_MS } from '@/lib/date';

// TODO: if this works on mobile when the tab is backgrounded (it won't), push notifications over sse instead

const HASH_KEY = `${displayName}.notificationHash`;
const INTERVAL_MS = MINUTE_MS * 15;

interface Status {
  title: string;
  message: string;
  hash: string;
}

export function Notifier() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const query = useSchedulesQuery();
  const statusRef = useRef<Status | null>(null);

  useEffect(() => {
    // tanstack start doesn't seem to have a way to set title outside of navigations
    function applyTitle() {
      if (!statusRef.current) return;
      const { title } = statusRef.current;
      const elem = document.head.querySelector('title');
      if (!elem) return;
      if (elem.textContent !== title) elem.textContent = title;
    }

    const observer = new MutationObserver(applyTitle);

    observer.observe(document.head, { characterData: true, childList: true, subtree: true });

    async function notify() {
      const prevHash = localStorage.getItem(HASH_KEY);
      const response = await fetch('/api/status');
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      statusRef.current = (await response.json()) as Status;
      if (statusRef.current.hash !== prevHash) {
        // this requires a secure context - i.e. localhost or https
        void new Notification(statusRef.current.title, {
          body: statusRef.current.message,
          icon: '/icon.svg',
          tag: displayName,
        });
        localStorage.setItem(HASH_KEY, statusRef.current.hash);
      }
      applyTitle();
    }

    void notify();
    const now = Date.now();
    const next = now - (now % INTERVAL_MS) + INTERVAL_MS;

    timeoutRef.current = setTimeout(() => {
      void notify();
      intervalRef.current = setInterval(notify, INTERVAL_MS);
    }, next - now);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [query.dataUpdatedAt]);

  return null;
}
