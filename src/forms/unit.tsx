import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { FormField } from '@/components/form-field';
import { DialogBody, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/dialogs/confirm';
import type { MultimodeDialogFormProps } from '@/dialogs/form';
import { useUnitCreateMutator, useUnitDeleteMutator, useUnitUpdateMutator } from '@/hooks/query/mutators';
import { useUnitsMapQuery } from '@/hooks/query/queries/base';
import type { UnitInsert } from '@/lib/drizzle/zod';
import { unitInsertSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';

const schema = unitInsertSchema;

type Schema = UnitInsert;

const defaults: Schema = {
  name: '',
} as const;

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function UnitForm({ asDialog, closeDialog, ...props }: MultimodeDialogFormProps) {
  const createMutator = useUnitCreateMutator();
  const updateMutator = useUnitUpdateMutator();
  const deleteMutator = useUnitDeleteMutator();
  const map = useUnitsMapQuery();

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
      const options = {
        onError(error: Error) {
          console.error('error submitting form', error);
        },
        onSuccess(data: unknown) {
          console.log('submitted form', data);
          formApi.reset({ ...defaults });
        },
      } as const;
      if (props.mode === 'new') createMutator.mutate({ data: value }, options);
      else updateMutator.mutate({ data: { id: props.id, ...value } }, options);
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

  const handleDeleteClick = useCallback(() => {
    if (!('id' in props && props.id)) return;
    deleteMutator.mutate({ data: props.id });
    form.reset({ ...defaultValues });
    closeDialog?.();
  }, [deleteMutator, props, form, defaultValues, closeDialog]);

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    },
    [form]
  );

  const [HeaderComponent, BodyComponent, FooterComponent] = asDialog
    ? [DialogHeader, DialogBody, DialogFooter]
    : ['h2', 'div', 'footer'];

  return (
    <>
      <HeaderComponent>{props.mode === 'new' ? 'New unit' : `Editing: ${defaultValues.name}`}</HeaderComponent>
      <BodyComponent className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        <form className='contents' onSubmit={handleSubmit}>
          <form.AppField name='name'>{(field) => <FormField component={field.Input} label='Name' />}</form.AppField>
        </form>
      </BodyComponent>
      <FooterComponent>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : props.mode === 'new' ? 'Create' : 'Save'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
        <ConfirmDialog>
          <ConfirmDialogContent message={`Really delete unit ${defaultValues.name}?`} onConfirm={handleDeleteClick} />
          <ConfirmDialogTrigger variant='destructive' hidden={props.mode === 'new'}>
            Delete
          </ConfirmDialogTrigger>
        </ConfirmDialog>
      </FooterComponent>
    </>
  );
}
