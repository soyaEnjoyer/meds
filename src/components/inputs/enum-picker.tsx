import { Circle } from 'lucide-react';
import type { ComponentProps, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { months, weekdays } from '@/lib/enums';
import { cn } from '@/lib/utils';

type Tuple = Readonly<[id: number, label: string]>;

function EnumButton({
  item,
  value,
  onValueChange,
}: {
  item: Tuple;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleClick = useCallback(() => onValueChange(valueRef.current ^ item[0]), [item, onValueChange]);

  const handleMouseOver = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (event.buttons) onValueChange(valueRef.current ^ item[0]);
    },
    [item, onValueChange]
  );

  return (
    <Button
      onClick={handleClick}
      onMouseEnter={handleMouseOver}
      onMouseDown={handleMouseOver}
      variant={(value & item[0]) === item[0] ? 'default' : 'ghost'}
      className={cn(
        'block overflow-x-hidden whitespace-nowrap @max-md:px-0',
        value & item[0] || 'text-muted-foreground'
      )}
      size='sm'
    >
      <span className='hidden @max-md:contents'>{item[1].slice(0, 1)}</span>
      <span className='hidden truncate @md:contents'>{item[1]}</span>
    </Button>
  );
}

export function EnumPicker({
  id,
  name,
  value,
  onValueChange,
  onBlur,
  items,
  className,
}: {
  id?: string;
  name?: string;
  value: number;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  items: Readonly<Tuple[]>;
  className?: string;
}) {
  const valueRef = useRef(value);

  const maxVal = useMemo(() => items.reduce((acc, item) => acc + item[0], 0), [items]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleToggleClick = useCallback(() => {
    onValueChange(valueRef.current === maxVal ? 0 : maxVal);
  }, [maxVal, onValueChange]);

  return (
    <div className='@container flex items-center' onBlur={onBlur}>
      <Button onClick={handleToggleClick} variant='outline' size='icon-sm'>
        <Circle className={value === maxVal ? undefined : 'fill-current'} />
      </Button>
      <div className={cn('grid grid-flow-col size-full grid-cols-[repeat(auto-fit,minmax(1px,1fr))]', className)}>
        {items.map((item) => (
          <EnumButton key={item[0]} item={item} value={value} onValueChange={onValueChange} />
        ))}
      </div>
      <input type='hidden' id={id} name={name} value={value} />
    </div>
  );
}

export function DayPicker(props: Omit<ComponentProps<typeof EnumPicker>, 'items'>) {
  return <EnumPicker {...props} items={weekdays} />;
}

export function MonthPicker(props: Omit<ComponentProps<typeof EnumPicker>, 'items'>) {
  return <EnumPicker {...props} items={months} className='@max-md:grid-rows-2' />;
}
