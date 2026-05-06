import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ItemForm } from '@/forms/item';
import { useDialog } from '@/hooks/dialog';

export function ItemDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state.item);

  const handleOpenChange = useCallback((open: boolean) => setDialog('item', open), [setDialog]);

  const props = dialogState.id ? ({ id: dialogState.id, mode: 'edit' } as const) : ({ mode: 'add' } as const);

  const wrappedCloseDialog = useCallback(() => closeDialog('item'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent>
        <ItemForm {...props} closeDialog={wrappedCloseDialog} />
      </DialogContent>
    </Dialog>
  );
}
