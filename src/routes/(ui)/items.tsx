import { createFileRoute } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { ItemForm } from '@/forms/item';
import { useItemDeleteMutator } from '@/hooks/query/mutators';
import { useItemsQuery } from '@/hooks/query/queries/base';
import type { ItemRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/items')({
  component: ItemsPage,
});

function ItemsPageListRow({ id, name, defaultAmount, defaultCategoryId, defaultUnitId }: ItemRow) {
  const deleteMutator = useItemDeleteMutator();
  const handleDeleteClick = useCallback(() => deleteMutator.mutate({ data: id }), [id, deleteMutator]);
  return (
    <div className='contents'>
      <span>{id}</span>
      <span>{name}</span>
      <span>{defaultAmount}</span>
      <span>{defaultCategoryId}</span>
      <span>{defaultUnitId}</span>
      <Button onClick={handleDeleteClick}>
        <Trash2 />
      </Button>
    </div>
  );
}

function ItemsPageList() {
  const query = useItemsQuery();

  return (
    <div className='grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Name</span>
        <span>Amount</span>
        <span>Category ID</span>
        <span>Unit ID</span>
        <span>Actions</span>
      </div>
      {query.data.map((item) => (
        <ItemsPageListRow key={item.id} {...item} />
      ))}
    </div>
  );
}

function ItemsPage() {
  return (
    <div className='grid gap-4'>
      <ItemForm mode='add' />
      <ItemForm mode='edit' id={1} />
      <ItemsPageList />
    </div>
  );
}
