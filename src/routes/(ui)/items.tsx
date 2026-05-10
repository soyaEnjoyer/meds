import { createFileRoute } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/dialog';
import { useFilteredItemsQuery } from '@/hooks/query/queries/item';
import type { ItemRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/items')({
  component: ItemsPage,
});

function ItemsPageListRow({ id, name }: ItemRow) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('item', id), [id, openDialog]);

  return (
    <div className='contents'>
      <span>{id}</span>
      <span>{name}</span>
      <Button onClick={handleEditClick}>
        <Settings />
      </Button>
    </div>
  );
}

function ItemsPage() {
  const query = useFilteredItemsQuery();

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Name</span>
        <span />
      </div>
      {query.data.map((item) => (
        <ItemsPageListRow key={item.id} {...item} />
      ))}
    </div>
  );
}
