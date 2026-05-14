import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import type { ExtractState, StoreApi } from 'zustand';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export enum ItemState {
  Scheduled,
  Due,
  NotDue,
  Unscheduled,
  All,
  AdHoc,
}

export const itemStates = [
  ItemState.Scheduled,
  ItemState.Due,
  ItemState.NotDue,
  ItemState.Unscheduled,
  ItemState.AdHoc,
  ItemState.All,
] as const satisfies ItemState[];

export const itemStateNames = {
  [ItemState.Scheduled]: 'Scheduled',
  [ItemState.Due]: 'Due',
  [ItemState.NotDue]: 'Not due',
  [ItemState.Unscheduled]: 'Unscheduled',
  [ItemState.AdHoc]: 'Ad hoc',
  [ItemState.All]: 'All',
} as const satisfies Record<ItemState, string>;

interface FilterState {
  search: string;
  state: ItemState;
}

interface FilterStore extends FilterState {
  actions: {
    setSearch: (search: FilterState['search']) => void;
    setState: (state: FilterState['state']) => void;
  };
}

type Store = StoreApi<FilterStore>;

const Context = createContext<Store | null>(null);

export function useFilter<U>(selector: (state: ExtractState<Store>) => U): U {
  const store = useContext(Context);
  if (!store) throw new Error('useFilter must be used underneath a FilterProvider');
  return useStore(store, useShallow(selector));
}

function ResetSearchOnNavigate() {
  const pathName = useRouterState({ select: (state) => state.location.pathname });
  const setSearch = useFilter((state) => state.actions.setSearch);

  useEffect(() => setSearch(''), [pathName, setSearch]);

  return null;
}

export function FilterProvider({
  children,
  defaultSearch = '',
  defaultState = ItemState.Scheduled,
}: {
  children: ReactNode;
  defaultSearch?: FilterState['search'];
  defaultState?: FilterState['state'];
}) {
  const storeRef = useRef(
    createStore<FilterStore>((set) => ({
      actions: {
        setSearch(search) {
          set(() => ({ search }));
        },
        setState(state) {
          set(() => ({ state }));
        },
      },
      search: defaultSearch,
      state: defaultState,
    }))
  );

  return (
    <Context value={storeRef.current}>
      {children}
      <ResetSearchOnNavigate />
    </Context>
  );
}
