import { createFileRoute } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { UnitForm } from '@/forms/unit';
import { useDialog } from '@/hooks/dialog';
import { useUnitsQuery } from '@/hooks/query/queries/base';
import type { UnitRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/units')({
  component: UnitsPage,
});

function UnitsPageListRow({ id, name }: UnitRow) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('unit', id), [id, openDialog]);

  return (
    <div className='contents'>
      <span>{id}</span>
      <span>{name}</span>
      <Button onClick={handleEditClick}>
        <Pencil />
      </Button>
    </div>
  );
}

function UnitsPageList() {
  const query = useUnitsQuery();

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Name</span>
        <span>Actions</span>
      </div>
      {query.data.map((item) => (
        <UnitsPageListRow key={item.id} {...item} />
      ))}
    </div>
  );
}

function UnitsPage() {
  return (
    <div className='grid gap-4'>
      <UnitForm mode='add' />
      <UnitForm mode='edit' id={1} />
      <UnitsPageList />
    </div>
  );
}
