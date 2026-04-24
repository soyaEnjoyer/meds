import { useCallback, useMemo, useState } from 'react';

import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { formatDateDistance, formatDateIso } from '@/lib/date';
import { cn } from '@/lib/utils';

export function DateText({
  date,
  as = 'date',
  className,
}: {
  date: Date | null;
  as?: 'date' | 'dist';
  className?: string;
}) {
  const [iso, dist] = useMemo(() => [formatDateIso(date), formatDateDistance(date)], [date]);
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={<span className={cn('text-xs', className)}>{as === 'date' ? iso : dist}</span>}
        onClick={toggleOpen}
      />
      <HoverCardContent className='max-w-fit'>
        <span className='text-xs'>{as === 'date' ? dist : iso}</span>
      </HoverCardContent>
    </HoverCard>
  );
}
