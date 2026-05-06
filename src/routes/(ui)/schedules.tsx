import { createFileRoute } from '@tanstack/react-router';
import { Check, Pencil, X } from 'lucide-react';
import { useCallback } from 'react';

import { ScheduleSummary } from '@/components/schedule-summary';
import { Button } from '@/components/ui/button';
import { ScheduleForm } from '@/forms/schedule';
import { useDialog } from '@/hooks/dialog';
import type { ScheduleRowWithNames } from '@/hooks/query/queries/schedule';
import { useSchedulesWithNamesQuery } from '@/hooks/query/queries/schedule';
import { formatTimeIso } from '@/lib/date';

export const Route = createFileRoute('/(ui)/schedules')({
  component: SchedulesPage,
});

function SchedulesPageListRow({
  id,
  adHoc,
  amount,
  categoryName,
  itemName,
  unitName,
  time,
  completedAt,
  formattedRepeat,
  lastAmount,
}: ScheduleRowWithNames) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('schedule', id), [id, openDialog]);

  return (
    <div className='contents'>
      <span>{id}</span>
      {adHoc ? <Check className='text-success' /> : <X />}
      <span>{categoryName}</span>
      <span>{itemName}</span>
      <span>{formatTimeIso(time)}</span>
      <ScheduleSummary
        amount={amount}
        completedAt={completedAt}
        formattedRepeat={formattedRepeat}
        lastAmount={lastAmount}
        unitName={unitName}
      />
      <Button onClick={handleEditClick}>
        <Pencil />
      </Button>
    </div>
  );
}

function SchedulesPageList() {
  const query = useSchedulesWithNamesQuery();

  return (
    <div className='schedules-center grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-x-4 gap-y-2'>
      <div className='contents text-xs font-semibold'>
        <span>ID</span>
        <span>Adhoc</span>
        <span>Category</span>
        <span>Item</span>
        <span>Time</span>
        <span>Schedule</span>
        <span>Actions</span>
      </div>
      {query.data.map((schedule) => (
        <SchedulesPageListRow key={schedule.id} {...schedule} />
      ))}
    </div>
  );
}

function SchedulesPage() {
  return (
    <div className='grid gap-4'>
      <ScheduleForm mode='add' />
      <ScheduleForm mode='edit' id={1} />
      <SchedulesPageList />
    </div>
  );
}
