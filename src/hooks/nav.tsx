import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

interface Context {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const Context = createContext<Context | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const value: Context = useMemo(() => ({ search, setSearch, open, setOpen }), [search, open]);
  return <Context value={value}>{children}</Context>;
}

export function useNav(): Context {
  const context = useContext(Context);
  if (!context) throw new Error('useNav must be used underneath a NavProvider');
  return context;
}
