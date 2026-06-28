import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

export type { Language, TranslationKey };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('eduverse_lang');
    return (stored === 'ar' || stored === 'en' || stored === 'egy') ? stored : 'ar';
  });

  const dir: 'rtl' | 'ltr' = language === 'en' ? 'ltr' : 'rtl';

  // Update document dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eduverse_lang', lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language]?.[key] ?? translations['ar'][key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
