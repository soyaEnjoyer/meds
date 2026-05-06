import type { MouseEvent, SubmitEvent } from 'react';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

import { FormField } from '@/components/form-field';
import { useScheduleCreateMutator, useScheduleUpdateMutator } from '@/hooks/query/mutators';
import { useItemsMapQuery, useSchedulesMapQuery } from '@/hooks/query/queries/base';
import { scheduleInsertSchema } from '@/lib/drizzle/zod';
import { useAppForm } from '@/lib/form';

const editSchema = scheduleInsertSchema.extend({
  categoryId: z.nullable(scheduleInsertSchema.shape.categoryId),
  itemId: z.nullable(scheduleInsertSchema.shape.itemId),
  unitId: z.nullable(scheduleInsertSchema.shape.unitId),
});

const submitSchema = scheduleInsertSchema.transform((value) => {
  // set dueAt time (it's just a date) according to form hour and minute
  const dueAt = value.dueAt ? new Date(value.dueAt) : null;
  if (dueAt) dueAt.setHours(value.time.hour, value.time.minute, 0, 0);
  return {
    ...value,
    dueAt,
  };
});

type EditSchema = z.infer<typeof editSchema>;
type SubmitSchema = z.infer<typeof submitSchema>;

function getDefaults(): EditSchema {
  const hour = 7;
  const minute = 0;
  const startAt = new Date();
  startAt.setHours(0, 0, 0, 0);
  const dueAt = new Date();
  dueAt.setHours(hour, minute, 0, 0);
  return {
    adHoc: false,
    amount: 1,
    categoryId: null,
    cycleOffDays: 0,
    cycleOnDays: 1,
    dayMask: 127,
    dueAt,
    endAt: null,
    itemId: null,
    monthMask: 4095,
    // FIXME: i don't remember how this works. maybe should be nullable?
    repeatCount: 0,
    restDays: 0,
    sort: 49,
    startAt,
    time: { hour, minute },
    unitId: null,
  };
}

const submitSelector = (state: { canSubmit: boolean; isSubmitting: boolean }) =>
  [state.canSubmit, state.isSubmitting] as const;

export function ScheduleForm(props: { mode: 'add' } | { mode: 'edit'; id: number }) {
  const createMutator = useScheduleCreateMutator();
  const updateMutator = useScheduleUpdateMutator();
  const map = useSchedulesMapQuery();
  const itemMap = useItemsMapQuery();

  const defaultValues: EditSchema = useMemo(() => {
    if (props.mode === 'edit') {
      const item = map.data.get(props.id);
      if (item) return item;
    }
    return getDefaults();
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [props, map.dataUpdatedAt]);

  const form = useAppForm({
    defaultValues,
    onSubmit({ formApi, value }) {
      const options = {
        onError(error: Error) {
          console.error('error submitting form', error);
        },
        onSuccess(data: SubmitSchema) {
          console.log('submitted form', data);
          formApi.reset(getDefaults());
        },
      } as const;
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const typedValue = value as SubmitSchema;
      if (props.mode === 'add') createMutator.mutate({ data: typedValue }, options);
      else updateMutator.mutate({ data: { id: props.id, ...typedValue } }, options);
    },
    validators: {
      onSubmit: submitSchema,
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

  // update some fields according to item defaults on item change
  const itemIdListeners = useMemo(
    () =>
      ({
        onChange({ value }: { value: number | null }) {
          const item = typeof value === 'number' ? itemMap.data.get(value) : undefined;
          if (item) {
            form.setFieldValue('categoryId', item.defaultCategoryId);
            form.setFieldValue('unitId', item.defaultUnitId);
            form.setFieldValue('amount', item.defaultAmount);
          }
        },
      }) as const,
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
    [form, itemMap.dataUpdatedAt]
  );

  return (
    <form className='grid items-center gap-4' onSubmit={handleSubmit}>
      <h2 className='mx-auto font-semibold'>
        {props.mode === 'add'
          ? 'Add a schedule'
          : `Editing ${itemMap.data.get(defaultValues.itemId ?? -1)?.name ?? 'Unknown'}`}
      </h2>
      <div className='grid w-full grid-cols-[auto_1fr] items-center gap-4 gap-y-6 md:grid-cols-[auto_1fr_auto_1fr]'>
        <fieldset className='contents'>
          <form.AppField name='itemId' listeners={itemIdListeners}>
            {(field) => <FormField component={field.ItemCombobox} label='Item' />}
          </form.AppField>
          <form.AppField name='categoryId'>
            {(field) => <FormField component={field.CategoryCombobox} label='Category' />}
          </form.AppField>
          <form.AppField name='unitId'>
            {(field) => <FormField component={field.UnitCombobox} label='Unit' />}
          </form.AppField>
          <form.AppField name='amount'>
            {(field) => <FormField component={field.NumberPicker} label='Amount' />}
          </form.AppField>
        </fieldset>

        <fieldset className='contents'>
          <form.AppField name='cycleOnDays'>
            {(field) => <FormField component={field.NumberPicker} label='Cycle On Days' />}
          </form.AppField>
          <form.AppField name='cycleOffDays'>
            {(field) => <FormField component={field.NumberPicker} label='Cycle Off Days' />}
          </form.AppField>
          <form.AppField name='restDays'>
            {(field) => <FormField component={field.NumberPicker} label='Rest Days' />}
          </form.AppField>
          <form.AppField name='repeatCount'>
            {(field) => <FormField component={field.NumberPicker} label='Repeat Count' />}
          </form.AppField>
          <form.AppField name='dayMask'>
            {(field) => <FormField component={field.DayPicker} label='Days' />}
          </form.AppField>
          <form.AppField name='monthMask'>
            {(field) => <FormField component={field.MonthPicker} label='Months' />}
          </form.AppField>
          <form.AppField name='time'>
            {(field) => <FormField component={field.TimePicker} label='Time' />}
          </form.AppField>
        </fieldset>

        <fieldset className='contents'>
          <form.AppField name='adHoc'>{(field) => <FormField component={field.Switch} label='Ad hoc' />}</form.AppField>
          <form.AppField name='sort'>
            {(field) => <FormField component={field.NumberPicker} label='Sort' />}
          </form.AppField>
        </fieldset>

        <fieldset className='contents'>
          <form.AppField name='startAt'>
            {(field) => <FormField component={field.DatePicker} label='Start' />}
          </form.AppField>
          <form.AppField name='endAt'>
            {(field) => <FormField component={field.DatePicker} label='End' />}
          </form.AppField>
          <form.AppField name='dueAt'>
            {/* TODO: onSubmit, set the hours and minutes according to form data */}
            {(field) => <FormField component={field.DatePicker} label='Due' />}
          </form.AppField>
        </fieldset>
      </div>

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
