import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/components/dialogs/confirm';
import { FormField } from '@/components/form-field';
import { useCategoryCreateMutator, useCategoryDeleteMutator, useCategoryUpdateMutator } from '@/hooks/query/mutators';
import { useCategoriesMapQuery } from '@/hooks/query/queries/base';
import type { CategoryInsert } from '@/lib/drizzle/zod';
import { categoryInsertSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';

const schema = categoryInsertSchema;

type Schema = CategoryInsert;

const defaults: Schema = {
  name: '',
} as const;

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function CategoryForm({
  closeDialog,
  ...props
}: ({ mode: 'add' } | { mode: 'edit'; id: number }) & { closeDialog?: () => void }) {
  const createMutator = useCategoryCreateMutator();
  const updateMutator = useCategoryUpdateMutator();
  const deleteMutator = useCategoryDeleteMutator();
  const map = useCategoriesMapQuery();

  const defaultValues: Schema = useMemo(() => {
    if (props.mode === 'edit') {
      const item = map.data.get(props.id);
      if (item) return item;
    }
    return { ...defaults };
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [props, map.dataUpdatedAt]);

  const form = useAppForm({
    defaultValues,
    onSubmit({ formApi, value }) {
      console.log('onSubmit', value);
      const options = {
        onError(error: Error) {
          console.error('error submitting form', error);
        },
        onSuccess(data: unknown) {
          console.log('submitted form', data);
          formApi.reset({ ...defaults });
        },
      } as const;
      if (props.mode === 'add') createMutator.mutate({ data: value }, options);
      else updateMutator.mutate({ data: { id: props.id, ...value } }, options);
      closeDialog?.();
    },
    onSubmitInvalid({ value }) {
      console.log('onSubmitInvalid', value);
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

  const handleDeleteClick = useCallback(() => {
    if (!('id' in props && props.id)) return;
    deleteMutator.mutate({ data: props.id });
    form.reset({ ...defaultValues });
    closeDialog?.();
  }, [deleteMutator, props, form, defaultValues, closeDialog]);

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
      <h2 className='mx-auto text-base font-semibold'>
        {props.mode === 'add' ? 'Add a category' : `Editing: ${defaultValues.name}`}
      </h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        <form.AppField name='name'>{(field) => <FormField component={field.Input} label='Name' />}</form.AppField>
      </fieldset>
      <footer className='flex items-center justify-around'>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : props.mode === 'add' ? 'Add' : 'Save'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
        <ConfirmDialog>
          <ConfirmDialogContent
            message={`Really delete category ${defaultValues.name}?`}
            onConfirm={handleDeleteClick}
          />
          <ConfirmDialogTrigger variant='destructive' hidden={props.mode === 'add'} size='lg'>
            Delete
          </ConfirmDialogTrigger>
        </ConfirmDialog>
      </footer>
    </form>
  );
}
