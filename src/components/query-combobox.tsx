import type { DefinedUseQueryResult } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { useCategoriesQuery, useItemsQuery, useUnitsQuery } from '@/hooks/query/queries/base';

interface ComboboxItem {
  label: string;
  value: string;
}

function QueryCombobox({
  name,
  placeholder,
  query,
  required,
}: {
  name?: string;
  placeholder?: string;
  query: DefinedUseQueryResult<{ id: number; name: string }[]>;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<ComboboxItem | null>(null);

  const items: ComboboxItem[] = useMemo(
    // oxlint-disable-next-line no-shadow
    () => query.data.map(({ id, name }) => ({ label: name, value: String(id) })),
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
    [query.dataUpdatedAt]
  );

  // HACK: <Combobox/> does not respond to form reset. can probably remove after bringing in tanstack form
  useEffect(() => {
    const form = inputRef.current?.closest('form');
    if (!form) return;
    const controller = new AbortController();
    form.addEventListener('reset', () => setValue(null), { signal: controller.signal });
    // oxlint-disable-next-line typescript/consistent-return
    return () => controller.abort();
  }, []);

  return (
    <Combobox
      items={items}
      name={name}
      required={required}
      value={value}
      onValueChange={setValue}
      inputRef={inputRef}
      autoHighlight
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboboxItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function CategoryCombobox({
  placeholder = 'Category',
  ...props
}: Omit<ComponentProps<typeof QueryCombobox>, 'query'>) {
  const query = useCategoriesQuery();
  return <QueryCombobox query={query} placeholder={placeholder} {...props} />;
}

export function ItemCombobox({ placeholder = 'Item', ...props }: Omit<ComponentProps<typeof QueryCombobox>, 'query'>) {
  const query = useItemsQuery();
  return <QueryCombobox query={query} placeholder={placeholder} {...props} />;
}

export function UnitCombobox({ placeholder = 'Unit', ...props }: Omit<ComponentProps<typeof QueryCombobox>, 'query'>) {
  const query = useUnitsQuery();
  return <QueryCombobox query={query} placeholder={placeholder} {...props} />;
}
