// src/screens/ProfileScreen.tsx
/**
 * ProfileScreen Component
 * 
 * Collects user birth data with tiered input approach:
 * - Tier 1: Birth date only → Sun sign
 * - Tier 2: Birth date + time → Sun + Moon (approximate)
 * - Tier 3: Birth date + time + location → Full chart with Rising sign
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { AppStackParamList, MainTabParamList } from '../../App';
import { supabase } from '../core/api/supabase';
import { supabaseHelpers } from '../core/api/supabase';
import theme from '../theme';
import MysticalBackground from '../shared/components/ui/MysticalBackground';
import ThemedText from '../shared/components/ui/ThemedText';
import ThemedButton from '../shared/components/ui/ThemedButton';
import ThemedCard from '../shared/components/ui/ThemedCard';
import SpinningLogo from '../shared/components/ui/SpinningLogo';
import LocationSearch, { LocationSearchResult } from '../shared/components/LocationSearch';
import { LanguageSelector } from '../shared/components/LanguageSelector';
import { useTranslation } from '../i18n';
import { calculateChart, type BirthData } from '../services/astrologyService';
import locationService from '../services/locationService';

const ANIMATIONS_ENABLED_KEY = '@divin8_animations_enabled';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  StackScreenProps<AppStackParamList>
>;

interface CalculatedData {
  sunSign: string | null;
  moonSign: string | null;
  risingSign: string | null;
  accuracy: 'full' | 'partial' | 'minimal';
}

// Zodiac sign emojis
const SIGN_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

/**
 * Calculate chart data based on birth information
 * Uses the astronomy-engine implementation from astrologyService
 */
async function calculateProfileChart(
  birthDate: Date | null,
  birthTime: Date | null,
  birthLocation: LocationSearchResult | null
): Promise<CalculatedData> {
  if (!birthDate) {
    return {
      sunSign: null,
      moonSign: null,
      risingSign: null,
      accuracy: 'minimal',
    };
  }

  try {
    const birthData: BirthData = {
      date: birthDate,
      time: birthTime || undefined,
      location: birthLocation ? {
        lat: birthLocation.lat,
        lng: birthLocation.lng,
        timezone: birthLocation.timezone,
        display_name: birthLocation.display_name,
      } : undefined,
    };

    const chartData = await calculateChart(birthData);

    return {
      sunSign: chartData.sun_sign,
      moonSign: chartData.moon_sign || null,
      risingSign: chartData.rising_sign || null,
      accuracy: chartData.chart_accuracy,
    };
  } catch (error) {
    console.error('Error calculating chart:', error);
    // Fallback to minimal chart with just sun sign
    return {
      sunSign: null,
      moonSign: null,
      risingSign: null,
      accuracy: 'minimal',
    };
  }
}

