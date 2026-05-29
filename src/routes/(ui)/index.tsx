import type { DefinedUseQueryResult } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, ChevronDownIcon, Clock, EllipsisVertical, Info, Logs, Pencil, Settings, Star, X } from 'lucide-react';
import type { ComponentProps, CSSProperties, MouseEvent } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Linkify } from '@/components/linkify';
import { ScheduleSummary } from '@/components/schedule-summary';
import { ScrollTopButton } from '@/components/scroll-top-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDialog } from '@/hooks/dialog';
import { useScheduleDoneMutator, useScheduleRescheduleMutator, useScheduleSkipMutator } from '@/hooks/query/mutators';
import { useCategoriesQuery } from '@/hooks/query/queries/base';
import type { ScheduleGroup, ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { ACCORDION_PRE_EXPAND_HOURS, useFilteredScheduleGroupsQuery } from '@/hooks/query/queries/schedule';
import { useTheme } from '@/hooks/theme';
import { dateAdd, dateMax, dateSet, formatDatetimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/')({
  component: SchedulePage,
});

const SNOOZE_HOURS = 6;

function ScheduleAccordionItemName({
  itemName,
  withInfo,
  withStar,
}: {
  itemName: string | undefined;
  withInfo?: boolean;
  withStar?: boolean;
}) {
  return (
    <h3 className='group me-auto flex shrink-0 grow items-center gap-1 text-base wrap-anywhere'>
      {withInfo && (
        <Info className='ite size-4 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary' />
      )}
      {withStar && (
        <Star className='size-4 text-muted-foreground transition-colors group-hover:text-primary group-active:text-primary' />
      )}
      {itemName}
    </h3>
  );
}

