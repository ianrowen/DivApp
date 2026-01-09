// app/_layout.tsx - Root layout for Expo Router
// IMPORTANT: These must be imported first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import { TranslationProvider } from '../src/i18n';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { useFonts, Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
import { Lato_400Regular } from '@expo-google-fonts/lato';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import theme from '../src/theme';
import SpinningLogo from '../src/shared/components/ui/SpinningLogo';
import AIProvider from '../src/core/api/aiProvider';
import { geminiProvider } from '../src/core/api/gemini';
import { supabase } from '../src/core/api/supabase';
import { debugLog } from '../src/utils/debugLog';

// Set up error handler immediately at module load time to catch early errors
(function setupKeepAwakeErrorHandler() {
  const isKeepAwakeError = (error: any): boolean => {
    const errorMessage = error?.message || error?.toString() || '';
    return (
      errorMessage.includes('keep awake') ||
      errorMessage.includes('keepAwake') ||
      errorMessage.includes('Unable to activate keep awake') ||
      errorMessage.includes('activateKeepAwake')
    );
  };

  // Handle web platform unhandled rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    if (isKeepAwakeError(error)) {
      event.preventDefault();
      // Silently ignore this error as it's expected on web platforms
      return;
    }
    // Log other unhandled rejections for debugging
    console.error('Unhandled promise rejection:', error);
  };

  // Handle React Native platform errors (ErrorUtils is a global in React Native)
  if (typeof (global as any).ErrorUtils !== 'undefined') {
    const ErrorUtils = (global as any).ErrorUtils;
    const originalHandler = ErrorUtils.getGlobalHandler?.();
    const handleGlobalError = (error: Error, isFatal?: boolean) => {
      if (isKeepAwakeError(error)) {
        // Silently ignore this error
        return;
      }
      // Call original handler for other errors
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    };
    ErrorUtils.setGlobalHandler(handleGlobalError);
  }

  // Only set up web event listeners if we're actually on web
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
})();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Lato_400Regular,
  });
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Register Gemini as the AI provider (must be done at root level)
    try {
      // Check if API key is available before registering
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ EXPO_PUBLIC_GEMINI_API_KEY not found at app startup. AI features will not work.');
        console.error('❌ This usually means the EAS secret is not available to your build profile.');
      }
      
      AIProvider.register('gemini', geminiProvider);
      AIProvider.setProvider('gemini');
    } catch (error) {
      // Error initializing AI Provider - silently fail
    }

    // Configure Android system UI for edge-to-edge mode and proper navigation bar styling
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(theme.colors.neutrals.black).catch(() => {
        // Silently fail if system UI configuration fails
      });
    }
  }, []);

  // Handle navigation based on auth state - this runs in the root layout which is always mounted
  useEffect(() => {
    if (!fontsLoaded) return;

    // Listen for auth changes - wrap in try-catch to prevent crashes
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        try {
      // #region agent log
      debugLog('_layout.tsx:authChange', 'Auth state changed in root layout', { event, hasSession: !!session, userId: session?.user?.id, currentSegments: segments.join('/') }, 'A');
      // #endregion
      
      // Only navigate if we're not already on the correct route
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const isIndexRoute = segments.length === 0;
      const isResetPasswordRoute = segments.includes('reset-password');

      // #region agent log
      debugLog('_layout.tsx:routeCheck', 'Route check before redirect logic', { event, hasSession: !!session, inAuthGroup, inTabsGroup, isIndexRoute, isResetPasswordRoute, currentSegments: segments.join('/') }, 'A');
      // #endregion

      // Only navigate on SIGNED_IN or SIGNED_OUT events, and only if not already on correct route
      // IMPORTANT: Don't redirect away from reset-password route - user needs to complete password reset
      // IMPORTANT: For SIGNED_OUT, always redirect to login (even if in tabs group)
      // IMPORTANT: For SIGNED_IN, don't redirect if already in tabs group (user is navigating between tabs)
      // #region agent log
      debugLog('_layout.tsx:authChangeCheck', 'Checking if should redirect', { event, hasSession: !!session, inTabsGroup, isIndexRoute, isResetPasswordRoute, currentSegments: segments.join('/') }, 'A');
      // #endregion
      
      // Handle SIGNED_OUT separately - always redirect to login unless already there
      if (event === 'SIGNED_OUT' && !isIndexRoute && !isResetPasswordRoute && !inAuthGroup) {
        // #region agent log
        debugLog('_layout.tsx:signOutRedirect', 'SIGNED_OUT event - navigating to login', { hasSession: false, currentSegments: segments.join('/'), inTabsGroup }, 'A');
        // #endregion
        router.replace('/(auth)/login');
      } 
      // Handle SIGNED_IN - only redirect if not in tabs group (to avoid interrupting tab navigation)
      else if (event === 'SIGNED_IN' && !isIndexRoute && !isResetPasswordRoute && !inTabsGroup) {
        if (session) {
          // #region agent log
          debugLog('_layout.tsx:authChangeHome', 'Auth change - navigating to home', { hasSession: true, userId: session?.user?.id, currentSegments: segments.join('/') }, 'A');
          // #endregion
          router.replace('/(tabs)/home');
        }
      } else {
        // #region agent log
        debugLog('_layout.tsx:authChangeSkipped', 'Auth change navigation skipped', { event, isIndexRoute, isResetPasswordRoute, inTabsGroup, inAuthGroup, currentSegments: segments.join('/') }, 'A');
        // #endregion
      }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          // Don't crash - just log the error
        }
      });
      subscription = authSubscription;
    } catch (error) {
      console.error('❌ Error setting up auth state listener:', error);
      // Don't crash - app can still function without auth listener
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (error) {
        console.error('❌ Error unsubscribing from auth listener:', error);
      }
    };
  }, [fontsLoaded, router, segments]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <SpinningLogo size={100} />
      </View>
    );
  }

  return (
    <TranslationProvider>
      <ProfileProvider>
        <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="spread-selection" 
          options={{ 
            presentation: 'card', // Changed from 'modal' to 'card' for better iOS compatibility
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right', // Changed to match spread-selection.tsx
          }} 
        />
        <Stack.Screen 
          name="reading" 
          options={{ 
            headerShown: true,
            title: '',
            headerStyle: { 
              backgroundColor: theme.colors.neutrals.black 
            },
            headerTintColor: theme.colors.primary.gold,
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="analysis" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="tarot-reading" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="reset-password" 
          options={{ 
            headerShown: true,
            title: 'Reset Password',
            headerStyle: { 
              backgroundColor: theme.colors.neutrals.black 
            },
            headerTintColor: theme.colors.primary.gold,
            headerBackTitle: 'Back',
          }} 
        />
      </Stack>
      </ProfileProvider>
    </TranslationProvider>
  );
}

