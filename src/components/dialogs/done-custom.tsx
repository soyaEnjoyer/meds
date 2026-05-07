import { useCallback } from 'react';

import { DoneCustomForm } from '@/components/forms/done-custom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDialog } from '@/hooks/dialog';

export function DoneCustomDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state['done-custom']);

  const handleOpenChange = useCallback((open: boolean) => setDialog('done-custom', open), [setDialog]);

  const wrappedCloseDialog = useCallback(() => closeDialog('done-custom'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className='xl:max-w-xl'>
        {dialogState.id && <DoneCustomForm id={dialogState.id} closeDialog={wrappedCloseDialog} />}
      </DialogContent>
    </Dialog>
  );
}
