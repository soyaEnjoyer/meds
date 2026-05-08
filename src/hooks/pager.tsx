import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';
import type { ExtractState } from 'zustand';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { useDialog } from '@/hooks/dialog';

interface PagerState {
  pageNum: number;
  pageSize: number;
}

export type PagerName = 'history' | 'scheduleHistory';

interface PagerStore extends Record<PagerName, PagerState> {
  actions: {
    prev: (name: PagerName) => void;
    next: (name: PagerName) => void;
    reset: (name: PagerName) => void;
  };
}

const pageDefault: PagerState = { pageNum: 0, pageSize: 30 } as const;
const dialogDefault: PagerState = { pageNum: 0, pageSize: 10 } as const;

const store = createStore<PagerStore>((set) => ({
  actions: {
    next(name) {
      set((prev) => ({ [name]: { ...prev[name], pageNum: prev[name].pageNum + 1 } }));
    },
    prev(name) {
      set((prev) => ({ [name]: { ...prev[name], pageNum: Math.max(0, prev[name].pageNum - 1) } }));
    },
    reset(name) {
      set((prev) => ({ [name]: { ...prev[name], pageNum: 0 } }));
    },
  },
  history: pageDefault,
  scheduleHistory: dialogDefault,
}));

type Store = typeof store;

const Context = createContext<Store | null>(null);

export function usePager<U>(selector: (state: ExtractState<Store>) => U): U {
  const storeContext = useContext(Context);
  if (!storeContext) throw new Error('usePager must be used underneath a PagerProvider');
  return useStore(storeContext, useShallow(selector));
}

function ResetHistoryPagerOnNavigate() {
  const pathName = useRouterState({ select: (state) => state.location.pathname });
  const reset = usePager((state) => state.actions.reset);
  useEffect(() => reset('history'), [pathName, reset]);
  return null;
}

function ResetScheduleHistoryPagerOnDialogOpenChange() {
  const itemDialogOpen = useDialog((state) => state.scheduleHistory.open);
  const reset = usePager((state) => state.actions.reset);
  useEffect(() => reset('scheduleHistory'), [itemDialogOpen, reset]);
  return null;
}

export function PagerProvider({ children }: { children: ReactNode }) {
  return (
    <Context value={store}>
      {children}
      <ResetHistoryPagerOnNavigate />
      <ResetScheduleHistoryPagerOnDialogOpenChange />
    </Context>
  );
}
