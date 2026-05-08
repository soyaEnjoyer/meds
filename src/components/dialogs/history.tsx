import { useCallback } from 'react';

import { HistoryForm } from '@/components/forms/history';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDialog } from '@/hooks/dialog';

export function HistoryDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state.history);

  const handleOpenChange = useCallback((open: boolean) => setDialog('history', open), [setDialog]);

  const wrappedCloseDialog = useCallback(() => closeDialog('history'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent>
        {dialogState.id && dialogState.open && <HistoryForm id={dialogState.id} closeDialog={wrappedCloseDialog} />}
      </DialogContent>
    </Dialog>
  );
}
