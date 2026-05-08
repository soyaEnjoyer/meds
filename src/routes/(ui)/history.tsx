import { createFileRoute } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useCallback } from 'react';

import { DateText } from '@/components/date-text';
import { Pager } from '@/components/pager';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/hooks/dialog';
import { usePager } from '@/hooks/pager';
import { useHistoryQuery } from '@/hooks/query/queries/history';
import type { HistoryWithItemCatUnitRow } from '@/lib/drizzle/zod';

export const Route = createFileRoute('/(ui)/history')({
  component: HistoryPage,
});

function HistoryPageRow({ id, amount, unitName, createdAt, itemName, categoryName }: HistoryWithItemCatUnitRow) {
  const openDialog = useDialog((state) => state.actions.open);

  const handleEditClick = useCallback(() => openDialog('history', id), [id, openDialog]);

  return (
    <div className='contents'>
      <span>{categoryName}</span>
      <span>{itemName}</span>
      <span className='text-xs'>{(amount && `${amount} ${unitName}`) || 'Skipped'}</span>
      <DateText date={createdAt} as='date' />
      <Button onClick={handleEditClick} aria-description='Edit'>
        <Pencil />
      </Button>
    </div>
  );
}

function HistoryPage() {
  const historyQuery = useHistoryQuery();
  const pagerState = usePager((state) => state.history);

  return (
    <>
      <div className='grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 gap-y-2'>
        {historyQuery.data?.map((item) => (
          <HistoryPageRow key={item.id} {...item} />
        ))}
      </div>
      <Pager name='history' scrollTop hasNextPage={historyQuery.data?.length === pagerState.pageSize} />
    </>
  );
}
