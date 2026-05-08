import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScheduleForm } from '@/forms/schedule';
import { useDialog } from '@/hooks/dialog';

export function ScheduleDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state.schedule);

  const handleOpenChange = useCallback((open: boolean) => setDialog('schedule', open), [setDialog]);

  const props = dialogState.id ? ({ id: dialogState.id, mode: 'edit' } as const) : ({ mode: 'add' } as const);

  const wrappedCloseDialog = useCallback(() => closeDialog('schedule'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className='xl:max-w-xl'>
        <ScheduleForm {...props} closeDialog={wrappedCloseDialog} />
      </DialogContent>
    </Dialog>
  );
}
