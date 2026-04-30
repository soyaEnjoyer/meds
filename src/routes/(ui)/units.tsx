import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUnitCreateMutator, useUnitDeleteMutator } from '@/hooks/query/mutators';
import { useUnitsQuery } from '@/hooks/query/queries/base';
import type { UnitRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/units')({
  component: UnitsPage,
});

function UnitsPageListRow({ id, name }: UnitRow) {
  const deleteMutator = useUnitDeleteMutator();
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

function UnitsPageAddForm() {
  const createMutator = useUnitCreateMutator();

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.target);
      createMutator.mutate(
        // oxlint-disable-next-line typescript/no-base-to-string
        { data: { name: String(form.get('name')) } },
        { onError: (err) => console.error(err), onSuccess: () => event.target.reset() }
      );
    },
    [createMutator]
  );

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto font-semibold'>Add a unit</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        <label className='contents'>
          Name
          <Input type='text' name='name' required />
        </label>
      </fieldset>
      <footer className='flex items-center justify-around'>
        <Button type='submit'>
          <Plus />
        </Button>
        <Button type='reset' variant='destructive'>
          <Trash2 />
        </Button>
      </footer>
    </form>
  );
}

function UnitsPage() {
  return (
    <div className='grid gap-4'>
      <UnitsPageAddForm />
      <UnitsPageList />
    </div>
  );
}
