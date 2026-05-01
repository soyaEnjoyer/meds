// oxlint-disable typescript/no-unsafe-type-assertion
// oxlint-disable typescript/consistent-return
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import {
  ControlledCategoryCombobox,
  ControlledItemCombobox,
  ControlledUnitCombobox,
} from '@/components/controlled-query-combobox';
import { NumberPicker } from '@/components/number-picker';
import { CategoryCombobox, ItemCombobox, UnitCombobox } from '@/components/query-combobox';
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
    ControlledCategoryCombobox,
    ControlledItemCombobox,
    ControlledUnitCombobox,
    Input,
    ItemCombobox,
    NumberPicker,
    Select,
    Switch,
    Textarea,
    UnitCombobox,
  },
  fieldContext,
  formComponents: {
    Button,
  },
  formContext,
});
