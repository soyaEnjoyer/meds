import { createFileRoute } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { useCallback } from 'react';

import { NumberPicker } from '@/components/number-picker';
import { CategorySelect, UnitSelect } from '@/components/query-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useItemCreateMutator, useItemDeleteMutator } from '@/hooks/query/mutators';
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

function ItemsPageAddForm() {
  const createMutator = useItemCreateMutator();

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.target);
      createMutator.mutate(
        {
          data: {
            defaultAmount: Number(form.get('defaultAmount')),
            defaultCategoryId: Number(form.get('defaultCategoryId')),
            defaultUnitId: Number(form.get('defaultUnitId')),
            // oxlint-disable-next-line typescript/no-base-to-string
            name: String(form.get('name')),
          },
        },
        { onError: (err) => console.error(err), onSuccess: () => event.target.reset() }
      );
    },
    [createMutator]
  );

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto font-semibold'>Add an item</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        <label className='contents'>
          Name
          <Input type='text' name='name' required />
        </label>
        <label className='contents'>
          Default category
          <CategorySelect name='defaultCategoryId' required />
        </label>
        <label className='contents'>
          Default unit
          <UnitSelect name='defaultUnitId' required />
        </label>
        <label className='contents'>
          Default amount
          <NumberPicker name='defaultAmount' required min={1} />
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

function ItemsPage() {
  return (
    <div className='grid gap-4'>
      <ItemsPageAddForm />
      <ItemsPageList />
    </div>
  );
}
