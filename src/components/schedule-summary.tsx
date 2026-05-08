import { Calendar, Pill, RotateCw } from 'lucide-react';

import { DateText } from '@/components/date-text';
import type { ScheduleRowWithNames } from '@/hooks/query/queries/schedule';

export function ScheduleSummary({
  amount,
  completedAt,
  lastAmount,
  unitName,
  formattedRepeat,
}: Pick<ScheduleRowWithNames, 'amount' | 'completedAt' | 'lastAmount' | 'formattedRepeat' | 'unitName'>) {
  return (
    <div className='flex flex-wrap justify-end gap-x-2 truncate text-xs **:truncate'>
      {completedAt && (
        <span className='inline-flex items-center gap-1'>
          <Calendar className='size-3' />
          <DateText date={completedAt} as='dist' />
        </span>
      )}
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