function ScheduleAccordionItem({
  amount,
  description,
  id,
  itemName,
  siblings,
  ...props
}: Pick<ScheduleRowWithNames, 'amount' | 'description' | 'id' | 'itemName'> &
  ComponentProps<typeof ScheduleSummary> & { siblings: Pick<ScheduleRowWithNames, 'id'>[] }) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();
  const scheduleRescheduleMutator = useScheduleRescheduleMutator();

  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('schedule', id), [id, openDialog]);

  const handleDoneClick = useCallback(() => scheduleDoneMutator.mutate({ data: [{ id }] }), [id, scheduleDoneMutator]);

  const handleSkipClick = useCallback(
    () => scheduleSkipMutator.mutate({ data: { ids: [id] } }),
    [id, scheduleSkipMutator]
  );

  const handleSkipSiblingsClick = useCallback(() => {
    const siblingIds = siblings.map((item) => item.id).filter((item) => item !== id);
    if (siblingIds.length) scheduleSkipMutator.mutate({ data: { ids: siblingIds } });
  }, [id, siblings, scheduleSkipMutator]);

  const handleCustomClick = useCallback(() => openDialog('doneCustom', id), [id, openDialog]);

  const handleHistoryClick = useCallback(() => openDialog('scheduleHistory', id), [id, openDialog]);

  const handleSnoozeClick = useCallback(() => {
    const now = new Date();
    scheduleRescheduleMutator.mutate({
      data: {
        ids: [id],
        to: dateAdd(dateSet(props.dueAt ? dateMax(props.dueAt, now) : now, { minute: 0, ms: 0, second: 0 }), {
          hour: SNOOZE_HOURS,
        }),
      },
    });
  }, [props.dueAt, id, scheduleRescheduleMutator]);

  const withStar = props.dayMask < 127 || props.monthMask < 4095 || props.restDays > 0 || props.cycleOffDays > 0;

  return (
    <div className='flex items-center gap-4 ps-2 md:ps-4 md:pe-2'>
      {description ? (
        <Popover>
          <PopoverTrigger
            render={<ScheduleAccordionItemName itemName={itemName} withInfo withStar={withStar} />}
            nativeButton={false}
          />
          <PopoverContent className='max-w-fit whitespace-pre-wrap' align='start'>
            <Linkify>{description}</Linkify>
          </PopoverContent>
        </Popover>
      ) : (
        <ScheduleAccordionItemName itemName={itemName} withStar={withStar} />
      )}
      <ScheduleSummary className='shrink grow-0' amount={amount} {...props} />
      <Button onClick={amount ? handleDoneClick : handleCustomClick}>
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
        <PopoverContent className='grid max-w-fit grid-cols-2 gap-4' align='end'>
          <PopoverClose
            render={
              <Button onClick={handleSkipClick} variant='destructive'>
                <X aria-description='Skip' />
                Skip
              </Button>
            }
          />
          <PopoverClose
            disabled={siblings.length < 2}
            render={
              <Button onClick={handleSkipSiblingsClick} variant='destructive'>
                <X aria-description='Skip siblings' />
                Others
              </Button>
            }
          />
          <PopoverClose
            render={
              <Button onClick={handleSnoozeClick} variant='secondary'>
                <Clock aria-description='Snooze' />
                Snooze
              </Button>
            }
          />
          <PopoverClose
            disabled={!amount}
            render={
              <Button onClick={handleCustomClick} variant='secondary'>
                <Pencil aria-description='Custom' />
                Custom
              </Button>
            }
          />
          <PopoverClose
            render={
              <Button onClick={handleHistoryClick} variant='secondary'>
                <Logs aria-description='History' />
                History
              </Button>
            }
          />
          <PopoverClose
            render={
              <Button onClick={handleEditClick}>
                <Settings aria-description='Edit' />
                Edit
              </Button>
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ScheduleAccordionGroup({
  categoryId,
  categoryName,
  dueAtLabel,
  dueAtTs,
  items,
  value,
}: ScheduleGroup & { value: string }) {
  const scheduleDoneMutator = useScheduleDoneMutator();
  const scheduleSkipMutator = useScheduleSkipMutator();
  const scheduleRescheduleMutator = useScheduleRescheduleMutator();
  const categoriesQuery = useCategoriesQuery();
  const [hueCenter, hueWidth] = useTheme((state) => [state.hueCenter, state.hueWidth]);

  const handleDoneClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      scheduleDoneMutator.mutate({ data: items.filter(({ amount }) => amount).map(({ id }) => ({ id })) });
    },
    [items, scheduleDoneMutator]
  );

  const handleSkipClick = useCallback(() => {
    scheduleSkipMutator.mutate({ data: { ids: items.map(({ id }) => id) } });
  }, [items, scheduleSkipMutator]);

  const handleSnoozeClick = useCallback(() => {
    const now = new Date();
    scheduleRescheduleMutator.mutate({
      data: {
        ids: items.map(({ id }) => id),
        to: dateAdd(
          dateSet(dueAtTs < Infinity ? dateMax(new Date(dueAtTs), now) : now, { minute: 0, ms: 0, second: 0 }),
          {
            hour: SNOOZE_HOURS,
          }
        ),
      },
    });
  }, [dueAtTs, items, scheduleRescheduleMutator]);

  const handlePopoverTriggerClick = useCallback((event: MouseEvent<HTMLButtonElement>) => event.stopPropagation(), []);

  const style: CSSProperties = useMemo(() => {
    const hue =
      categoriesQuery.data.map(({ id }) => id).reduce((acc, id, i) => acc + (id === categoryId ? i : 0), 0) *
        (1 / categoriesQuery.data.length) *
        hueWidth +
      (hueCenter - hueWidth / 2);

    return {
      backgroundColor: `light-dark(hsl(${hue} 65% 70%), hsl(${hue} 65% 40%))`,
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName, categoriesQuery.dataUpdatedAt, hueCenter, hueWidth]);

  return (
    <Popover>
      <AccordionItem value={value} className='w-[min(100dvw,--spacing(168))] snap-start'>
        <AccordionTrigger
          className='flex items-center gap-4 truncate p-2 select-none *:scheme-only-light md:px-4'
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
          <Button
            onClick={handleDoneClick}
            className='shadow-sm'
            variant='background'
            disabled={!items.filter(({ amount }) => amount).length}
          >
            <Check aria-description='Done' />
          </Button>
          <PopoverTrigger
            render={
              <Button variant='ghost' onClick={handlePopoverTriggerClick}>
                <EllipsisVertical aria-description='Actions' />
              </Button>
            }
          />
        </AccordionTrigger>
        <AccordionContent
          className='mx-0 flex flex-col gap-4 py-2 *:rounded-lg *:odd:-my-2 *:odd:bg-accent *:odd:py-2'
          panelClassName='mx-2 bg-sidebar shadow-md rounded-b-lg snap-start'
        >
          {items.map((item) => (
            <ScheduleAccordionItem key={item.id} siblings={items} {...item} />
          ))}
        </AccordionContent>
      </AccordionItem>
      <PopoverContent className='grid max-w-fit grid-cols-2 gap-4' align='end'>
        <PopoverClose
          render={
            <Button onClick={handleSkipClick} variant='destructive'>
              <X aria-description='Skip' />
              Skip
            </Button>
          }
        />
        <PopoverClose
          render={
            <Button onClick={handleSnoozeClick}>
              <Clock aria-description='Snooze' />
              Snooze
            </Button>
          }
        />
      </PopoverContent>
    </Popover>
  );
}

function ScheduleAccordion({ query }: { query: DefinedUseQueryResult<ScheduleGroup[]> }) {
  const [value, setValue] = useState<string[]>([]);
  const valueRef = useRef<string[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);

  const setValueShim = useCallback((nextValue: string[]) => {
    setValue(nextValue);
    valueRef.current = nextValue;
  }, []);

  useLayoutEffect(() => {
    const openUntilIso = formatDatetimeIso(
      dateAdd(dateSet(new Date(), { minute: 0, ms: 0, second: 0 }), { hour: ACCORDION_PRE_EXPAND_HOURS })
    );
    const current = new Set(valueRef.current);
    const next = new Set([
      ...valueRef.current,
      ...query.data.filter(({ dueAtIso }) => dueAtIso <= openUntilIso).map(({ key }) => key),
    ]);
    if (current.symmetricDifference(next).size === 0) return;
    setValueShim([...next]);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, setValueShim]);

  const handleScrollTopClick = useCallback(() => {
    const openUntilIso = formatDatetimeIso(
      dateAdd(dateSet(new Date(), { minute: 0, ms: 0, second: 0 }), { hour: ACCORDION_PRE_EXPAND_HOURS })
    );
    setValueShim(query.data.filter(({ dueAtIso }) => dueAtIso <= openUntilIso).map(({ key }) => key));
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt, setValueShim]);

  return (
    <>
      <Accordion
        value={value}
        onValueChange={setValueShim}
        multiple
        className='-mt-16 max-h-dvh snap-y snap-proximity items-center gap-2 overflow-y-scroll pt-16 pb-2 *:scroll-mt-16'
        ref={ref}
      >
        {query.data?.map((group) => (
          <ScheduleAccordionGroup {...group} key={group.key} value={group.key} />
        ))}
      </Accordion>
      <ScrollTopButton elementRef={ref} onClick={handleScrollTopClick} />
    </>
  );
}

function SchedulePage() {
  const query = useFilteredScheduleGroupsQuery();
  return <ScheduleAccordion query={query} />;
}
