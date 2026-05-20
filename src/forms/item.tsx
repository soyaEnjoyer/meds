import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { DialogBody, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/dialogs/confirm';
import type { MultimodeDialogFormProps } from '@/dialogs/form';
import { useItemCreateMutator, useItemDeleteMutator, useItemUpdateMutator } from '@/hooks/query/mutators';
import { useItemsMapQuery } from '@/hooks/query/queries/base';
import type { ItemInsert } from '@/lib/drizzle/zod';
import { itemInsertSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';

const editSchema = itemInsertSchema.extend({
  defaultCategoryId: z.nullable(itemInsertSchema.shape.defaultCategoryId),
  defaultUnitId: z.nullable(itemInsertSchema.shape.defaultUnitId),
});

const submitSchema = itemInsertSchema;

type EditSchema = z.infer<typeof editSchema>;
type SubmitSchema = ItemInsert;

const defaults: EditSchema = {
  defaultAmount: 1,
  defaultCategoryId: null,
  defaultUnitId: null,
  name: '',
} as const;

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function ItemForm({ asDialog, closeDialog, ...props }: MultimodeDialogFormProps) {
  const createMutator = useItemCreateMutator();
  const updateMutator = useItemUpdateMutator();
  const deleteMutator = useItemDeleteMutator();
  const map = useItemsMapQuery();

  const defaultValues: EditSchema = useMemo(() => {
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
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const typedValue = value as SubmitSchema;
      if (props.mode === 'new') createMutator.mutate({ data: typedValue }, options);
      else updateMutator.mutate({ data: { id: props.id, ...typedValue } }, options);
      closeDialog?.();
    },
    validators: {
      onSubmit: submitSchema,
    },
  });

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
      form.reset({ ...defaultValues });
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
      <HeaderComponent>{props.mode === 'new' ? 'New item' : `Editing: ${defaultValues.name}`}</HeaderComponent>
      <BodyComponent className='grid-cols-[auto_1fr] @md:grid-cols-[repeat(2,auto_1fr)]'>
        <form className='contents' onSubmit={handleSubmit}>
          <form.AppField name='name'>{(field) => <FormField component={field.Input} label='Name' />}</form.AppField>
          <form.AppField name='defaultCategoryId'>
            {(field) => <FormField component={field.CategoryCombobox} label='Default category' />}
          </form.AppField>
          <form.AppField name='defaultUnitId'>
            {(field) => <FormField component={field.UnitCombobox} label='Default unit' />}
          </form.AppField>
          <form.AppField name='defaultAmount'>
            {(field) => <FormField component={field.NumberPicker} label='Default amount' />}
          </form.AppField>
        </form>
      </BodyComponent>
      <FooterComponent>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit} onClick={handleSubmitClick}>
              {isSubmitting ? '...' : props.mode === 'new' ? 'Create' : 'Save'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='secondary' onClick={handleResetClick}>
          Reset
        </form.Button>
        <ConfirmDialog>
          <ConfirmDialogContent message={`Really delete item ${defaultValues.name}?`} onConfirm={handleDeleteClick} />
          <ConfirmDialogTrigger variant='destructive' hidden={props.mode === 'new'}>
            Delete
          </ConfirmDialogTrigger>
        </ConfirmDialog>
      </FooterComponent>
    </>
  );
}
