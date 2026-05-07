import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { useScheduleDoneMutator } from '@/hooks/query/mutators';
import { useItemsMapQuery, useSchedulesMapQuery } from '@/hooks/query/queries/base';
import { useAppForm } from '@/lib/form';

const schema = z.object({
  amount: z.number().min(0.001),
  unitId: z.int(),
  update: z.boolean(),
});

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function DoneCustomForm({ id, closeDialog }: { id: number; closeDialog?: () => void }) {
  const doneMutator = useScheduleDoneMutator();

  const map = useSchedulesMapQuery();
  const itemMap = useItemsMapQuery();

  const { defaultValues, itemName } = useMemo(() => {
    const schedule = map.data.get(id);
    if (!schedule) throw new Error('schedule not found');
    const item = itemMap.data.get(schedule.itemId);
    return {
      defaultValues: {
        amount: schedule.amount,
        unitId: schedule.unitId,
        update: false,
      },
      itemName: item?.name ?? 'Unknown',
    };
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [id, map.dataUpdatedAt, itemMap.dataUpdatedAt]);

  const form = useAppForm({
    defaultValues,
    onSubmit({ value }) {
      doneMutator.mutate(
        { data: [{ id, ...value }] },
        {
          onError(error: Error) {
            console.error('error submitting form', error);
          },
          onSuccess(data) {
            console.log('submitted form', data);
          },
        }
      );
      closeDialog?.();
    },
    validators: {
      onSubmit: schema,
    },
  });

  const handleResetClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      form.reset({ ...defaultValues });
    },
    [form, defaultValues]
  );

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    },
    [form]
  );

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto text-base font-semibold'>{`Custom amount: ${itemName}`}</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2 @sm:grid-cols-[auto_1fr_auto_1fr]'>
        <form.AppField name='amount'>
          {(field) => <FormField component={field.NumberPicker} label='Amount' />}
        </form.AppField>
        <form.AppField name='unitId'>
          {(field) => <FormField component={field.UnitCombobox} label='Unit' />}
        </form.AppField>
        <form.AppField name='update'>{(field) => <FormField component={field.Switch} label='Update' />}</form.AppField>
      </fieldset>

      <footer className='flex items-center justify-around'>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Done'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
      </footer>
    </form>
  );
}
