import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { ExtractState } from 'zustand';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface DialogState {
  id: number | null;
  open: boolean;
}

export type DialogName =
  | 'category'
  | 'doneCustom'
  | 'history'
  | 'item'
  | 'schedule'
  | 'scheduleHistory'
  | 'theme'
  | 'unit';

interface DialogStore extends Record<DialogName, DialogState> {
  actions: {
    open: (name: DialogName, id: number | null) => void;
    close: (name: DialogName) => void;
    /** called by dialog onOpenChange */
    set: (name: DialogName, open: boolean) => void;
  };
}

const dialogDefault: DialogState = { id: null, open: false } as const;

const store = createStore<DialogStore>((set) => ({
  actions: {
    close(name) {
      set(() => ({ [name]: { id: null, open: false } }));
    },
    open(name, id) {
      set(() => ({ [name]: { id, open: true } }));
    },
    set(name, open) {
      set((prev) => ({ [name]: { ...prev[name], open } }));
    },
  },
  category: dialogDefault,
  doneCustom: dialogDefault,
  history: dialogDefault,
  item: dialogDefault,
  schedule: dialogDefault,
  scheduleHistory: dialogDefault,
  theme: dialogDefault,
  unit: dialogDefault,
}));

type Store = typeof store;

const Context = createContext<Store | null>(null);

export function useDialog<U>(selector: (state: ExtractState<Store>) => U): U {
  const storeContext = useContext(Context);
  if (!storeContext) throw new Error('useDialog must be used underneath a DialogProvider');
  return useStore(storeContext, useShallow(selector));
}

export function DialogProvider({ children }: { children: ReactNode }) {
  return <Context value={store}>{children}</Context>;
}
