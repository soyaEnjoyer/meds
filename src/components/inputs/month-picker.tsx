import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import type { MonthTuple } from '@/lib/enums';
import { months } from '@/lib/enums';
import { cn } from '@/lib/utils';

function MonthButton({
  month,
  value,
  onValueChange,
}: {
  month: MonthTuple;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const handleClick = useCallback(() => onValueChange(value ^ month[0]), [value, month, onValueChange]);
  return (
    <Button
      onClick={handleClick}
      variant={(value & month[0]) === month[0] ? 'default' : 'secondary'}
      className={cn(
        'block overflow-x-hidden whitespace-nowrap @max-md:px-0',
        value & month[0] || 'text-muted-foreground'
      )}
    >
      <span className='hidden @max-md:contents'>{month[1].slice(0, 1)}</span>
      <span className='hidden truncate @md:contents'>{month[1]}</span>
    </Button>
  );
}

export function MonthPicker({
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
    <div className='@container'>
      <div onBlur={onBlur} className='grid grid-cols-6 @md:grid-cols-12'>
        <input type='hidden' id={id} name={name} value={value} />
        {months.map((month) => (
          <MonthButton key={month[0]} month={month} value={value} onValueChange={onValueChange} />
        ))}
      </div>
    </div>
  );
}
