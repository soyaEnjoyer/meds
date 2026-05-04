import { createFileRoute } from '@tanstack/react-router';
import { Calendar, Check, Pencil, Pill, RotateCw, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import { DateText } from '@/components/date';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useScheduleDoneMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import type { ScheduleGroup, ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { useScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { dateAdd, formatDatetimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

function ScheduleSummary({
  amount,
  completedAt,
  lastAmount,
  unitName,
  formattedRepeat,
}: Pick<ScheduleRowWithNames, 'amount' | 'completedAt' | 'lastAmount' | 'formattedRepeat' | 'unitName'>) {
  return (
    <div className='flex flex-wrap justify-end gap-x-2 truncate text-xs **:truncate'>
      <span className='inline-flex items-center gap-1'>
        <Calendar className='size-3' />
        <DateText date={completedAt} as='dist' />
      </span>
      <span className='inline-flex items-center gap-1'>
        <RotateCw className='size-3' />
        {formattedRepeat}
      </span>
      {amount === 1 && (lastAmount ?? 1) === amount ? null : (
        <span className='inline-flex items-center gap-1'>
          <Pill className='size-3' />
          {[amount, (lastAmount ?? amount) === amount ? null : `(${lastAmount})`, unitName || null]
            .filter((item) => item)
            .join(' ')}
        </span>
      )}
    </div>
  );
}

function ScheuleAccordionItem({
  amount,
  completedAt,
  id,
  itemName,
  lastAmount,
  formattedRepeat,
  unitName,
}: ScheduleRowWithNames) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();

  const handleDoneClick = useCallback(() => scheduleDoneMutator.mutate({ data: [{ id }] }), [id, scheduleDoneMutator]);

  const handleSkipClick = useCallback(() => scheduleSkipMutator.mutate({ data: [{ id }] }), [id, scheduleSkipMutator]);

  return (
    <div className='ms-2 flex items-center gap-4'>
      <h3 className='me-auto text-sm wrap-anywhere'>{itemName}</h3>
      <ScheduleSummary
        amount={amount}
        completedAt={completedAt}
        lastAmount={lastAmount}
        formattedRepeat={formattedRepeat}
        unitName={unitName}
      />
      <Button variant='secondary'>
        <Pencil aria-description='Edit' />
      </Button>
      <Button onClick={handleDoneClick}>
        <Check aria-description='Done' />
      </Button>
      <Button onClick={handleSkipClick} variant='destructive'>
        <X aria-description='Skip' />
      </Button>
    </div>
  );
}

function ScheduleAccordionGroup({ dueAtIso, categoryName, items, value }: ScheduleGroup & { value: string }) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();

  const handleDoneClick = useCallback(
    () => scheduleDoneMutator.mutate({ data: items.map(({ id }) => ({ id })) }),
    [items, scheduleDoneMutator]
  );

  const handleSkipClick = useCallback(
    () => scheduleSkipMutator.mutate({ data: items.map(({ id }) => ({ id })) }),
    [items, scheduleSkipMutator]
  );

  return (
    <AccordionItem value={value}>
      <AccordionTrigger className='flex items-center gap-4'>
        <h2 className='me-auto text-base'>{categoryName}</h2>
        <span>{dueAtIso}</span>
        <Button onClick={handleDoneClick}>
          <Check aria-description='Done' />
        </Button>
        <Button onClick={handleSkipClick} variant='destructive'>
          <X aria-description='Skip' />
        </Button>
      </AccordionTrigger>
      <AccordionContent className='flex flex-col gap-2'>
        {items.map((item) => (
          <ScheuleAccordionItem key={item.id} {...item} />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

function SchedulePage() {
  const scheduleGroups = useScheduleGroupsQuery();
  const [accordionValue, setAccordionValue] = useState<string[]>(
    scheduleGroups.data
      .filter((item) => item.dueAtIso < formatDatetimeIso(dateAdd(new Date(), { hour: 6 })))
      .map((item) => item.key) ?? []
  );

  return (
    <Accordion value={accordionValue} onValueChange={setAccordionValue} multiple>
      {scheduleGroups.data?.map((group) => (
        <ScheduleAccordionGroup {...group} key={group.key} value={group.key} />
      ))}
    </Accordion>
  );
}
