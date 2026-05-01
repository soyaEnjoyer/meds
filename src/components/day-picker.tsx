import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// oxlint-disable sort-keys
const days = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 8, label: 'Thursday' },
  { value: 16, label: 'Friday' },
  { value: 32, label: 'Saturday' },
  { value: 64, label: 'Sunday' },
] as const;
// oxlint-enable sort-keys

function DayButton({
  day,
  value,
  onValueChange,
}: {
  day: (typeof days)[number];
  value: number;
  onValueChange: (value: number) => void;
}) {
  const handleClick = useCallback(() => onValueChange(value ^ day.value), [value, day, onValueChange]);
  return (
    <Button
      onClick={handleClick}
      variant={(value & day.value) === day.value ? 'default' : 'secondary'}
      className={cn('block truncate', value & day.value || 'text-muted-foreground')}
    >
      <span className='hidden max-md:contents'>{day.label.slice(0, 1)}</span>
      <span className='hidden md:contents'>{day.label}</span>
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
    <div onBlur={onBlur} className='grid grid-cols-7'>
      <input type='hidden' id={id} name={name} value={value} />
      {days.map((day) => (
        <DayButton key={day.value} day={day} value={value} onValueChange={onValueChange} />
      ))}
    </div>
  );
}
