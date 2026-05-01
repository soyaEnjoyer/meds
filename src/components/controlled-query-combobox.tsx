import type { DefinedUseQueryResult } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useCallback, useMemo } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  useCategoriesMapQuery,
  useCategoriesQuery,
  useItemsMapQuery,
  useItemsQuery,
  useUnitsMapQuery,
  useUnitsQuery,
} from '@/hooks/query/queries/base';

interface ComboboxItem {
  label: string;
  value: string;
}

function QueryCombobox({
  name,
  placeholder,
  query,
  map,
  required,
  value,
  onValueChange,
  onBlur,
}: {
  name?: string;
  placeholder?: string;
  query: DefinedUseQueryResult<{ id: number; name: string }[]>;
  map: DefinedUseQueryResult<Map<number, { id: number; name: string }>>;
  required?: boolean;
  value: number | null;
  onValueChange: (value: number | null) => void;
  onBlur?: () => void;
}) {
  const items: ComboboxItem[] = useMemo(
    // oxlint-disable-next-line no-shadow
    () => query.data.map(({ id, name }) => ({ label: name, value: String(id) })),
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
    [query.dataUpdatedAt]
  );

  const comboValue: ComboboxItem | null = useMemo(() => {
    const item = typeof value === 'number' ? map.data.get(value) : null;
    if (item) return { label: item.name, value: String(item.id) };
    return null;
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [value, map.dataUpdatedAt]);

  const handleComboValueChange = useCallback(
    // oxlint-disable-next-line no-shadow
    (value: ComboboxItem | null) => {
      if (value === null) onValueChange(null);
      else onValueChange(Number(value.value));
    },
    [onValueChange]
  );

  return (
    <Combobox
      items={items}
      name={name}
      required={required}
      value={comboValue}
      onValueChange={handleComboValueChange}
      autoHighlight
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent onBlur={onBlur}>
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

export function ControlledCategoryCombobox({
  placeholder = 'Category',
  ...props
}: Omit<ComponentProps<typeof QueryCombobox>, 'query' | 'map'>) {
  const query = useCategoriesQuery();
  const map = useCategoriesMapQuery();
  return <QueryCombobox query={query} map={map} placeholder={placeholder} {...props} />;
}

export function ControlledItemCombobox({
  placeholder = 'Item',
  ...props
}: Omit<ComponentProps<typeof QueryCombobox>, 'query' | 'map'>) {
  const query = useItemsQuery();
  const map = useItemsMapQuery();
  return <QueryCombobox query={query} map={map} placeholder={placeholder} {...props} />;
}

export function ControlledUnitCombobox({
  placeholder = 'Unit',
  ...props
}: Omit<ComponentProps<typeof QueryCombobox>, 'query' | 'map'>) {
  const query = useUnitsQuery();
  const map = useUnitsMapQuery();
  return <QueryCombobox query={query} map={map} placeholder={placeholder} {...props} />;
}
