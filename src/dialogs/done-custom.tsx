import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DoneCustomForm } from '@/forms/done-custom';
import { useDialog } from '@/hooks/dialog';

export function DoneCustomDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state.doneCustom);

  const handleOpenChange = useCallback((open: boolean) => setDialog('doneCustom', open), [setDialog]);

  const wrappedCloseDialog = useCallback(() => closeDialog('doneCustom'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className='xl:max-w-xl'>
        {dialogState.id && <DoneCustomForm id={dialogState.id} closeDialog={wrappedCloseDialog} />}
      </DialogContent>
    </Dialog>
  );
}
