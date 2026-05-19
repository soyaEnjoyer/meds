'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, type ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextData {
  disablePointerDismissal: boolean | undefined;
}

const Context = createContext<ContextData | null>(null);

export function Dialog({ disablePointerDismissal, ...props }: DialogPrimitive.Root.Props) {
  const value: ContextData = useMemo(
    () => ({
      disablePointerDismissal,
    }),
    [disablePointerDismissal]
  );

  return (
    <Context value={value}>
      <DialogPrimitive.Root data-slot='dialog' disablePointerDismissal={disablePointerDismissal} {...props} />
    </Context>
  );
}

export function useDialogContext(): ContextData {
  const context = useContext(Context);
  if (!context) throw new Error('useDialogContext must be used underneath a Dialog');
  return context;
}

export function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

export function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

export function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

export function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot='dialog-overlay'
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/10  supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  );
}

export function DialogContent({ className, children, ref, ...props }: DialogPrimitive.Popup.Props) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = ref ?? localRef;
  const { disablePointerDismissal } = useDialogContext();

  const handleOverlayClick = useCallback(() => {
    if (typeof mergedRef !== 'function' && disablePointerDismissal)
      mergedRef.current?.animate([{ scale: '100%' }, { scale: '105%' }, { scale: '100%' }], {
        duration: 150,
        easing: 'ease-in-out',
      });
  }, [disablePointerDismissal, mergedRef]);

  return (
    <DialogPortal>
      <DialogOverlay onClick={handleOverlayClick} />
      <DialogPrimitive.Popup
        data-slot='dialog-content'
        className={cn(
          'fixed inset-0 m-auto z-50 w-full h-fit max-w-[calc(100dvw-2rem)] rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-hidden gap-0 flex flex-col @container',
          className
        )}
        ref={mergedRef}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  children,
  withCloseButton = true,
  ...props
}: ComponentProps<'div'> & { withCloseButton?: boolean }) {
  return (
    <div
      data-slot='dialog-header'
      className={cn(
        'rounded-t-xl border-b bg-muted/50 p-4 flex flex-col gap-4 items-center justify-center text-base font-semibold',
        className
      )}
      {...props}
    >
      {children}
      {withCloseButton && (
        <DialogPrimitive.Close
          data-slot='dialog-close'
          render={<Button variant='ghost' className='absolute top-2 right-2' size='icon-sm' />}
        >
          <XIcon />
          <span className='sr-only'>Close</span>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

export function DialogBody({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('max-h-full overflow-y-auto p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn('flex gap-4 rounded-b-xl border-t bg-muted/50 p-4 justify-around', className)}
      {...props}
    >
      {children}
      {showCloseButton && <DialogPrimitive.Close render={<Button variant='outline' />}>Close</DialogPrimitive.Close>}
    </div>
  );
}

export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('text-base leading-none font-medium', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}
