import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import idDict from '../locales/id.json';
import enDict from '../locales/en.json';
import zhDict from '../locales/zh.json';

type Language = 'id' | 'en' | 'zh';

const dictionaries: Record<Language, any> = {
  id: idDict,
  en: enDict,
  zh: zhDict
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  // Cek bahasa yang tersimpan di HP user
  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && ['id', 'en', 'zh'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  // Fungsi 't' (Translate) buat manggil teks
  const t = (key: string) => {
    return dictionaries[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}