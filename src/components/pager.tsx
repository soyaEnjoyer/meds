import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RefObject } from 'react';
import { useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PagerName } from '@/hooks/pager';
import { usePager } from '@/hooks/pager';

export function Pager({
  name,
  scrollTop: scrollTopElem,
  hasNextPage,
}: {
  name: PagerName;
  scrollTop?: true | RefObject<Element>;
  hasNextPage: boolean;
}) {
  const [pagerPrev, pagerNext] = usePager((state) => [state.actions.prev, state.actions.next]);
  const pagerState = usePager((state) => state[name]);

  const scrollTop = useCallback(() => {
    if (!scrollTopElem) return;
    (scrollTopElem === true ? document.documentElement : scrollTopElem.current)?.scrollTo({
      behavior: 'smooth',
      left: 0,
      top: 0,
    });
  }, [scrollTopElem]);

  const handleLeftClick = useCallback(() => {
    pagerPrev(name);
    scrollTop();
  }, [pagerPrev, name, scrollTop]);

  const handleRightClick = useCallback(() => {
    pagerNext(name);
    scrollTop();
  }, [pagerNext, name, scrollTop]);

  return (
    <div className='flex flex-row items-center justify-center gap-4'>
      <Button onClick={handleLeftClick} disabled={pagerState.pageNum === 0} aria-description='Previous page'>
        <ChevronLeft />
      </Button>
      <Badge>{pagerState.pageNum.toLocaleString()}</Badge>
      <Button onClick={handleRightClick} disabled={!hasNextPage} aria-description='Next page'>
        <ChevronRight />
      </Button>
    </div>
  );
}
