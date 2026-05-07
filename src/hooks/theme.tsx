// oxlint-disable unicorn/no-document-cookie cookie store api is async
import { name } from '@root/package.json';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { ExtractState } from 'zustand';
import { createStore, useStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils';

export type Font = 'mono' | 'sans' | 'serif';
export type Scheme = 'dark' | 'light' | 'auto';

export interface ThemeState {
  font: Font;
  scale: number;
  scheme: Scheme;
}

interface ThemeStore extends ThemeState {
  actions: {
    reset: () => void;
    setFont: (font: ThemeState['font']) => void;
    setScale: (scale: ThemeState['scale']) => void;
    setScheme: (scheme: ThemeState['scheme']) => void;
  };
}

export const themeDefault: ThemeState = { font: 'mono', scale: 1, scheme: 'auto' } as const;
export const themeCookieName = `${name}.theme`;

const store = createStore(
  persist<ThemeStore>(
    (set) => ({
      actions: {
        reset() {
          set(() => ({ ...themeDefault }));
        },
        setFont(font) {
          set(() => ({ font }));
        },
        setScale(scale) {
          set(() => ({ scale }));
        },
        setScheme(scheme) {
          set(() => ({ scheme }));
        },
      },
      ...themeDefault,
    }),
    {
      name: themeCookieName,
      onRehydrateStorage(state) {
        return () => ({ ...themeDefault, ...state });
      },
      partialize(state) {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion the function is incorrectly typed - it should expect a Partial<ThemeStore>
        return Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'actions')) as ThemeStore;
      },
      // store as a cookie rather than localStorage so we can use it in ssr
      storage: createJSONStorage(() => ({
        getItem(key) {
          return (
            document.cookie
              .split(/;\s*/)
              .find((item) => item.startsWith(`${key}=`))
              ?.split('=')[1] ?? null
          );
        },
        removeItem(key) {
          document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
        },
        setItem(key, value) {
          document.cookie = `${key}=${value}`;
        },
      })),
    }
  )
);

type Store = typeof store;

const Context = createContext<Store | null>(null);

export function useTheme<U>(selector: (state: ExtractState<Store>) => U): U {
  const storeContext = useContext(Context);
  if (!storeContext) throw new Error('useTheme must be used underneath a ThemeProvider');
  return useStore(storeContext, useShallow(selector));
}

const getServerThemeCookieFn = createIsomorphicFn().server(() => {
  const value = getCookie(themeCookieName);
  const state: ThemeState = {
    ...themeDefault,
    ...(value ? JSON.parse(value).state : undefined),
  };
  return state;
});

/** applies theme according to client-provided cookie in ssr and reactive zustand value on client */
export function ThemedHtmlElement({
  children,
  className,
  style,
  ...props
}: { children: ReactNode } & ComponentProps<'html'>) {
  const serverTheme = getServerThemeCookieFn();
  const reactiveTheme = useTheme((state) => ({
    font: state.font,
    scale: state.scale,
    scheme: state.scheme,
  }));

  const { mergedClassName, mergedStyle } = useMemo(() => {
    // reactiveTheme is invalid on the server, serverTheme is undefined on client
    const { font, scale, scheme } = { ...reactiveTheme, ...serverTheme };
    const result: { mergedClassName: string; mergedStyle: CSSProperties } = {
      mergedClassName: cn(
        font === 'sans' ? 'font-sans' : font === 'serif' ? 'font-serif' : 'font-mono',
        scheme === 'dark' ? 'scheme-dark' : scheme === 'light' ? 'scheme-light' : 'scheme-light-dark',
        className
      ),
      mergedStyle: {
        fontSize: `${Math.round(16 * scale)}px`,
        ...style,
      },
    };
    // console.log(reactiveTheme, serverTheme, { font, scale, scheme }, result);
    return result;
  }, [reactiveTheme, serverTheme, className, style]);

  // using suppressHydrationWarning because the server is actually adding className and style attribs twice - looks like a bug in tanstack router
  return (
    <html lang='en' className={mergedClassName} style={mergedStyle} {...props} suppressHydrationWarning>
      {children}
    </html>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <Context value={store}>{children}</Context>;
}
