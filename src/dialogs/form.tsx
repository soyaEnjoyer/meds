import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { DialogName } from '@/hooks/dialog';
import { useDialog } from '@/hooks/dialog';

export function BasicFormDialog({
  className,
  dialogName,
  form: Form,
}: {
  className?: string;
  dialogName: DialogName;
  form: (props: { id: number; closeDialog: () => void }) => ReactNode;
}) {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state[dialogName]);

  const handleOpenChange = useCallback((open: boolean) => setDialog(dialogName, open), [dialogName, setDialog]);

  const wrappedCloseDialog = useCallback(() => closeDialog(dialogName), [closeDialog, dialogName]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className={className}>
        {dialogState.id && <Form id={dialogState.id} closeDialog={wrappedCloseDialog} />}
      </DialogContent>
    </Dialog>
  );
}

export function MultimodeFormDialog({
  className,
  dialogName,
  form: Form,
}: {
  className?: string;
  dialogName: DialogName;
  form: (props: ({ mode: 'new' } | { mode: 'edit'; id: number }) & { closeDialog: () => void }) => ReactNode;
}) {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state[dialogName]);

  const handleOpenChange = useCallback((open: boolean) => setDialog(dialogName, open), [dialogName, setDialog]);

  const props = dialogState.id ? ({ id: dialogState.id, mode: 'edit' } as const) : ({ mode: 'new' } as const);

  const wrappedCloseDialog = useCallback(() => closeDialog(dialogName), [closeDialog, dialogName]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className={className}>
        <Form {...props} closeDialog={wrappedCloseDialog} />
      </DialogContent>
    </Dialog>
  );
}
