import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { DialogName } from '@/hooks/dialog';
import { useDialog } from '@/hooks/dialog';

export interface BasicDialogFormProps {
  asDialog?: boolean;
  closeDialog: () => void;
  id: number;
}

export type MultimodeDialogFormProps = ({ mode: 'new' } | { mode: 'edit'; id: number }) & {
  asDialog?: boolean;
  closeDialog: () => void;
};

export function BasicFormDialog({
  className,
  dialogName,
  form: Form,
}: {
  className?: string;
  dialogName: DialogName;
  form: (props: BasicDialogFormProps) => ReactNode;
}) {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state[dialogName]);

  const handleOpenChange = useCallback((open: boolean) => setDialog(dialogName, open), [dialogName, setDialog]);

  const wrappedCloseDialog = useCallback(() => closeDialog(dialogName), [closeDialog, dialogName]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      {dialogState.id && (
        <DialogContent className={className}>
          <Form closeDialog={wrappedCloseDialog} id={dialogState.id} asDialog />
        </DialogContent>
      )}
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
  form: (props: MultimodeDialogFormProps) => ReactNode;
}) {
  const [closeDialog, setDialog] = useDialog((state) => [state.actions.close, state.actions.set]);
  const dialogState = useDialog((state) => state[dialogName]);

  const handleOpenChange = useCallback((open: boolean) => setDialog(dialogName, open), [dialogName, setDialog]);

  const mode = dialogState.id ? ({ id: dialogState.id, mode: 'edit' } as const) : ({ mode: 'new' } as const);

  const wrappedCloseDialog = useCallback(() => closeDialog(dialogName), [closeDialog, dialogName]);

  return (
    <Dialog open={dialogState.open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className={className}>
        <Form closeDialog={wrappedCloseDialog} asDialog {...mode} />
      </DialogContent>
    </Dialog>
  );
}
