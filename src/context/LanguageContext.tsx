'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from '@/locales/en.json';
import idTranslations from '@/locales/id.json';

export type Language = 'id' | 'en';

interface TranslationParams {
  [key: string]: string | number;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatPrice: (amount: number) => string;
}

const translations: Record<Language, any> = {
  en: enTranslations,
  id: idTranslations,
};

function resolveKey(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  // Direct flat match
  if (typeof obj[path] === 'string') return obj[path];

  // Dot notation traversal
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('sevaya_lang') as Language | null;
    if (saved === 'en' || saved === 'id') return saved;

    const cookieMatch = document.cookie.match(/(?:^|;\s*)sevaya_lang=([^;]+)/);
    if (cookieMatch && (cookieMatch[1] === 'en' || cookieMatch[1] === 'id')) {
      return cookieMatch[1] as Language;
    }
  } catch {
    // ignore
  }
  return 'en'; // Rule #1: Default is strictly English
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Rule #1: Initial state always defaults to 'en'
  const [language, setLanguageState] = useState<Language>('en');

  // Synchronize with stored preference on mount
  useEffect(() => {
    const initial = getInitialLanguage();
    if (initial !== language) {
      setLanguageState(initial);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sevaya_lang', lang);
      document.cookie = `sevaya_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // ignore
    }
  }, []);

  // Translation function with nested key support and strict English fallback
  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      // 1. Check in active language
      let val = resolveKey(translations[language], key);

      // 2. Fallback to English if active language is ID and key is missing
      if (!val && language !== 'en') {
        val = resolveKey(translations.en, key);
      }

      // 3. Fallback to key itself
      if (!val) {
        val = key;
      }

      // 4. Interpolate parameters
      if (params && typeof val === 'string') {
        Object.entries(params).forEach(([k, v]) => {
          val = (val as string).replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }

      return val;
    },
    [language]
  );

  // Intl Date Formatter
  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
        const locale = language === 'id' ? 'id-ID' : 'en-US';
        const defaultOpts: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };
        return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
      } catch {
        return String(date);
      }
    },
    [language]
  );

  // Intl Number Formatter
  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      try {
        const locale = language === 'id' ? 'id-ID' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(num);
      } catch {
        return String(num);
      }
    },
    [language]
  );

  // Price Formatter (IDR)
  const formatPrice = useCallback(
    (amount: number): string => {
      try {
        const formatted = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(amount);
        return `Rp ${formatted}`;
      } catch {
        return `Rp ${amount.toLocaleString('id-ID')}`;
      }
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
      formatNumber,
      formatPrice,
    }),
    [language, setLanguage, t, formatDate, formatNumber, formatPrice]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
