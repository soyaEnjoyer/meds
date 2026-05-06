import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CategoryForm } from '@/forms/category';
import { useDialog } from '@/hooks/dialog';

export function CategoryDialog() {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state.category);

  const handleOpenChange = useCallback((open: boolean) => setDialog('category', open), [setDialog]);

  const props = dialogState.id ? ({ id: dialogState.id, mode: 'edit' } as const) : ({ mode: 'add' } as const);

  const wrappedCloseDialog = useCallback(() => closeDialog('category'), [closeDialog]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent>
        <CategoryForm {...props} closeDialog={wrappedCloseDialog} />
      </DialogContent>
    </Dialog>
  );
}
