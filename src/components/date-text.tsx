import { useCallback, useMemo, useState } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { dateSet, formatDateDistance, formatDateIso, formatDatetimeIso, formatTimeIso } from '@/lib/date';
import { cn } from '@/lib/utils';

export function DateText({
  date,
  as = 'date',
  className,
  precision = 'auto',
}: {
  date: Date | null;
  as?: 'date' | 'dist';
  className?: string;
  precision?: 'date' | 'time' | 'datetime' | 'auto';
}) {
  const [iso, dist] = useMemo(() => {
    if (!date) return ['', ''];
    const distance = formatDateDistance(date);
    if (precision === 'date') return [formatDateIso(date), distance];
    if (precision === 'time') return [formatTimeIso(date), distance];
    if (precision === 'datetime') return [formatDatetimeIso(date), distance];
    const now = new Date();
    const dayStart = dateSet(now, { hour: 0, minute: 0, ms: 0, second: 0 });
    const dayEnd = dateSet(now, { hour: 23, minute: 59, ms: 999, second: 59 });
    if (date >= dayStart && date <= dayEnd) return [formatTimeIso(date), distance];
    return [formatDatetimeIso(date), distance];
  }, [date, precision]);
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
