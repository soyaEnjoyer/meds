import { ArrowUp } from 'lucide-react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ScrollTopButton({
  elementRef,
  threshold = 0.5,
  onClick,
}: {
  elementRef?: RefObject<HTMLDivElement | null>;
  threshold?: number;
  onClick?: () => void;
}) {
  const handleClick = useCallback(
    () => (elementRef?.current ?? globalThis).scrollTo({ behavior: 'smooth', top: 0 }),
    [elementRef]
  );
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(visible);

  useEffect(() => {
    const controller = new AbortController();
    if (elementRef?.current)
      elementRef.current.addEventListener(
        'scrollend',
        () => {
          const nextVisible = (elementRef.current?.scrollTop ?? 0) > window.innerHeight * threshold;
          if (visibleRef.current !== nextVisible) {
            setVisible(nextVisible);
            visibleRef.current = nextVisible;
            onClick?.();
          }
        },
        { signal: controller.signal }
      );
    else
      window.addEventListener(
        'scrollend',
        () => {
          const nextVisible = window.scrollY > window.innerHeight * threshold;
          if (visibleRef.current !== nextVisible) {
            setVisible(nextVisible);
            visibleRef.current = nextVisible;
            onClick?.();
          }
        },
        { signal: controller.signal }
      );
    return () => controller.abort();
  }, [elementRef, onClick, threshold]);

  return (
    <Button
      className={cn(
        'fixed bottom-4 left-4 size-12 rounded-full transition-[opacity,translate] shadow-md',
        visible || 'opacity-0 translate-y-full pointer-events-none'
      )}
      onClick={handleClick}
      aria-description='Scroll top'
    >
      <ArrowUp className='size-6' />
    </Button>
  );
}
