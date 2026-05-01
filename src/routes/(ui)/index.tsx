import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useScheduleDoneMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import type { ScheduleGroup, ScheduleItem } from '@/hooks/query/queries/schedule';
import { useScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { dateAdd, formatDatetimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

function ScheuleAccordionItem({ id, itemName, amount, unitName, dueAt, completedAt }: ScheduleItem) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();

  const handleDoneClick = useCallback(() => scheduleDoneMutator.mutate({ data: [{ id }] }), [id, scheduleDoneMutator]);
  const handleSkipClick = useCallback(() => scheduleSkipMutator.mutate({ data: [{ id }] }), [id, scheduleSkipMutator]);

  return (
    <div className='ms-2 me-8 flex items-center gap-4'>
      <h3 className='me-auto text-base'>{itemName}</h3>
      <span>
        {amount} {unitName}
      </span>
      <span>{formatDatetimeIso(dueAt)}</span>
      <span>{formatDatetimeIso(completedAt)}</span>
      <Button onClick={handleDoneClick}>Done</Button>
      <Button onClick={handleSkipClick}>Skip</Button>
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
        <span>{dueAtIso}</span>
        <h2 className='me-auto text-base'>{categoryName}</h2>
        <Button onClick={handleDoneClick}>Done</Button>
        <Button onClick={handleSkipClick}>Skip</Button>
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
