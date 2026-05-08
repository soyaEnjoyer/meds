import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatTimeIso } from '@/lib/date';
import type { Time } from '@/lib/drizzle/schema';

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

function HourButton({
  hour,
  value,
  onValueChange,
}: {
  hour: number;
  value: Time | null;
  onValueChange: (value: Time | null) => void;
}) {
  const handleClick = useCallback(() => {
    onValueChange({ hour, minute: value?.minute ?? 0 });
  }, [hour, value, onValueChange]);

  return (
    <Button variant={hour === value?.hour ? 'default' : 'secondary'} onClick={handleClick}>
      {hour.toString().padStart(2, '0')}
    </Button>
  );
}

function MinuteButton({
  minute,
  value,
  onValueChange,
  handleOpenChange,
}: {
  minute: number;
  value: Time | null;
  onValueChange: (value: Time | null) => void;
  handleOpenChange: (open: boolean) => void;
}) {
  const handleClick = useCallback(() => {
    onValueChange({ hour: value?.hour ?? 0, minute });
    handleOpenChange(false);
  }, [minute, value, onValueChange, handleOpenChange]);

  return (
    <Button variant={minute === value?.minute ? 'default' : 'secondary'} onClick={handleClick}>
      {minute.toString().padStart(2, '0')}
    </Button>
  );
}

export function TimePicker({
  id,
  name,
  value,
  onBlur,
  onValueChange,
}: {
  id?: string;
  name?: string;
  value: Time | null;
  onBlur?: () => void;
  onValueChange: (value: Time | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) onBlur?.();
      setOpen(nextOpen);
    },
    [onBlur]
  );

  const stringValue = useMemo(() => formatTimeIso(value), [value]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <input type='hidden' name={name} id={id} value={stringValue} />
      <PopoverTrigger
        render={
          <Button variant='outline' className='justify-start font-normal'>
            {stringValue || 'Select time'}
          </Button>
        }
      />
      <PopoverContent className='grid w-auto grid-cols-[2fr_1fr] gap-4' align='start'>
        <div className='grid grid-cols-6'>
          {hours.map((hour) => (
            <HourButton key={hour} hour={hour} onValueChange={onValueChange} value={value} />
          ))}
        </div>
        <div className='grid grid-cols-3'>
          {minutes.map((minute) => (
            <MinuteButton
              key={minute}
              minute={minute}
              onValueChange={onValueChange}
              value={value}
              handleOpenChange={handleOpenChange}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
