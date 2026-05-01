import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { FormField } from '@/components/form-field';
import { useUnitCreateMutator, useUnitUpdateMutator } from '@/hooks/query/mutators';
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

export function UnitForm(props: { mode: 'add' } | { mode: 'edit'; id: number }) {
  const createMutator = useUnitCreateMutator();
  const updateMutator = useUnitUpdateMutator();
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
          console.log('subitted form', data);
          formApi.reset({ ...defaults });
        },
      } as const;
      if (props.mode === 'add') createMutator.mutate({ data: value }, options);
      else updateMutator.mutate({ data: { id: props.id, ...value } }, options);
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
      <h2 className='mx-auto font-semibold'>{props.mode === 'add' ? 'Add a unit' : `Editing ${defaultValues.name}`}</h2>
      <fieldset className='grid w-full grid-cols-[auto_1fr] items-center gap-2'>
        <form.AppField name='name'>{(field) => <FormField component={field.Input} label='Name' />}</form.AppField>
      </fieldset>
      <footer className='flex items-center justify-around'>
        <form.Subscribe selector={submitSelector}>
          {([canSubmit, isSubmitting]) => (
            <form.Button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : props.mode === 'add' ? 'Add' : 'Edit'}
            </form.Button>
          )}
        </form.Subscribe>
        <form.Button type='reset' variant='destructive' onClick={handleResetClick}>
          Reset
        </form.Button>
      </footer>
    </form>
  );
}
