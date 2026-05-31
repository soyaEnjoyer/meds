import type { ComponentProps, Dispatch, MouseEvent, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';

interface Context {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const Context = createContext<Context | null>(null);

export function ConfirmDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value: Context = useMemo(() => ({ open, setOpen }), [open]);
  return <Context value={value}>{children}</Context>;
}

export function useConfirmDialog(): Context {
  const context = useContext(Context);
  if (!context) throw new Error('useConfirmDialog must be used underneath a ConfirmDialog');
  return context;
}

export function ConfirmDialogContent({
  title = 'Confirm delete',
  message,
  onConfirm,
}: {
  title?: string;
  message: string;
  onConfirm: () => void;
}) {
  const { open, setOpen } = useConfirmDialog();
  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogContent>
        <DialogHeader>{title}</DialogHeader>
        <DialogBody className='col-span-full flex items-center justify-center gap-2 p-4 text-destructive'>
          {message}
        </DialogBody>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant='default' size='lg'>
                Cancel
              </Button>
            }
          />
          <DialogClose
            render={
              <Button variant='destructive' onClick={onConfirm}>
                Confirm
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialogTrigger({
  onClick,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick'> & { onClick?: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const { setOpen } = useConfirmDialog();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      onClick?.(event);
    },
    [onClick, setOpen]
  );

  return <Button onClick={handleClick} {...props} />;
}
