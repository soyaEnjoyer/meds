import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, memo, useContext } from 'react';
import type { ExtractState } from 'zustand';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { dateAdd } from '@/lib/date';
import { cn } from '@/lib/utils';

type ToastKind = 'check' | 'x';

// TODO: unique key
interface ToastProps {
  kind: ToastKind;
  expires: Date;
}

interface ToastStore {
  actions: {
    show: (kind: ToastKind) => void;
  };
  toasts: ToastProps[];
}

const store = createStore<ToastStore>((set) => ({
  actions: {
    show(kind) {
      set((prev) => {
        const now = new Date();
        const expires = dateAdd(now, { second: 2 });
        return {
          toasts: [...prev.toasts.filter((item) => item.expires > now), { expires, kind }],
        };
      });
    },
  },
  toasts: [],
}));

type Store = typeof store;

const Context = createContext<Store | null>(null);

export function useToast<U>(selector: (state: ExtractState<Store>) => U): U {
  const storeContext = useContext(Context);
  if (!storeContext) throw new Error('useToast must be used underneath a ToastProvider');
  return useStore(storeContext, useShallow(selector));
}

const Toast = memo(({ kind }: ToastProps) => {
  const [Icon, className] = kind === 'check' ? ([Check, 'text-success'] as const) : ([X, 'text-danger'] as const);
  return (
    <Icon className={cn('size-[25dvmin] origin-top animate-[toast_1.2s_ease-out_forwards] stroke-5', className)} />
  );
});

function Toaster({ className }: { className?: string }) {
  const now = new Date();
  const toasts = useToast((state) => state.toasts).filter((item) => item.expires > now);
  return (
    <div
      className={cn('grid fixed pointer-events-none inset-0 items-end justify-center *:col-start-1 z-9999', className)}
    >
      {toasts.map((toast) => (
        <Toast key={toast.expires.getTime()} {...toast} />
      ))}
    </div>
  );
}

export function ToastProvider({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Context value={store}>
      {children}
      <Toaster className={className} />
    </Context>
  );
}
