import { createFileRoute } from '@tanstack/react-router';
import { Check, EllipsisVertical, Pencil, Settings, X } from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { ScheduleSummary } from '@/components/schedule-summary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDialog } from '@/hooks/dialog';
import { useScheduleDoneMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import type { ScheduleGroup, ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { useScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { dateAdd, formatDateIso } from '@/lib/date';

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

  const handleCustomClick = useCallback(() => openDialog('done-custom', id), [id, openDialog]);

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
      <Button onClick={handleDoneClick}>
        <Check aria-description='Done' />
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant='secondary'>
              <EllipsisVertical aria-description='Actions' />
            </Button>
          }
        />
        <PopoverContent className='flex max-w-fit gap-4'>
          <Button onClick={handleEditClick} variant='secondary'>
            <Settings aria-description='Edit' />
            Edit
          </Button>
          <Button onClick={handleSkipClick} variant='destructive'>
            <X aria-description='Skip' />
            Skip
          </Button>
          <Button onClick={handleCustomClick}>
            <Pencil aria-description='Custom' />
            Custom
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ScheduleAccordionGroup({ dueAtLabel, categoryName, items, value }: ScheduleGroup & { value: string }) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();

  const handleDoneClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scheduleDoneMutator.mutate({ data: items.map(({ id }) => ({ id })) });
    },
    [items, scheduleDoneMutator]
  );

  const handleSkipClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scheduleSkipMutator.mutate({ data: items.map(({ id }) => ({ id })) });
    },
    [items, scheduleSkipMutator]
  );

  const style: CSSProperties = useMemo(() => {
    // oxlint-disable-next-line typescript/no-misused-spread
    const hue = [...categoryName].map((char) => char.charCodeAt(0)).reduce((acc, item) => acc + item, 0) % 360;
    return {
      // background: `linear-gradient(to right, light-dark(hsl(${hue} 100% 90%), hsl(${hue} 50% 15%)) 50%, var(--color-secondary)) border-box`,
      backgroundColor: `light-dark(hsl(${hue} 100% 90%), hsl(${hue} 50% 15%))`,
    };
  }, [categoryName]);

  return (
    <AccordionItem value={value}>
      <AccordionTrigger
        className='-mx-2 flex items-center gap-4 truncate rounded-lg px-2'
        style={style}
        render={<div />}
        nativeButton={false}
      >
        <h2 className='me-auto truncate text-base'>{categoryName}</h2>
        <Badge variant='background'>{dueAtLabel}</Badge>
        <Badge variant='background'>{items.length.toLocaleString()}</Badge>
        <Button onClick={handleDoneClick}>
          <Check aria-description='Done' />
        </Button>
        <Button onClick={handleSkipClick} variant='destructive-opaque'>
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
      .filter((item) => item.dueAtIso <= formatDateIso(dateAdd(new Date(), { hour: 12 })))
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
