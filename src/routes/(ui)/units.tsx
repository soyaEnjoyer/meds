import { createFileRoute } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/dialog';
import { useFilteredUnitsQuery } from '@/hooks/query/queries/unit';
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
        <Settings />
      </Button>
    </div>
  );
}

function UnitsPage() {
  const query = useFilteredUnitsQuery();

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
