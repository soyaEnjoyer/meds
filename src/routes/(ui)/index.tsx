import { createFileRoute } from '@tanstack/react-router';
import { Check, Pencil, X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { ScheduleSummary } from '@/components/schedule-summary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/dialog';
import { useScheduleDoneMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import type { ScheduleGroup, ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { useScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { dateAdd, formatDatetimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

function ScheduleAccordionItem({
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
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('schedule', id), [openDialog, id]);

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
      <Button variant='secondary' onClick={handleEditClick}>
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

  const style: CSSProperties = useMemo(() => {
    // oxlint-disable-next-line typescript/no-misused-spread
    const hue = [...categoryName].map((char) => char.charCodeAt(0)).reduce((acc, item) => acc + item, 0) % 360;
    return {
      backgroundColor: `light-dark(hsl(${hue} 100% 90%), hsl(${hue} 50% 15%))`,
    };
  }, [categoryName]);

  return (
    <AccordionItem value={value}>
      <AccordionTrigger
        className='-mx-2 flex items-center gap-4 rounded-lg px-2'
        style={style}
        render={<div />}
        nativeButton={false}
      >
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
          <ScheduleAccordionItem key={item.id} {...item} />
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
