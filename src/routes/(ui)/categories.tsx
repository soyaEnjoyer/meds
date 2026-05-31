import { createFileRoute } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/dialog';
import { useFilteredCategoriesQuery } from '@/hooks/query/queries/category';
import type { CategoryRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/categories')({
  component: CategoriesPage,
});

function CategoriesPageListRow({ id, name }: CategoryRow) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('category', id), [id, openDialog]);

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

function CategoriesPage() {
  const query = useFilteredCategoriesQuery();

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Name</span>
        <span />
      </div>
      {query.data.map((item) => (
        <CategoriesPageListRow key={item.id} {...item} />
      ))}
    </div>
  );
}
