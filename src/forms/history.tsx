import { useServerFn } from '@tanstack/react-start';
import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { FormField } from '@/components/form-field';
import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/dialogs/confirm';
import { historyGetOne } from '@/functions.server/history';
import { useHistoryDeleteMutator, useHistoryUpdateMutator } from '@/hooks/query/mutators';
import { formatDatetimeIso } from '@/lib/date';
import type { HistoryUpdate } from '@/lib/drizzle/zod';
import { historyUpdateSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';

const schema = historyUpdateSchema;

type Schema = HistoryUpdate;

const defaults: Schema = {
  amount: null,
  createdAt: new Date(),
  id: -1,
  unitId: -1,
} as const;

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function HistoryForm({ id, closeDialog }: { id: number; closeDialog?: () => void }) {
  const updateMutator = useHistoryUpdateMutator();
  const deleteMutator = useHistoryDeleteMutator();
  const historyGetOneFn = useServerFn(historyGetOne);
  const defaultValuesRef = useRef({ ...defaults });

  const form = useAppForm({
    defaultValues: defaultValuesRef.current,
    onSubmit({ formApi, value }) {
      console.log('onSubmit', value);
      updateMutator.mutate(
        { data: value },
        {
          onError(error: Error) {
            console.error('error submitting form', error);
          },
          onSuccess(data) {
            console.log('submitted form', data);
            formApi.reset({ ...defaults });
          },
        }
      );
      closeDialog?.();
    },
    onSubmitInvalid({ value }) {
      console.log('onSubmitInvalid', value);
    },
    validators: {
      onSubmit: schema,
    },
  });

  useEffect(() => {
    void (async () => {
      const result = await historyGetOneFn({ data: id });
      defaultValuesRef.current = result;
      form.reset(result);
    })();
  }, [form, historyGetOneFn, id]);

  const handleResetClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      form.reset({ ...defaultValuesRef.current });
    },
    [form]
  );

  const handleDeleteClick = useCallback(() => {
    deleteMutator.mutate({ data: id });
    form.reset({ ...defaults });
    closeDialog?.();
  }, [deleteMutator, id, form, closeDialog]);

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      console.log('form handleSubmit');
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    },
    [form]
  );

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto text-base font-semibold'>{`Editing: ${formatDatetimeIso(defaultValuesRef.current.createdAt)}`}</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2 @sm:grid-cols-[auto_1fr_auto_1fr]'>
        <form.AppField name='amount'>
          {(field) => <FormField component={field.NumberPicker} label='Amount' />}
        </form.AppField>
        <form.AppField name='unitId'>
          {(field) => <FormField component={field.UnitCombobox} label='Unit' />}
        </form.AppField>
        <form.AppField name='createdAt'>
          {(field) => <FormField component={field.DatePicker} label='At' />}
        </form.AppField>
      </fieldset>
      <footer className='flex items-center justify-around'>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Edit'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
        <ConfirmDialog>
          <ConfirmDialogContent
            message={`Really delete history ${formatDatetimeIso(defaultValuesRef.current.createdAt)}?`}
            onConfirm={handleDeleteClick}
          />
          <ConfirmDialogTrigger variant='destructive' size='lg'>
            Delete
          </ConfirmDialogTrigger>
        </ConfirmDialog>
      </footer>
    </form>
  );
}
