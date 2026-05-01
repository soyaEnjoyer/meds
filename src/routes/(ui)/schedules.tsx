import { createFileRoute } from '@tanstack/react-router';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { useCallback } from 'react';

import { NumberPicker } from '@/components/number-picker';
import { CategoryCombobox, ItemCombobox, UnitCombobox } from '@/components/query-combobox';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useScheduleDeleteMutator } from '@/hooks/query/mutators';
import { useSchedulesQuery } from '@/hooks/query/queries/base';
import type { ScheduleRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/schedules')({
  component: SchedulesPage,
});

function SchedulesPageListRow({
  id,
  adHoc,
  amount,
  categoryId,
  cycleOffDays,
  cycleOnDays,
  dayMask,
  hour,
  minute,
  monthMask,
  restDays,
}: ScheduleRow) {
  const deleteMutator = useScheduleDeleteMutator();
  const handleDeleteClick = useCallback(() => deleteMutator.mutate({ data: id }), [id, deleteMutator]);
  return (
    <div className='contents'>
      <span>{id}</span>
      {adHoc ? <Check className='text-success' /> : <X />}
      <span>{amount.toLocaleString()}</span>
      <span>{categoryId}</span>
      <span>{cycleOnDays}</span>
      <span>{cycleOffDays}</span>
      <span>{dayMask}</span>
      <span>{monthMask}</span>
      <span>{restDays}</span>
      <span>{hour}</span>
      <span>{minute}</span>
      <Button onClick={handleDeleteClick}>
        <Trash2 />
      </Button>
    </div>
  );
}

function SchedulesPageAddForm() {
  // const createMutator = useScheduleCreateMutator();

  const handleSubmit = useCallback((event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.target);
    console.log(form);
    // createMutator.mutate(
    //   {
    //     data: {
    //       defaultAmount: Number(form.get('defaultAmount')),
    //       defaultCategoryId: Number(form.get('defaultCategoryId')),
    //       defaultUnitId: Number(form.get('defaultUnitId')),
    //       // oxlint-disable-next-line typescript/no-base-to-string
    //       name: String(form.get('name')),
    //     },
    //   },
    //   { onError: (err) => console.error(err), onSuccess: () => event.target.reset() }
    // );
  }, []);

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto font-semibold'>Add a schedule</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        {/*
          categoryId: number;
          itemId: number;
          unitId: number;
          amount: number;

          cycleOnDays: number;
          cycleOffDays: number;
          restDays: number;
          repeatCount: number;
          dayMask: number;
          monthMask: number;

          hour: number;
          minute: number;

          adHoc: boolean;
          sort: number;

          startAt: Date;
          endAt: Date | null;
          dueAt: Date | null;
        */}
        <label className='contents'>
          Item
          <ItemCombobox name='itemId' required />
        </label>
        <label className='contents'>
          Category
          <CategoryCombobox name='categoryId' required />
        </label>
        <label className='contents'>
          Unit
          <UnitCombobox name='unitId' required />
        </label>
        <label className='contents'>
          Amount
          <NumberPicker name='defaultAmount' required min={1} />
        </label>

        <label className='contents'>
          Cycle on days
          <NumberPicker name='cycleOnDays' required min={1} />
        </label>
        <label className='contents'>
          Cycle off days
          <NumberPicker name='cycleOffDays' required min={0} />
        </label>
        <label className='contents'>
          Rest days
          <NumberPicker name='restDays' required min={0} />
        </label>
        <label className='contents'>
          Repeat count
          <NumberPicker name='repeatCount' required min={0} />
        </label>

        {/* TODO: day / month mask */}

        {/* TODO: time picker */}

        <label className='contents'>
          Hour
          <NumberPicker name='repeatCount' required min={0} max={23} />
        </label>
        <label className='contents'>
          Minute
          <NumberPicker name='repeatCount' required min={0} max={59} step={5} />
        </label>

        <label className='contents'>
          Adhoc
          <Switch name='adhoc' required />
        </label>
        <label className='contents'>
          Sort
          <NumberPicker name='sort' required min={0} max={99} />
        </label>

        {/* TODO: date picker */}
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

function SchedulesPageList() {
  const query = useSchedulesQuery();

  return (
    <div className='schedules-center grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto_auto_auto_auto_auto] gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Adhoc</span>
        <span>Amount</span>
        <span>Category ID</span>
        <span>Cycle On</span>
        <span>Cycle Off</span>
        <span>Day Mask</span>
        <span>Month Mask</span>
        <span>Rest Days</span>
        <span>Hour</span>
        <span>Minute</span>
        <span>Actions</span>
      </div>
      {query.data.map((schedule) => (
        <SchedulesPageListRow key={schedule.id} {...schedule} />
      ))}
    </div>
  );
}

function SchedulesPage() {
  return (
    <div className='grid gap-4'>
      <SchedulesPageAddForm />
      <SchedulesPageList />
    </div>
  );
}
