import { ArrowUp } from 'lucide-react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HIDDEN_CLASS_NAMES = ['opacity-0', 'translate-y-full', 'pointer-events-none'];

export function ScrollTopButton({
  elementRef,
  threshold = 0.5,
  onClick,
}: {
  elementRef?: RefObject<HTMLDivElement | null>;
  threshold?: number;
  onClick?: () => void;
}) {
  const visibleRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = useCallback(() => {
    (elementRef?.current ?? globalThis).scrollTo({ behavior: 'smooth', top: 0 });
    onClick?.();
  }, [elementRef, onClick]);

  useEffect(() => {
    const controller = new AbortController();
    if (elementRef?.current)
      elementRef.current.addEventListener(
        'scrollend',
        () => {
          const nextVisible = (elementRef.current?.scrollTop ?? 0) > window.innerHeight * threshold;
          if (visibleRef.current !== nextVisible) {
            if (nextVisible) buttonRef.current?.classList.remove(...HIDDEN_CLASS_NAMES);
            else buttonRef.current?.classList.add(...HIDDEN_CLASS_NAMES);
            visibleRef.current = nextVisible;
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
            if (nextVisible) buttonRef.current?.classList.remove(...HIDDEN_CLASS_NAMES);
            else buttonRef.current?.classList.add(...HIDDEN_CLASS_NAMES);
            visibleRef.current = nextVisible;
          }
        },
        { signal: controller.signal }
      );
    return () => controller.abort();
  }, [elementRef, threshold]);

  return (
    <Button
      aria-description='Scroll top'
      className={cn(
        'fixed bottom-4 left-4 size-12 rounded-full transition-[opacity,translate] shadow-md',
        HIDDEN_CLASS_NAMES
      )}
      onClick={handleClick}
      ref={buttonRef}
    >
      <ArrowUp className='size-6' />
    </Button>
  );
}
