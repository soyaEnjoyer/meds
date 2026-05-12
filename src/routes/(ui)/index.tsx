import { createFileRoute } from '@tanstack/react-router';
import { Check, ChevronDownIcon, EllipsisVertical, Logs, Pencil, Settings, X } from 'lucide-react';
import type { ComponentProps, CSSProperties, MouseEvent } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ScheduleSummary } from '@/components/schedule-summary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger } from '@/dialogs/confirm';
import { useDialog } from '@/hooks/dialog';
import { useScheduleDoneMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import type { ScheduleGroup, ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { useFilteredScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { dateAdd, dateSet, formatDatetimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

const HUE_MIN = 150;
const HUE_MAX = 280;

function ScheduleAccordionItem({
  id,
  itemName,
  ...props
}: Pick<ScheduleRowWithNames, 'id' | 'itemName'> & ComponentProps<typeof ScheduleSummary>) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('schedule', id), [id, openDialog]);

  const handleDoneClick = useCallback(() => scheduleDoneMutator.mutate({ data: [{ id }] }), [id, scheduleDoneMutator]);

  const handleSkipClick = useCallback(() => scheduleSkipMutator.mutate({ data: [{ id }] }), [id, scheduleSkipMutator]);

  const handleCustomClick = useCallback(() => openDialog('doneCustom', id), [id, openDialog]);

  const handleHistoryClick = useCallback(() => openDialog('scheduleHistory', id), [id, openDialog]);

  return (
    <div className='flex items-center gap-4'>
      <h3 className='ms-2 me-auto text-base wrap-anywhere'>{itemName}</h3>
      <ScheduleSummary {...props} />
      <Button onClick={handleDoneClick}>
        <Check aria-description='Done' />
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button variant='ghost'>
              <EllipsisVertical aria-description='Actions' />
            </Button>
          }
        />
        <PopoverContent className='grid max-w-fit grid-cols-2 gap-4'>
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
          <Button onClick={handleHistoryClick}>
            <Logs aria-description='History' />
            History
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
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scheduleDoneMutator.mutate({ data: items.map(({ id }) => ({ id })) });
    },
    [items, scheduleDoneMutator]
  );

  const handleSkipConfirm = useCallback(() => {
    scheduleSkipMutator.mutate({ data: items.map(({ id }) => ({ id })) });
  }, [items, scheduleSkipMutator]);

  const handleConfirmTriggerClick = useCallback((event: MouseEvent<HTMLButtonElement>) => event.stopPropagation(), []);

  const style: CSSProperties = useMemo(() => {
    const hue =
      // oxlint-disable-next-line typescript/no-misused-spread
      ([...categoryName]
        .map((char) => char.charCodeAt(0))
        .reduce((acc, item, i, arr) => acc + (item ^ (arr[(i + 3) % categoryName.length] * 3)), 0) %
        (HUE_MAX - HUE_MIN)) +
      HUE_MIN;

    return {
      backgroundColor: `light-dark(hsl(${hue} 65% 70%), hsl(${hue} 50% 40%))`,
    };
  }, [categoryName]);

  return (
    <ConfirmDialog>
      <ConfirmDialogContent message={`Really skip ${items.length} items?`} onConfirm={handleSkipConfirm} />
      <AccordionItem value={value}>
        <AccordionTrigger
          className='-mx-4 flex items-center gap-4 truncate p-2 scheme-only-light select-none'
          style={style}
          render={<div />}
          nativeButton={false}
        >
          <Badge variant='glass' className='size-6 rounded-full p-0 shadow-sm'>
            <ChevronDownIcon className='pointer-events-none size-full! transition-[rotate] duration-300 group-aria-expanded/accordion-trigger:-rotate-180' />
          </Badge>
          <Badge variant='glass' className='me-auto h-6 truncate text-base shadow-sm'>
            {categoryName}
          </Badge>
          {/* <h2 className='me-auto truncate text-base'>{categoryName}</h2> */}
          <Badge variant='glass' className='shadow-sm'>
            {dueAtLabel}
          </Badge>
          <Badge variant='glass' className='shadow-sm'>
            {items.length.toLocaleString()}
          </Badge>
          <Button onClick={handleDoneClick} className='shadow-sm' variant='background'>
            <Check aria-description='Done' />
          </Button>
          <ConfirmDialogTrigger variant='destructive-opaque' className='shadow-sm' onClick={handleConfirmTriggerClick}>
            <X aria-description='Skip' />
          </ConfirmDialogTrigger>
        </AccordionTrigger>
        <AccordionContent
          className='mx-0 flex flex-col gap-4 py-2 *:rounded-lg *:odd:-my-2 *:odd:bg-accent *:odd:py-2'
          panelClassName='-mx-2 bg-sidebar shadow-md rounded-b-lg'
        >
          {items.map((item) => (
            <ScheduleAccordionItem key={item.id} {...item} />
          ))}
        </AccordionContent>
      </AccordionItem>
    </ConfirmDialog>
  );
}

function SchedulePage() {
  const query = useFilteredScheduleGroupsQuery();
  const valueRef = useRef<string[]>([]);

  const getUpdatedValue = useCallback(() => {
    const openUntilIso = formatDatetimeIso(dateAdd(dateSet(new Date(), { minute: 0, ms: 0, second: 0 }), { hour: 6 }));
    const current = new Set(valueRef.current);
    const next = new Set([
      ...valueRef.current,
      ...query.data.filter(({ dueAtIso }) => dueAtIso <= openUntilIso).map(({ key }) => key),
    ]);
    if (current.symmetricDifference(next).size === 0) return valueRef.current;
    return [...next];
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]);

  const [value, setValue] = useState<string[]>(getUpdatedValue());

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  useLayoutEffect(() => {
    setValue(getUpdatedValue());
  }, [getUpdatedValue]);

  return (
    <Accordion value={value} onValueChange={setValue} multiple className='gap-2'>
      {query.data?.map((group) => (
        <ScheduleAccordionGroup {...group} key={group.key} value={group.key} />
      ))}
    </Accordion>
  );
}
