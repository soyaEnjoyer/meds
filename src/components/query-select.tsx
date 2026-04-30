import type { DefinedUseQueryResult } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategoriesQuery, useItemsQuery, useUnitsQuery } from '@/hooks/query/queries/base';

function QuerySelect({
  name,
  placeholder = 'Category',
  query,
  required,
}: {
  name?: string;
  placeholder?: string;
  query: DefinedUseQueryResult<{ id: number; name: string }[]>;
  required?: boolean;
  value?: number;
  onValueChange?: (value: number | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<number | null>(null);

  const items: ComponentProps<typeof Select>['items'] = useMemo(
    // oxlint-disable-next-line no-shadow
    () => query.data.map(({ id, name }) => ({ label: name, value: id })),
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
    [query.dataUpdatedAt]
  );

  // FIXME: <Select/> does not respond to form reset and this workaround is not good.
  useEffect(() => {
    const form = inputRef.current?.closest('form');
    if (!form) return;
    const controller = new AbortController();
    form.addEventListener('reset', () => setValue(null), { signal: controller.signal });
    // oxlint-disable-next-line typescript/consistent-return
    return () => controller.abort();
  }, []);

  return (
    <Select items={items} name={name} required={required} value={value} onValueChange={setValue} inputRef={inputRef}>
      <SelectTrigger className='w-full'>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategorySelect({
  placeholder = 'Category',
  ...props
}: Omit<ComponentProps<typeof QuerySelect>, 'query'>) {
  const query = useCategoriesQuery();
  return <QuerySelect query={query} placeholder={placeholder} {...props} />;
}

export function ItemSelect({ placeholder = 'Item', ...props }: Omit<ComponentProps<typeof QuerySelect>, 'query'>) {
  const query = useItemsQuery();
  return <QuerySelect query={query} placeholder={placeholder} {...props} />;
}

export function UnitSelect({ placeholder = 'Unit', ...props }: Omit<ComponentProps<typeof QuerySelect>, 'query'>) {
  const query = useUnitsQuery();
  return <QuerySelect query={query} placeholder={placeholder} {...props} />;
}
