import { Calendar, Pill, RotateCw } from 'lucide-react';
import { useMemo, type ReactElement, type ReactNode } from 'react';

import { DateText } from '@/components/date-text';
import type { ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { daysDiff } from '@/lib/date';
import { months, weekdays, type MonthTuple, type WeekdayTuple } from '@/lib/enums';
import { cn } from '@/lib/utils';

export const REPEAT_RULE_DAY_LENGTH = 2;
export const REPEAT_RULE_MONTH_LENGTH = 3;

function formatRepeatRules({
  cycleOffDays,
  cycleOnDays,
  dayMask,
  dueAt,
  monthMask,
  restDays,
  startAt,
}: Pick<
  ScheduleRowWithNames,
  'cycleOffDays' | 'cycleOnDays' | 'dayMask' | 'dueAt' | 'monthMask' | 'restDays' | 'startAt'
>): string | null {
  if (dueAt === null || dayMask === 0 || monthMask === 0) return 'Never';
  const items: (string | { toString: () => string })[] = [];
  if (restDays) items.push(`${restDays + 1}d`);
  if (cycleOffDays) {
    const cycleLength = cycleOnDays + cycleOffDays;
    const cycleDay = daysDiff(startAt, new Date()) % cycleLength;
    if (cycleOffDays) items.push(cycleOnDays, cycleOffDays, cycleDay);
  }
  if (dayMask < 127)
    items.push(
      weekdays
        .reduce<WeekdayTuple[][]>((acc, item) => {
          if (!(item[0] & dayMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 1) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_DAY_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_DAY_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_DAY_LENGTH)}`
        )
        .join(', ')
    );
  if (monthMask < 4095)
    items.push(
      months
        .reduce<MonthTuple[][]>((acc, item) => {
          if (!(item[0] & monthMask)) return acc;
          const prev = acc.at(-1)?.at(-1);
          if (typeof prev === 'undefined' || prev[0] !== item[0] >> 1) acc.push([item]);
          else acc[acc.length - 1].push(item);
          return acc;
        }, [])
        .map((group) =>
          group.length === 1
            ? group[0][1].slice(0, REPEAT_RULE_MONTH_LENGTH)
            : `${group[0][1].slice(0, REPEAT_RULE_MONTH_LENGTH)}-${group[group.length - 1][1].slice(0, REPEAT_RULE_MONTH_LENGTH)}`
        )
        .join(', ')
    );

  return items.length ? items.join('/') : null;
}

function formatAmount({
  amount,
  lastAmount,
  unitName,
}: Pick<ScheduleRowWithNames, 'amount' | 'lastAmount' | 'unitName'>): string | null {
  if (amount === 1 && (lastAmount ?? 1) === 1) return null;
  return [
    amount,
    ...((lastAmount ?? amount) === amount ? [] : [`(${lastAmount})`]),
    ...(unitName?.length ? [unitName] : []),
  ].join(' ');
}

function ScheduleSummarySection({
  className,
  children,
  icon: Icon,
}: {
  className?: string;
  children: ReactElement | string;
  icon: (props: { className?: string }) => ReactNode;
}) {
  return (
    <span className='inline-flex items-center gap-1'>
      <Icon className={cn('size-3', className)} />
      {children}
    </span>
  );
}

export function ScheduleSummary({
  amount,
  completedAt,
  lastAmount,
  unitName,
  cycleOffDays,
  cycleOnDays,
  dayMask,
  dueAt,
  monthMask,
  restDays,
  skippedAt,
  startAt,
  className,
}: Pick<
  ScheduleRowWithNames,
  | 'amount'
  | 'completedAt'
  | 'lastAmount'
  | 'unitName'
  | 'cycleOffDays'
  | 'cycleOnDays'
  | 'dayMask'
  | 'dueAt'
  | 'monthMask'
  | 'restDays'
  | 'skippedAt'
  | 'startAt'
> & { className?: string }) {
  const formattedAmount = useMemo(() => formatAmount({ amount, lastAmount, unitName }), [amount, lastAmount, unitName]);

  const formattedRepeat = useMemo(
    () => formatRepeatRules({ cycleOffDays, cycleOnDays, dayMask, dueAt, monthMask, restDays, startAt }),
    [cycleOffDays, cycleOnDays, dayMask, dueAt, monthMask, restDays, startAt]
  );

  return (
    <div className={cn('flex flex-wrap justify-end gap-x-2 truncate text-xs **:truncate', className)}>
      {completedAt && (
        <ScheduleSummarySection
          icon={Calendar}
          className={skippedAt && skippedAt > completedAt ? 'text-danger' : undefined}
        >
          <DateText date={completedAt} as='dist' size='xs' />
        </ScheduleSummarySection>
      )}
      {formattedRepeat && <ScheduleSummarySection icon={RotateCw}>{formattedRepeat}</ScheduleSummarySection>}
      {formattedAmount && <ScheduleSummarySection icon={Pill}>{formattedAmount}</ScheduleSummarySection>}
    </div>
  );
}
