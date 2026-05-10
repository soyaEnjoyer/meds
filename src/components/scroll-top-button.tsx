import { ArrowUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ScrollTopButton({ threshold = 0.5 }: { threshold?: number }) {
  const handleClick = useCallback(() => window.scrollTo({ behavior: 'smooth', top: 0 }), []);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(visible);

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      'scrollend',
      () => {
        const nextVisible = window.scrollY > window.innerHeight * threshold;
        console.log({
          innerHeight: window.innerHeight,
          nextVisible,
          scrollY: window.scrollY,
          visible: visibleRef.current,
        });
        if (visibleRef.current !== nextVisible) {
          setVisible(nextVisible);
          visibleRef.current = nextVisible;
        }
      },
      { signal: controller.signal }
    );
    return () => controller.abort();
  }, [threshold]);

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
