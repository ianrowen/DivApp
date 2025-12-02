// src/shared/components/LanguageSelector.tsx
/**
 * LanguageSelector Component
 * 
 * Allows users to switch between supported languages (English and Traditional Chinese).
 * Integrates with the i18n system to update the app locale.
 * 
 * @example
 * ```typescript
 * import { LanguageSelector } from '../shared/components/LanguageSelector';
 * // Or with path alias: import { LanguageSelector } from '@/shared/components/LanguageSelector';
 * 
 * <LanguageSelector />
 * ```
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation, setLocale, getLocale, type SupportedLocale, i18n } from '../../i18n';
import ThemedText from './ui/ThemedText';
import theme from '../theme';

interface LanguageOption {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh-TW', label: '繁體中文', nativeLabel: '繁體中文' },
];

export function LanguageSelector() {
  const { locale, setLocale: setLocaleFromHook } = useTranslation();
  const [currentLocale, setCurrentLocale] = React.useState<SupportedLocale>(locale);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_language');
      if (saved && (saved === 'en' || saved === 'zh-TW')) {
        const savedLocale = saved as SupportedLocale;
        i18n.locale = savedLocale;
        setCurrentLocale(savedLocale);
        // Also update the hook's locale state
        await setLocaleFromHook(savedLocale);
      } else {
        // Use current locale from i18n
        const current = getLocale();
        setCurrentLocale(current);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
      // Fallback to current locale
      const current = getLocale();
      setCurrentLocale(current);
    }
  };

  const changeLanguage = async (lang: SupportedLocale) => {
    try {
      // Use the exported setLocale function which handles AsyncStorage and i18n.locale
      await setLocale(lang);
      setCurrentLocale(lang);
      // Also update through hook to trigger re-renders in other components
      await setLocaleFromHook(lang);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Styles defined inside component to prevent circular dependency
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: theme.spacing.spacing.sm,
      alignItems: 'center',
    },
    languageButton: {
      paddingHorizontal: theme.spacing.spacing.md,
      paddingVertical: theme.spacing.spacing.sm,
      borderRadius: theme.spacing.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.neutrals.midGray,
      backgroundColor: theme.colors.neutrals.darkGray,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageButtonActive: {
      borderColor: theme.colors.primary.gold,
      backgroundColor: theme.colors.primary.crimsonDark,
      ...theme.shadows.shadows.sm,
    },
    languageText: {
      color: theme.colors.text.secondary,
    },
    languageTextActive: {
      color: theme.colors.primary.gold,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  }), []);

  const handleLanguageChange = async (newLocale: SupportedLocale) => {
    if (newLocale !== currentLocale) {
      await changeLanguage(newLocale);
    }
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((language) => {
        const isActive = currentLocale === language.code;
        return (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageButton,
              isActive && styles.languageButtonActive,
            ]}
            onPress={() => handleLanguageChange(language.code)}
            activeOpacity={0.7}
          >
            <ThemedText
              variant={isActive ? 'body' : 'caption'}
              style={[
                styles.languageText,
                ...(isActive ? [styles.languageTextActive] : []),
              ]}
            >
              {language.nativeLabel}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default LanguageSelector;

