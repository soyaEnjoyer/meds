import { useServerFn } from '@tanstack/react-start';
import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FormField } from '@/components/form-field';
import { DialogBody, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/dialogs/confirm';
import type { BasicDialogFormProps } from '@/dialogs/form';
import { historyGetOne } from '@/functions.server/history';
import { useHistoryDeleteMutator, useHistoryUpdateMutator } from '@/hooks/query/mutators';
import { formatDatetimeIso } from '@/lib/date';
import type { HistoryUpdate } from '@/lib/drizzle/zod';
import { historyUpdateSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';
import { createLogger } from '@/lib/logger/isomorphic';

const schema = historyUpdateSchema;

type Schema = HistoryUpdate;

const defaults: Schema = {
  amount: null,
  at: new Date(),
  id: -1,
  unitId: -1,
} as const;

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function HistoryForm({ asDialog, closeDialog, id }: BasicDialogFormProps) {
  const updateMutator = useHistoryUpdateMutator();
  const deleteMutator = useHistoryDeleteMutator();
  const historyGetOneFn = useServerFn(historyGetOne);
  const defaultValuesRef = useRef({ ...defaults });
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const logger = createLogger(import.meta.url);

  const form = useAppForm({
    defaultValues: defaultValuesRef.current,
    onSubmit({ formApi, value }) {
      logger.info('onSubmit', value);
      updateMutator.mutate(
        { data: value },
        {
          onError(error: Error) {
            logger.error('error submitting form', error);
            setSubmitError(error);
          },
          onSuccess(data) {
            logger.success('submitted form', data);
            closeDialog?.();
            formApi.reset({ ...defaults });
            setSubmitError(null);
          },
        }
      );
    },
    onSubmitInvalid({ value }) {
      logger.warn('onSubmitInvalid', value);
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

  const handleSubmitClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      void form.handleSubmit();
    },
    [form]
  );

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
      logger.debug('form handleSubmit');
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    },
    [form, logger]
  );

  const [HeaderComponent, BodyComponent, FooterComponent] = asDialog
    ? [DialogHeader, DialogBody, DialogFooter]
    : ['h2', 'div', 'footer'];

  return (
    <>
      <HeaderComponent>{`Editing: ${formatDatetimeIso(defaultValuesRef.current.at)}`}</HeaderComponent>
      <BodyComponent className='grid-cols-[auto_1fr] @md:grid-cols-[repeat(2,auto_1fr)]'>
        <form className='contents' onSubmit={handleSubmit}>
          <form.AppField name='amount'>
            {(field) => <FormField component={field.NumberPicker} label='Amount' />}
          </form.AppField>
          <form.AppField name='unitId'>
            {(field) => <FormField component={field.UnitCombobox} label='Unit' />}
          </form.AppField>
          <form.AppField name='at'>{(field) => <FormField component={field.DatePicker} label='At' />}</form.AppField>
        </form>
        {submitError && <span className='col-span-full text-xs text-danger'>{String(submitError)}</span>}
      </BodyComponent>
      <FooterComponent>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit} onClick={handleSubmitClick}>
              {isSubmitting ? '...' : 'Edit'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
        <ConfirmDialog>
          <ConfirmDialogContent
            message={`Really delete history ${formatDatetimeIso(defaultValuesRef.current.at)}?`}
            onConfirm={handleDeleteClick}
          />
          <ConfirmDialogTrigger variant='destructive'>Delete</ConfirmDialogTrigger>
        </ConfirmDialog>
      </FooterComponent>
    </>
  );
}
