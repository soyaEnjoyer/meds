// oxlint-disable unicorn/no-document-cookie cookie store api is async
import { name } from '@root/package.json';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import type { CSSProperties, ReactNode } from 'react';
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
  hueCenter: number;
  hueWidth: number;
  radius: number;
  scale: number;
  scheme: Scheme;
  showIds: boolean;
}

interface ThemeStore extends ThemeState {
  actions: {
    reset: () => void;
    setFont: (font: ThemeState['font']) => void;
    setHueCenter: (hueCenter: ThemeState['hueCenter']) => void;
    setHueWidth: (hueWidth: ThemeState['hueWidth']) => void;
    setRadius: (radius: ThemeState['radius']) => void;
    setScale: (scale: ThemeState['scale']) => void;
    setScheme: (scheme: ThemeState['scheme']) => void;
    setShowIds: (showIds: ThemeState['showIds']) => void;
  };
}

export const themeDefault: ThemeState = {
  font: 'sans',
  hueCenter: 215,
  hueWidth: 130,
  radius: 0.625,
  scale: 1,
  scheme: 'auto',
  showIds: false,
} as const;
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
        setHueCenter(hueCenter) {
          set(() => ({ hueCenter }));
        },
        setHueWidth(hueWidth) {
          set(() => ({ hueWidth }));
        },
        setRadius(radius) {
          set(() => ({ radius }));
        },
        setScale(scale) {
          set(() => ({ scale }));
        },
        setScheme(scheme) {
          set(() => ({ scheme }));
        },
        setShowIds(showIds) {
          set(() => ({ showIds }));
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
            document?.cookie
              .split(/;\s*/)
              .find((item) => item.startsWith(`${key}=`))
              ?.split('=')[1] ?? null
          );
        },
        removeItem(key) {
          if (document) document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
        },
        setItem(key, value) {
          if (document) document.cookie = `${key}=${value}; expires=Wed May 15 2109 08:35:11 UTC`;
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
  const state: ThemeState | undefined = value ? JSON.parse(value).state : undefined;
  return state;
});

export function useThemeResult() {
  const serverTheme = getServerThemeCookieFn();
  const reactiveTheme = useTheme((state) => ({
    font: state.font,
    hueCenter: state.hueCenter,
    hueWidth: state.hueWidth,
    radius: state.radius,
    scale: state.scale,
    scheme: state.scheme,
  }));
  const { className, hueCenter, hueWidth, style } = useMemo(() => {
    // reactiveTheme is invalid on the server, serverTheme is undefined on client
    // oxlint-disable-next-line no-shadow
    const { font, hueCenter, hueWidth, radius, scale, scheme } = { ...themeDefault, ...reactiveTheme, ...serverTheme };
    return {
      className: cn(
        font === 'sans' ? 'font-sans' : font === 'serif' ? 'font-serif' : 'font-mono',
        scheme === 'dark' ? 'scheme-dark' : scheme === 'light' ? 'scheme-light' : 'scheme-light-dark'
      ),
      hueCenter,
      hueWidth,
      style: {
        '--radius': `${radius}rem`,
        fontSize: `${Math.round(16 * scale)}px`,
      },
    } satisfies {
      className: string;
      hueCenter: number;
      hueWidth: number;
      style: CSSProperties & Record<`--${string}`, string>;
    };
  }, [reactiveTheme, serverTheme]);

  // using suppressHydrationWarning because the server is actually adding className and style attribs twice - looks like a bug in tanstack router
  return { className, hueCenter, hueWidth, style };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <Context value={store}>{children}</Context>;
}
