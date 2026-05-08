import { Minus, Plus } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useCallback, useRef } from 'react';

import { InputGroup, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

export function NumberPicker({
  onValueChange,
  value,
  max = Infinity,
  min = -Infinity,
  step = 1,
  className,
  required,
  name,
  onBlur,
}: {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  required?: boolean;
  name?: string;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handleMinusClick = useCallback(() => {
    const nextValue = Math.max(min, (ref.current?.valueAsNumber || 0) - step);
    if (onValueChange) onValueChange(nextValue);
    else if (ref.current) ref.current.value = String(nextValue);
    else throw new Error('oh no');
  }, [min, step, onValueChange]);

  const handlePlusClick = useCallback(() => {
    const nextValue = Math.min(max, (ref.current?.valueAsNumber || 0) + step);
    if (onValueChange) onValueChange(nextValue);
    else if (ref.current) ref.current.value = String(nextValue);
    else throw new Error('oh no');
  }, [max, step, onValueChange]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onValueChange?.(event.target.valueAsNumber),
    [onValueChange]
  );

  return (
    <InputGroup className={className}>
      <InputGroupButton onClick={handleMinusClick}>
        <Minus />
      </InputGroupButton>
      <InputGroupInput
        type='number'
        value={value}
        onChange={handleInputChange}
        className='appearance-[textfield] [-moz-appearance:textfield]'
        required={required}
        name={name}
        ref={ref}
        onBlur={onBlur}
      />
      <InputGroupButton onClick={handlePlusClick}>
        <Plus />
      </InputGroupButton>
    </InputGroup>
  );
}
