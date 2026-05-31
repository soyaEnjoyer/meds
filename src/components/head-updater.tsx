import { useEffect } from 'react';

import { useStatusQuery } from '@/hooks/query/queries/base';

export function HeadUpdater() {
  const query = useStatusQuery();

  useEffect(() => {
    const { due, title } = query.data;
    const titleElem = document.head.querySelector('title');
    if (titleElem && titleElem.textContent !== title) titleElem.textContent = title;
    for (const iconElem of document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')) {
      const nextHref = `icon/${due ? 'due' : 'default'}.${iconElem.href.split('.').at(-1)}`;
      if (iconElem.href !== nextHref) iconElem.href = nextHref;
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]);

  return null;
}
