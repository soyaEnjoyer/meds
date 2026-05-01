import { createFileRoute } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { CategoryForm } from '@/forms/category';
import { useCategoryDeleteMutator } from '@/hooks/query/mutators';
import { useCategoriesQuery } from '@/hooks/query/queries/base';
import type { CategoryRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/categories')({
  component: CategoriesPage,
});

function CategoriesPageListRow({ id, name }: CategoryRow) {
  const deleteMutator = useCategoryDeleteMutator();
  const handleDeleteClick = useCallback(() => deleteMutator.mutate({ data: id }), [id, deleteMutator]);
  return (
    <div className='contents'>
      <span>{id}</span>
      <span>{name}</span>
      <Button onClick={handleDeleteClick}>
        <Trash2 />
      </Button>
    </div>
  );
}

function CategoriesPageList() {
  const query = useCategoriesQuery();

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Name</span>
        <span>Actions</span>
      </div>
      {query.data.map((item) => (
        <CategoriesPageListRow key={item.id} {...item} />
      ))}
    </div>
  );
}

function CategoriesPage() {
  return (
    <div className='grid gap-4'>
      <CategoryForm mode='add' />
      <CategoryForm mode='edit' id={1} />
      <CategoriesPageList />
    </div>
  );
}
