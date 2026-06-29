/**
 * useLang — Context للغة + Hook للاستخدام في أي component
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from './i18n';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: 'rtl' | 'ltr';
}

const LangContext = createContext<LangContextType>({
  lang: 'ar',
  setLang: () => {},
  dir: 'rtl',
});

const RTL_LANGS: Lang[] = ['ar', 'egy'];
const STORAGE_KEY = 'eduverse_lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      return saved && ['ar', 'en', 'egy'].includes(saved) ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    document.documentElement.dir = RTL_LANGS.includes(l) ? 'rtl' : 'ltr';
    document.documentElement.lang = l === 'egy' ? 'ar' : l;
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang === 'egy' ? 'ar' : lang;
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
