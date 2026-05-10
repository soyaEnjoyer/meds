'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateAdd, dateSet, formatDateIso } from '@/lib/date';

// default is unix epoch 0 to end of current year
const startMonth = dateAdd(dateSet(new Date(), { day: 1, hour: 0, minute: 0, month: 0, second: 0 }), {
  year: -5,
});
const endMonth = dateAdd(startMonth, { day: -1, year: 10 });

export function DatePicker({
  id,
  name,
  value,
  onBlur,
  onValueChange,
}: {
  id?: string;
  name?: string;
  value: Date | null;
  onBlur?: () => void;
  onValueChange: (value: Date | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (selected: Date | undefined) => {
      setOpen(false);
      onValueChange(selected ?? null);
    },
    [onValueChange]
  );

  const handleClearClick = useCallback(() => onValueChange(null), [onValueChange]);

  useEffect(() => {
    if (!open) onBlur?.();
  }, [open, onBlur]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type='hidden' name={name} id={id} value={value ? value.toISOString() : ''} />
      <div className='flex items-center rounded-lg border border-input'>
        <PopoverTrigger
          render={
            <Button variant='ghost' className='grow justify-start'>
              {value ? formatDateIso(value) : 'Select date'}
            </Button>
          }
        />
        <Button onClick={handleClearClick} variant='ghost' size='sm' className='px-1.5 text-muted-foreground'>
          <X />
        </Button>
      </div>
      <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
        <Calendar
          mode='single'
          selected={value ?? undefined}
          defaultMonth={value ?? undefined}
          captionLayout='dropdown'
          onSelect={handleSelect}
          weekStartsOn={1}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
