import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

interface Context {
  setShow: Dispatch<SetStateAction<boolean>>;
  show: boolean;
}

const Context = createContext<Context | null>(null);

export function useDevTools() {
  const context = useContext(Context);
  if (!context) throw new Error('useDevTools must be used underneath a DevToolsProvider');
  return context;
}

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);

  const value = useMemo(
    () => ({
      setShow,
      show,
    }),
    [show]
  );

  return <Context value={value}>{children}</Context>;
}
