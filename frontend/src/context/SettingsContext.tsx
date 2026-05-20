import {createContext,ReactNode, useContext, useState} from 'react';

interface SettingsInterface{
  [key:string]:boolean|number|string,
};

const isWebview = /\bwv\b/.test(window.navigator.userAgent);

const defaultSettings: SettingsInterface = {
  /*
    BUG: localStorage now seems to be defined but non-functional for android webview.
  */
  // animateAccordion:typeof localStorage!=='undefined', //default disable on webview
  animateAccordion: !isWebview,
  showIds: window.innerWidth >= 768, //default disable on mobile
};

interface SettingsContextInterface {
  getSetting(key: string): boolean | number | string | null;
  setSetting: (key: string, value: boolean | number | string) => void;
}

const defaultContextValue: SettingsContextInterface = {
  getSetting: () => null,
  setSetting: () => {},
};

const SettingsContext = createContext<SettingsContextInterface>(defaultContextValue);
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [getSettingState, setSettingState] = useState(defaultSettings);
  const getSetting = (key: string) => {
    const storedValue =
      (isWebview
        ? document.cookie
            .split('; ')
            .find((c) => c.startsWith(`${key}=`))
            ?.split('=')[1]
        : localStorage?.getItem(key)) ?? null;
    return storedValue !== null
      ? JSON.parse(storedValue)
      : defaultSettings[key] ??
          getSettingState[key] ?? //this only exists so that setting updates trigger a re-render
          null;
  };
  const setSetting = (key: string, value: boolean | number | string) => {
    const stringValue = JSON.stringify(value);
    if (isWebview) {
      document.cookie = `${key}=${value};max-age:3153600000`;
    } else {
      localStorage.setItem(key, stringValue);
    }
    setSettingState((prevSettingState: SettingsInterface) => ({
      ...prevSettingState,
      [key]: value,
    }));
  };
  return <SettingsContext.Provider value={{ getSetting, setSetting }}>{children}</SettingsContext.Provider>;
}

export const useSettings=()=>{
  const context=useContext(SettingsContext);
  return context;
}