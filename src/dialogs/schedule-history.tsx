import { Pencil } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { DateText } from '@/components/date-text';
import { Pager } from '@/components/pager';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { useDialog } from '@/hooks/dialog';
import { usePager } from '@/hooks/pager';
import { useItemsMapQuery, useSchedulesMapQuery } from '@/hooks/query/queries/base';
import { useScheduleHistoryQuery } from '@/hooks/query/queries/history';
import type { HistoryWithItemCatUnitRow } from '@/lib/drizzle/zod';

function ScheduleHistoryDialogRow({ id, at, amount, unitName }: HistoryWithItemCatUnitRow) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('history', id), [id, openDialog]);

  return (
    <div className='contents transition-in-up'>
      <DateText date={at} as='date' />
      <DateText date={at} as='dist' className='me-auto' />
      <span className='text-xs'>{(amount && `${amount} ${unitName}`) || 'Skipped'}</span>
      <Button onClick={handleEditClick} aria-description='Edit'>
        <Pencil />
      </Button>
    </div>
  );
}

export function ScheduleHistoryDialog() {
  const setDialog = useDialog((state) => state.actions.set);
  const dialogState = useDialog((state) => state.scheduleHistory);
  const query = useScheduleHistoryQuery();
  const pagerState = usePager((state) => state.scheduleHistory);
  const scheduleMapQuery = useSchedulesMapQuery();
  const itemMapQuery = useItemsMapQuery();

  const itemName = useMemo(() => {
    const schedule = scheduleMapQuery.data.get(dialogState.id ?? -1);
    const item = itemMapQuery.data.get(schedule?.itemId ?? -1);
    return item?.name ?? 'Item';
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [dialogState.id, scheduleMapQuery.dataUpdatedAt, itemMapQuery.dataUpdatedAt]);

  const handleOpenChange = useCallback((open: boolean) => setDialog('scheduleHistory', open), [setDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent>
        <DialogHeader>History: {itemName}</DialogHeader>
        <DialogBody className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 gap-y-2'>
          {!query.data?.length ? (
            <div className='col-span-full flex items-center justify-center gap-2 p-4 text-muted-foreground'>
              No data
            </div>
          ) : (
            query.data.map((item) => <ScheduleHistoryDialogRow key={item.id} {...item} />)
          )}
        </DialogBody>
        <DialogFooter>
          <Pager name='scheduleHistory' hasNextPage={query.data?.length === pagerState.pageSize} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
