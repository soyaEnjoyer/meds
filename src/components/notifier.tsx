import { displayName } from '@root/package.json';
import { useCallback, useEffect, useRef } from 'react';

import type { Status } from '@/functions.server/status';
import { useSchedulesQuery } from '@/hooks/query/queries/base';
import { MINUTE_MS } from '@/lib/date';

// TODO: if this works on mobile when the tab is backgrounded (it won't), push notifications over sse instead

const HASH_KEY = `${displayName}.notificationHash`;
const INTERVAL_MS = MINUTE_MS * 15;
const ENABLE_NOTIFICATIONS = false;

export function Notifier() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const query = useSchedulesQuery();
  const statusRef = useRef<Status | null>(null);

  // tanstack start doesn't seem to have a way to update head outside of navigations
  const applyHead = useCallback(() => {
    if (!statusRef.current) return;
    const { due, title } = statusRef.current;
    const titleElem = document.head.querySelector('title');
    if (titleElem && titleElem.textContent !== title) titleElem.textContent = title;
    for (const iconElem of document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')) {
      const nextHref = `icon/${due ? 'due' : 'default'}.${iconElem.href.split('.').at(-1)}`;
      if (iconElem.href !== nextHref) iconElem.href = nextHref;
    }
  }, []);

  const notify = useCallback(async () => {
    const prevHash = localStorage.getItem(HASH_KEY);
    const response = await fetch('/api/status');
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    statusRef.current = (await response.json()) as Status;
    if (statusRef.current.hash !== prevHash && ENABLE_NOTIFICATIONS) {
      // this requires a secure context - i.e. localhost or https
      void new Notification(statusRef.current.title, {
        body: statusRef.current.message,
        icon: '/icon/default.svg',
        tag: displayName,
      });
      localStorage.setItem(HASH_KEY, statusRef.current.hash);
    }
    applyHead();
  }, [applyHead]);

  useEffect(() => {
    const observer = new MutationObserver(applyHead);
    observer.observe(document.head, { characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [applyHead]);

  useEffect(() => {
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
  }, [applyHead, notify, query.dataUpdatedAt]);

  return null;
}
