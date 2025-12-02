// src/i18n/index.ts
/**
 * Internationalization (i18n) Module
 * 
 * Provides translation functionality using i18n-js with support for:
 * - English (en)
 * - Traditional Chinese (zh-TW)
 * 
 * Features:
 * - Persistent locale storage using AsyncStorage
 * - React hook for translations
 * - Type-safe translation keys
 */

import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import * as translations from './translations';

// Supported locales
export type SupportedLocale = 'en' | 'zh-TW';

// Create i18n instance
export const i18n = new I18n({
  en: translations.en,
  'zh-TW': translations.zhTW,
});

// Default locale
const DEFAULT_LOCALE: SupportedLocale = 'en';

// Storage key for locale preference
const LOCALE_STORAGE_KEY = 'user_language';

// Initialize locale
let currentLocale: SupportedLocale = DEFAULT_LOCALE;

// Load saved locale on module initialization
AsyncStorage.getItem(LOCALE_STORAGE_KEY)
  .then((saved) => {
    if (saved && (saved === 'en' || saved === 'zh-TW')) {
      currentLocale = saved as SupportedLocale;
      i18n.locale = currentLocale;
    } else {
      i18n.locale = DEFAULT_LOCALE;
    }
  })
  .catch(() => {
    i18n.locale = DEFAULT_LOCALE;
  });

// Configure i18n
i18n.enableFallback = true;
i18n.defaultLocale = DEFAULT_LOCALE;
i18n.locale = currentLocale;

/**
 * Get current locale
 */
export function getLocale(): SupportedLocale {
  return (i18n.locale as SupportedLocale) || DEFAULT_LOCALE;
}

/**
 * Set locale and persist to storage
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  try {
    currentLocale = locale;
    i18n.locale = locale;
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error('Failed to save locale:', error);
    // Still update in-memory locale even if storage fails
    currentLocale = locale;
    i18n.locale = locale;
  }
}

/**
 * React hook for translations
 * 
 * @example
 * ```typescript
 * const { t, locale, setLocale } = useTranslation();
 * 
 * return <Text>{t('common.appName')}</Text>;
 * ```
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale());

  // Sync with i18n locale changes
  useEffect(() => {
    const current = getLocale();
    if (current !== locale) {
      setLocaleState(current);
    }
  }, []);

  const updateLocale = useCallback(async (newLocale: SupportedLocale) => {
    await setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, options?: object): string => {
    return i18n.t(key, options);
  }, [locale]);

  return {
    t,
    locale,
    setLocale: updateLocale,
  };
}

// Export i18n instance for direct access if needed
export default i18n;
