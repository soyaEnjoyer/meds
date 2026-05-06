import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { DatePicker } from '@/components/date-picker';
import { DayPicker } from '@/components/day-picker';
import { MonthPicker } from '@/components/month-picker';
import { NumberPicker } from '@/components/number-picker';
import { CategoryCombobox, ItemCombobox, UnitCombobox } from '@/components/query-combobox';
import { TimePicker } from '@/components/time-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// https://tanstack.com/form/latest/docs/framework/react/guides/form-composition

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    CategoryCombobox,
    DatePicker,
    DayPicker,
    Input,
    ItemCombobox,
    MonthPicker,
    NumberPicker,
    Select,
    Switch,
    Textarea,
    TimePicker,
    UnitCombobox,
  },
  fieldContext,
  formComponents: {
    Button,
  },
  formContext,
});
