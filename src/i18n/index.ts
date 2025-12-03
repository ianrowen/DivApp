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
import * as React from 'react';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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

// Create Context for global locale state
interface TranslationContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string, options?: object) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

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
 * Translation Provider Component
 * 
 * Wraps the app to provide global translation context.
 * All components using useTranslation will automatically update when locale changes.
 * 
 * @example
 * ```typescript
 * <TranslationProvider>
 *   <App />
 * </TranslationProvider>
 * ```
 */
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale());

  // Load saved locale on mount
  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then((saved) => {
        if (saved && (saved === 'en' || saved === 'zh-TW')) {
          const savedLocale = saved as SupportedLocale;
          setLocaleState(savedLocale);
          i18n.locale = savedLocale;
        }
      })
      .catch(() => {
        // Use default
      });
  }, []);

  const updateLocale = useCallback(async (newLocale: SupportedLocale) => {
    // Update state immediately for instant visual feedback across ALL components
    setLocaleState(newLocale);
    // Update i18n immediately so translations work right away
    i18n.locale = newLocale;
    currentLocale = newLocale;
    // Save to AsyncStorage in background (non-blocking)
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale).catch((error) => {
      console.error('Failed to save locale to storage:', error);
      // Even if storage fails, the language change is already applied
    });
  }, []);

  const t = useCallback((key: string, options?: object): string => {
    return i18n.t(key, options);
  }, [locale]);

  return React.createElement(
    TranslationContext.Provider,
    { value: { locale, setLocale: updateLocale, t } },
    children
  );
}

/**
 * React hook for translations
 * 
 * Automatically updates when locale changes anywhere in the app.
 * All components using this hook will re-render immediately when language changes.
 * 
 * @example
 * ```typescript
 * const { t, locale, setLocale } = useTranslation();
 * 
 * return <Text>{t('common.appName')}</Text>;
 * ```
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  
  // Fallback if used outside provider (shouldn't happen, but safe fallback)
  const [fallbackLocale, setFallbackLocale] = useState<SupportedLocale>(getLocale());
  
  const fallbackUpdateLocale = useCallback(async (newLocale: SupportedLocale) => {
    setFallbackLocale(newLocale);
    i18n.locale = newLocale;
    currentLocale = newLocale;
    await setLocale(newLocale);
  }, []);

  const fallbackT = useCallback((key: string, options?: object): string => {
    return i18n.t(key, options);
  }, [fallbackLocale]);

  if (!context) {
    return {
      t: fallbackT,
      locale: fallbackLocale,
      setLocale: fallbackUpdateLocale,
    };
  }

  return context;
}

// Export i18n instance for direct access if needed
export default i18n;
