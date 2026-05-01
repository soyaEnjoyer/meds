import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// oxlint-disable sort-keys
const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 4, label: 'March' },
  { value: 8, label: 'April' },
  { value: 16, label: 'May' },
  { value: 32, label: 'June' },
  { value: 64, label: 'July' },
  { value: 128, label: 'August' },
  { value: 256, label: 'September' },
  { value: 512, label: 'October' },
  { value: 1024, label: 'November' },
  { value: 2048, label: 'December' },
] as const;
// oxlint-enable sort-keys

function MonthButton({
  month,
  value,
  onValueChange,
}: {
  month: (typeof months)[number];
  value: number;
  onValueChange: (value: number) => void;
}) {
  const handleClick = useCallback(() => onValueChange(value ^ month.value), [value, month, onValueChange]);
  return (
    <Button
      onClick={handleClick}
      variant={(value & month.value) === month.value ? 'default' : 'secondary'}
      className={cn('block truncate', value & month.value || 'text-muted-foreground')}
    >
      <span className='hidden max-md:contents'>{month.label.slice(0, 1)}</span>
      <span className='hidden md:contents'>{month.label}</span>
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
    <div onBlur={onBlur} className='grid grid-cols-6 md:grid-cols-12'>
      <input type='hidden' id={id} name={name} value={value} />
      {months.map((month) => (
        <MonthButton key={month.value} month={month} value={value} onValueChange={onValueChange} />
      ))}
    </div>
  );
}
