import { useCallback, useMemo, useState } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { dateSet, formatDateDistance, formatDateIso, formatDatetimeIso, formatTimeIso } from '@/lib/date';
import { cn } from '@/lib/utils';

export function DateText({
  as = 'date',
  className,
  date,
  precision = 'auto',
  size = 'base',
  ref,
}: {
  as?: 'date' | 'dist';
  className?: string;
  date: Date | null;
  precision?: 'date' | 'time' | 'datetime' | 'auto';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  ref?: Date | null;
}) {
  const [iso, dist] = useMemo(() => {
    if (!date) return ['', ''];
    const now = new Date();
    const distance = formatDateDistance(date, ref ?? now);
    if (precision === 'date') return [formatDateIso(date), distance];
    if (precision === 'time') return [formatTimeIso(date), distance];
    if (precision === 'datetime') return [formatDatetimeIso(date), distance];
    const dayStart = dateSet(now, { hour: 0, minute: 0, ms: 0, second: 0 });
    const dayEnd = dateSet(now, { hour: 23, minute: 59, ms: 999, second: 59 });
    if (date >= dayStart && date <= dayEnd) return [formatTimeIso(date), distance];
    return [formatDatetimeIso(date), distance];
  }, [date, precision, ref]);
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  const sizeClass =
    size === 'xs'
      ? 'text-xs'
      : size === 'sm'
        ? 'text-sm'
        : size === 'lg'
          ? 'text-lg'
          : size === 'xl'
            ? 'text-xl'
            : 'text-base';

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={<span className={cn(sizeClass, className)}>{as === 'date' ? iso : dist}</span>}
        onClick={toggleOpen}
      />
      <HoverCardContent className='max-w-fit'>
        <span className={sizeClass}>{as === 'date' ? dist : iso}</span>
      </HoverCardContent>
    </HoverCard>
  );
}
