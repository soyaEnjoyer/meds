import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import type { WeekdayTuple } from '@/lib/enums';
import { weekdays } from '@/lib/enums';
import { cn } from '@/lib/utils';

function DayButton({
  day,
  value,
  onValueChange,
}: {
  day: WeekdayTuple;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const handleClick = useCallback(() => onValueChange(value ^ day[0]), [value, day, onValueChange]);
  return (
    <Button
      onClick={handleClick}
      variant={(value & day[0]) === day[0] ? 'default' : 'ghost'}
      className={cn(
        'block overflow-x-hidden whitespace-nowrap @max-md:px-0',
        value & day[0] || 'text-muted-foreground'
      )}
    >
      <span className='hidden @max-md:contents'>{day[1].slice(0, 1)}</span>
      <span className='hidden truncate @md:contents'>{day[1]}</span>
    </Button>
  );
}

export function DayPicker({
  id,
  name,
  value,
  onValueChange,
  onBlur,
}: {
  id?: string;
  name?: string;
  value: number;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
}) {
  return (
    <div onBlur={onBlur} className='@container grid grid-cols-7'>
      <input type='hidden' id={id} name={name} value={value} />
      {weekdays.map((weekday) => (
        <DayButton key={weekday[0]} day={weekday} value={value} onValueChange={onValueChange} />
      ))}
    </div>
  );
}
