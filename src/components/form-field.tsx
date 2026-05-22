import type { AnyFieldApi } from '@tanstack/react-form';
import type { ComponentProps, ReactElement } from 'react';

import { useFieldContext } from '@/lib/form';
import { cn } from '@/lib/utils';

function FieldErrors({ field, className, ...props }: { field: AnyFieldApi } & ComponentProps<'em'>) {
  return (
    <em className={cn('text-xs text-danger', className)} {...props}>
      {field.state.meta.errors.map((err) => ('message' in err ? err.message : err)).join(', ')}
    </em>
  );
}

export function FormField<Value>({
  component: Component,
  label,
}: {
  component: (props: {
    id: string;
    name: string;
    value: Value;
    onBlur: () => void;
    onValueChange: (value: Value) => void;
  }) => ReactElement;
  label: string;
}) {
  const field = useFieldContext<Value>();

  return (
    <div className='col-span-2 grid grid-cols-subgrid items-center gap-2'>
      <label className='col-start-1 max-w-min min-w-[10ch]' htmlFor={field.name}>
        {label}
      </label>
      <Component
        id={field.name}
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
      />
      <FieldErrors className='col-start-2' field={field} />
    </div>
  );
}