export default function ProfileScreen({ navigation }: Props) {
  const { t, locale } = useTranslation();
  
  // State
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [birthLocation, setBirthLocation] = useState<LocationSearchResult | null>(null);
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(null);
  const [useForReadings, setUseForReadings] = useState(true);
  const [calculatedData, setCalculatedData] = useState<CalculatedData>({
    sunSign: null,
    moonSign: null,
    risingSign: null,
    accuracy: 'minimal',
  });
  
  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true); // Start as true to show spinner on initial load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial load is done
  const [calculating, setCalculating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Load existing profile data
  useEffect(() => {
    loadProfileData();
    loadAnimationPreference();
  }, []);

  const loadAnimationPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(ANIMATIONS_ENABLED_KEY);
      if (saved !== null) {
        setAnimationsEnabled(saved === 'true');
      } else {
        // Default is true
        setAnimationsEnabled(true);
      }
    } catch (error) {
      console.error('Error loading animation preference:', error);
      setAnimationsEnabled(true);
    }
  };

  const handleAnimationToggle = async (value: boolean) => {
    try {
      setAnimationsEnabled(value);
      await AsyncStorage.setItem(ANIMATIONS_ENABLED_KEY, value.toString());
    } catch (error) {
      console.error('Error saving animation preference:', error);
    }
  };

  // Recalculate when birth data changes (debounced) - only if opted in
  useEffect(() => {
    if (!useForReadings || !birthDate) {
      setCalculatedData({
        sunSign: null,
        moonSign: null,
        risingSign: null,
        accuracy: 'minimal',
      });
      return;
    }

    setCalculating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await calculateProfileChart(birthDate, birthTime, birthLocation);
        setCalculatedData(data);
      } catch (error) {
        console.error('Error calculating chart:', error);
      } finally {
        setCalculating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [useForReadings, birthDate, birthTime, birthLocation]);

  const loadProfileData = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:loadProfileData',message:'loadProfileData entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    try {
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:getSession',message:'Calling getSession with retry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      // Use getSession() - try once immediately, if no session wait briefly and try once more
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user;
      let retried = false;
      
      // If no session immediately, wait 100ms and try once more (session might still be establishing)
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        user = retrySession?.user;
        retried = true;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:getSessionResult',message:'getSession result',data:{hasUser:!!user,userId:user?.id,retried},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      if (!user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:noUser',message:'No user found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        console.warn('No user found');
        setLoading(false);
        setInitialLoadComplete(true); // Mark as complete even if no user
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:queryProfile',message:'Querying user profile',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      // Optimize query: only select needed fields instead of *
      const { data, error } = await supabase
        .from('user_profiles')
        .select('birth_date, birth_time, birth_location, use_birth_data_for_readings')
        .eq('user_id', user.id)
        .single();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:queryResult',message:'Profile query result',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error);
        setLoading(false);
        setInitialLoadComplete(true); // Mark as complete even on error
        return;
      }

      if (data) {
        if (data.birth_date) {
          setBirthDate(new Date(data.birth_date));
        }
        if (data.birth_time) {
          // Handle time as string (HH:mm) or Date object
          if (typeof data.birth_time === 'string') {
            // If it's a time string (HH:mm), create a Date with today's date
            const [hours, minutes] = data.birth_time.split(':');
            const timeDate = new Date();
            timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            setBirthTime(timeDate);
          } else {
            // If it's already a Date object or ISO string, parse it
            setBirthTime(new Date(data.birth_time));
          }
        }
        if (data.birth_location) {
          const savedLocation = data.birth_location as LocationSearchResult;
          setBirthLocation(savedLocation);
          // Re-fetch location name in current locale (non-blocking - runs in background)
          if (savedLocation.lat && savedLocation.lng) {
            updateLocationDisplayName(savedLocation.lat, savedLocation.lng).catch(() => {
              // Silently fail - location display name is not critical
            });
          }
        }
        if (data.use_birth_data_for_readings !== undefined) {
          setUseForReadings(data.use_birth_data_for_readings);
        }
        setHasUnsavedChanges(false);
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:profileLoaded',message:'Profile loaded successfully',data:{hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:error',message:'Error loading profile',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      console.error('Error loading profile:', error);
      setInitialLoadComplete(true); // Mark as complete even on error
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:finally',message:'Setting loading to false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setLoading(false);
      setInitialLoadComplete(true); // Mark initial load as complete
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      // Validate: date cannot be in the future
      if (selectedDate > new Date()) {
        Alert.alert(
          t('common.error'),
          'Birth date cannot be in the future'
        );
        return;
      }
      setBirthDate(selectedDate);
      setHasUnsavedChanges(true);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime && event.type !== 'dismissed') {
      setBirthTime(selectedTime);
      setHasUnsavedChanges(true);
    }
  };

  const updateLocationDisplayName = async (lat: number, lng: number) => {
    const displayName = await locationService.reverseGeocode(lat, lng, locale);
    setLocationDisplayName(displayName);
  };

  const handleLocationSelect = async (location: LocationSearchResult) => {
    setBirthLocation(location);
    setLocationDisplayName(location.display_name);
    setHasUnsavedChanges(true);
  };

  const handleClearTime = () => {
    setBirthTime(null);
    // Don't clear location when time is cleared - location can exist without time
    setHasUnsavedChanges(true);
  };

  const handleClearLocation = () => {
    setBirthLocation(null);
    setLocationDisplayName(null);
    setHasUnsavedChanges(true);
  };

  // Update location display name when locale changes
  useEffect(() => {
    if (birthLocation?.lat && birthLocation?.lng) {
      const updateDisplay = async () => {
        const displayName = await locationService.reverseGeocode(birthLocation.lat!, birthLocation.lng!, locale);
        setLocationDisplayName(displayName);
      };
      updateDisplay();
    }
  }, [locale, birthLocation]);

  const saveProfile = async () => {
    // Only require birth date if user opts in to use birth data
    if (useForReadings && !birthDate) {
      Alert.alert(
        t('common.error'),
        'Please select your birth date'
      );
      return;
    }

    try {
      setLoading(true);
      // Use getSession() instead of getCurrentUser() for faster response
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        Alert.alert(t('common.error'), 'Please sign in to save your profile');
        return;
      }

      // Format time as HH:mm string for Supabase time field
      const formatTimeForDB = (date: Date | null): string | null => {
        if (!date) return null;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null, // Store as date only (YYYY-MM-DD)
          birth_time: formatTimeForDB(birthTime), // Store as time string (HH:mm)
          birth_location: birthLocation ? {
            lat: birthLocation.lat,
            lng: birthLocation.lng,
            display_name: birthLocation.display_name,
            timezone: birthLocation.timezone,
          } : null,
          sun_sign: calculatedData.sunSign,
          moon_sign: calculatedData.moonSign,
          rising_sign: calculatedData.risingSign,
          chart_accuracy: calculatedData.accuracy,
          use_birth_data_for_readings: useForReadings,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert(t('common.error'), 'Failed to save profile. Please try again.');
        return;
      }

      setSaveMessage(t('profile.saveSuccess'));
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(t('common.error'), 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    
    if (locale === 'zh-TW') {
      // Chinese format: 2025年11月29日
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    } else {
      // English format: 29 November 2025 (day month name year)
      const day = date.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSignDisplayName = (sign: string | null): string => {
    if (!sign) return t('profile.notCalculated');
    
    // Translate sign name to Chinese if locale is zh-TW
    let displaySign = sign;
    if (locale === 'zh-TW') {
      // Convert sign name to lowercase for lookup (e.g., "Scorpio" -> "scorpio")
      const signKey = sign.toLowerCase();
      const translatedSign = t(`zodiac.${signKey}`, { defaultValue: sign });
      displaySign = translatedSign;
    }
    
    return `${displaySign} ${SIGN_EMOJIS[sign] || ''}`;
  };

  const getAccuracyText = (): string => {
    switch (calculatedData.accuracy) {
      case 'full':
        return t('profile.chartAccuracy.full');
      case 'partial':
        return t('profile.chartAccuracy.partial');
      case 'minimal':
        return t('profile.chartAccuracy.minimal');
      default:
        return '';
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('common.signOut'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.signOut'),
          style: 'destructive',
          onPress: async () => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:handleSignOut',message:'Sign out button pressed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            setSigningOut(true);
            try {
              await supabaseHelpers.signOut();
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:signOutComplete',message:'Sign out completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              // Navigation will be handled by auth state change
            } catch (error) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileScreen.tsx:signOutError',message:'Sign out error occurred',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              console.error('Sign out error:', error);
              Alert.alert(t('common.error'), 'Failed to sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // Show loading spinner during initial load
  if (!initialLoadComplete) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.loadingContainer}>
          <SpinningLogo size={120} />
        </View>
      </MysticalBackground>
    );
  }

  return (
    <MysticalBackground variant="default">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <ThemedCard variant="elevated" style={styles.mainCard}>
          {/* Language Selector */}
          <View style={styles.languageSelectorContainer}>
            <ThemedText variant="caption" style={styles.languageLabel}>
              {t('profile.language')}
            </ThemedText>
            <LanguageSelector />
          </View>

          {/* Success Message */}
          {saveMessage && (
            <View style={styles.successMessage}>
              <ThemedText variant="body" style={styles.successText}>
                {saveMessage}
              </ThemedText>
            </View>
          )}

          {/* Use for Readings Toggle - Moved to top */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleTextContainer}>
                <ThemedText variant="body" style={styles.toggleLabel}>
                  {t('profile.useForReadings')}
                </ThemedText>
                <ThemedText variant="caption" style={styles.toggleDescription}>
                  {t('profile.useForReadingsDescription')}
                </ThemedText>
              </View>
              <Switch
                value={useForReadings}
                onValueChange={(value) => {
                  setUseForReadings(value);
                  setHasUnsavedChanges(true);
                }}
                trackColor={{
                  false: theme.colors.neutrals.midGray,
                  true: theme.colors.primary.crimson,
                }}
                thumbColor={useForReadings ? theme.colors.primary.gold : theme.colors.neutrals.lightGray}
              />
            </View>
          </View>

          {/* Animations Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleTextContainer}>
                <ThemedText variant="body" style={styles.toggleLabel}>
                  {t('profile.animations')}
                </ThemedText>
                <ThemedText variant="caption" style={styles.toggleDescription}>
                  {t('profile.animationsDescription')}
                </ThemedText>
              </View>
              <Switch
                value={animationsEnabled}
                onValueChange={handleAnimationToggle}
                trackColor={{
                  false: theme.colors.neutrals.midGray,
                  true: theme.colors.primary.crimson,
                }}
                thumbColor={animationsEnabled ? theme.colors.primary.gold : theme.colors.neutrals.lightGray}
              />
            </View>
          </View>

          {/* Calculated Results - Moved between toggle and entry fields */}
          {calculatedData.sunSign && (
            <ThemedCard variant="minimal" style={styles.resultsCard}>
              <ThemedText variant="h3" style={styles.resultsTitle}>
                {t('profile.yourChart')}
              </ThemedText>
              {calculating && (
                <View style={styles.calculatingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary.gold} />
                  <ThemedText variant="caption" style={styles.calculatingText}>
                    {t('profile.calculating')}
                  </ThemedText>
                </View>
              )}
              <View style={styles.resultRow}>
                <ThemedText variant="body" style={styles.resultLabel}>
                  {t('profile.sunSign')}:
                </ThemedText>
                <ThemedText variant="body" style={styles.resultValue}>
                  {getSignDisplayName(calculatedData.sunSign)}
                </ThemedText>
              </View>
              {calculatedData.moonSign && (
                <View style={styles.resultRow}>
                  <ThemedText variant="body" style={styles.resultLabel}>
                    {t('profile.moonSign')}:
                  </ThemedText>
                  <ThemedText variant="body" style={styles.resultValue}>
                    {getSignDisplayName(calculatedData.moonSign)}
                    {calculatedData.accuracy === 'partial' && ' (approximate)'}
                  </ThemedText>
                </View>
              )}
              {calculatedData.risingSign && (
                <View style={styles.resultRow}>
                  <ThemedText variant="body" style={styles.resultLabel}>
                    {t('profile.risingSign')}:
                  </ThemedText>
                  <ThemedText variant="body" style={styles.resultValue}>
                    {getSignDisplayName(calculatedData.risingSign)}
                  </ThemedText>
                </View>
              )}
              <View style={styles.accuracyContainer}>
                <ThemedText variant="caption" style={styles.accuracyText}>
                  {getAccuracyText()}
                </ThemedText>
              </View>
            </ThemedCard>
          )}

          {/* Birth Data Entry Fields - Only show if opted in */}
          {useForReadings && (
            <>
              {/* Tier 1: Birth Date */}
          <View style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {t('profile.birthDate')} <ThemedText variant="caption" style={styles.required}>
                ({t('common.required')})
              </ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => setShowDatePicker(true)}
            >
              <ThemedText variant="body" style={styles.inputText}>
                {birthDate ? formatDate(birthDate) : t('profile.birthDatePlaceholder')}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Tier 2: Birth Time */}
          <View style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {t('profile.birthTime')} <ThemedText variant="caption" style={styles.optional}>
                ({t('common.optional')})
              </ThemedText>
            </ThemedText>
            <ThemedText variant="caption" style={styles.hintText}>
              {t('profile.birthTimeOptional')}
            </ThemedText>
            {birthTime ? (
              <View style={styles.selectedValueContainer}>
                <ThemedText variant="body" style={styles.selectedValue}>
                  {formatTime(birthTime)}
                </ThemedText>
                <TouchableOpacity onPress={handleClearTime} style={styles.clearButton}>
                  <ThemedText variant="caption" style={styles.clearButtonText}>
                    {t('common.delete')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timeOptionsContainer}>
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <ThemedText variant="body" style={styles.inputText}>
                    {t('profile.birthTimePlaceholder')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleClearTime}
                >
                  <ThemedText variant="body" style={styles.skipButtonText}>
                    {t('profile.birthTimeUnknown')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={birthTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Tier 3: Birth Location */}
          <View style={styles.section}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              {t('profile.birthLocation')} <ThemedText variant="caption" style={styles.optional}>
                ({t('common.optional')})
              </ThemedText>
            </ThemedText>
            <ThemedText variant="caption" style={styles.hintText}>
              {t('profile.birthLocationOptional')}
            </ThemedText>
            {birthLocation ? (
              <View style={styles.selectedValueContainer}>
                <ThemedText variant="body" style={styles.selectedValue}>
                  {locationDisplayName || birthLocation.display_name}
                </ThemedText>
                <TouchableOpacity onPress={handleClearLocation} style={styles.clearButton}>
                  <ThemedText variant="caption" style={styles.clearButtonText}>
                    {t('common.delete')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder={t('profile.birthLocationPlaceholder')}
              />
            )}
          </View>
            </>
          )}

          {/* Save Button */}
          <ThemedButton
            title={t('common.save')}
            onPress={saveProfile}
            disabled={loading || (useForReadings && !birthDate)}
            variant="primary"
            style={styles.saveButton}
          />

          {/* About Section */}
          <View style={styles.aboutSection}>
            <ThemedText variant="h3" style={styles.aboutTitle}>
              {t('profile.about')}
            </ThemedText>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => WebBrowser.openBrowserAsync('https://divin8.com/terms')}
            >
              <ThemedText variant="body" style={styles.linkText}>
                {t('profile.termsOfService')}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => WebBrowser.openBrowserAsync('https://divin8.com/privacy')}
            >
              <ThemedText variant="body" style={styles.linkText}>
                {t('profile.privacyPolicy')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <ThemedButton
            title={signingOut ? t('common.loading') : t('common.signOut')}
            onPress={handleSignOut}
            disabled={signingOut}
            variant="ghost"
            style={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </ThemedCard>
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.spacing.lg,
    paddingTop: theme.spacing.spacing.lg,
    paddingBottom: theme.spacing.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    color: theme.colors.text.secondary,
  },
  mainCard: {
    marginBottom: theme.spacing.spacing.md,
  },
  languageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spacing.xl,
    paddingVertical: theme.spacing.spacing.sm,
  },
  languageLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginRight: theme.spacing.spacing.sm,
  },
  successMessage: {
    backgroundColor: theme.colors.semantic.success + '20',
    padding: theme.spacing.spacing.sm,
    borderRadius: theme.spacing.borderRadius.sm,
    marginBottom: theme.spacing.spacing.md,
  },
  successText: {
    color: theme.colors.semantic.success,
  },
  section: {
    marginBottom: theme.spacing.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.xs,
    fontSize: 20,
    fontFamily: 'Cinzel_500Medium',
  },
  required: {
    color: theme.colors.semantic.error,
  },
  optional: {
    color: theme.colors.text.secondary,
  },
  hintText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.sm,
    fontStyle: 'italic',
  },
  inputButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary.gold,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    backgroundColor: theme.colors.neutrals.black,
  },
  inputText: {
    color: theme.colors.text.primary,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.spacing.sm,
  },
  skipButton: {
    borderWidth: 1,
    borderColor: theme.colors.neutrals.midGray,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    backgroundColor: 'transparent',
    flex: 1,
  },
  skipButtonText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  selectedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.primary.gold,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    backgroundColor: theme.colors.neutrals.black,
  },
  selectedValue: {
    color: theme.colors.text.primary,
    flex: 1,
  },
  clearButton: {
    padding: theme.spacing.spacing.xs,
  },
  clearButtonText: {
    color: theme.colors.semantic.error,
  },
  resultsCard: {
    marginTop: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.md,
    backgroundColor: theme.colors.neutrals.darkGray + '80',
  },
  resultsTitle: {
    fontSize: 20,
    fontFamily: 'Cinzel_500Medium',
    color: theme.colors.primary.goldLight,
    marginBottom: theme.spacing.spacing.sm,
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.sm,
  },
  calculatingText: {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.spacing.sm,
  },
  resultLabel: {
    color: theme.colors.text.secondary,
  },
  resultValue: {
    color: theme.colors.primary.gold,
    fontWeight: theme.typography.fontWeight.medium,
  },
  accuracyContainer: {
    marginTop: theme.spacing.spacing.sm,
    paddingTop: theme.spacing.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutrals.midGray,
  },
  accuracyText: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: theme.spacing.spacing.md,
  },
  toggleLabel: {
    marginBottom: theme.spacing.spacing.xs,
    color: theme.colors.primary.goldLight,
    fontSize: 20,
    fontFamily: 'Cinzel_500Medium',
  },
  toggleDescription: {
    color: theme.colors.text.secondary,
  },
  saveButton: {
    marginTop: theme.spacing.spacing.md,
  },
  signOutButton: {
    marginTop: theme.spacing.spacing.lg,
    paddingHorizontal: theme.spacing.spacing.lg,
  },
  signOutText: {
    color: theme.colors.semantic.error,
  },
  aboutSection: {
    marginTop: theme.spacing.spacing.xl,
    marginBottom: theme.spacing.spacing.md,
    paddingTop: theme.spacing.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutrals.midGray,
  },
  aboutTitle: {
    color: theme.colors.primary.gold,
    marginBottom: theme.spacing.spacing.md,
    fontSize: 20,
    fontFamily: 'Cinzel_500Medium',
  },
  linkButton: {
    paddingVertical: theme.spacing.spacing.sm,
    paddingHorizontal: theme.spacing.spacing.xs,
    marginBottom: theme.spacing.spacing.xs,
  },
  linkText: {
    color: theme.colors.primary.goldLight,
    textDecorationLine: 'underline',
  },
});

