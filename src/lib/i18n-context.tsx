'use client';

import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { type Locale, t, isRTL, LOCALES } from './i18n';
import { EXTENDED_TRANSLATIONS } from './i18n-extended';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Merged translation lookup: checks extended translations first, then base
function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  // Check extended translations (skills, personas, templates)
  const extDict = EXTENDED_TRANSLATIONS[locale] || EXTENDED_TRANSLATIONS.en;
  let str = extDict[key];
  if (!str) {
    // Fallback to extended English
    str = EXTENDED_TRANSLATIONS.en[key];
  }
  if (!str) {
    // Fallback to base translations
    str = t(locale, key, params);
  }
  if (!str) {
    // Final fallback: return the key itself
    str = key;
  }
  if (params && str !== key) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('career-arsenal-locale') as Locale | null;
      if (saved && LOCALES.some((l) => l.code === saved)) return saved;
    }
    return 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('career-arsenal-locale', l);
    }
  }, []);

  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const value: I18nContextValue = {
    locale,
    dir,
    setLocale,
    t: (key, params) => translate(locale, key, params),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en',
      dir: 'ltr',
      setLocale: () => {},
      t: (key, params) => translate('en', key, params),
    };
  }
  return ctx;
}
