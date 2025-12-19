// app/_layout.tsx - Root layout for Expo Router
// IMPORTANT: These must be imported first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TranslationProvider } from '../src/i18n';
import { ProfileProvider } from '../src/contexts/ProfileContext';
import { useFonts, Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
import { Lato_400Regular } from '@expo-google-fonts/lato';
import { View } from 'react-native';
import theme from '../src/theme';
import SpinningLogo from '../src/shared/components/ui/SpinningLogo';
import AIProvider from '../src/core/api/aiProvider';
import { geminiProvider } from '../src/core/api/gemini';
import { supabase } from '../src/core/api/supabase';

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
      AIProvider.register('gemini', geminiProvider);
      AIProvider.setProvider('gemini');
    } catch (error) {
      console.error('❌ Error initializing AI Provider:', error);
    }
  }, []);

  // Handle navigation based on auth state - this runs in the root layout which is always mounted
  useEffect(() => {
    if (!fontsLoaded) return;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:authChange',message:'Auth state changed in root layout',data:{event,hasSession:!!session,userId:session?.user?.id,currentSegments:segments.join('/')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Only navigate if we're not already on the correct route
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const isIndexRoute = segments.length === 0;
      const isResetPasswordRoute = segments.includes('reset-password');

      // Only navigate on SIGNED_IN or SIGNED_OUT events, and only if not already on correct route
      // IMPORTANT: Don't redirect away from reset-password route - user needs to complete password reset
      if ((event === 'SIGNED_IN' || event === 'SIGNED_OUT') && !isIndexRoute && !isResetPasswordRoute) {
        if (session && !inTabsGroup) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:authChangeHome',message:'Auth change - navigating to home',data:{hasSession:true,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          router.replace('/(tabs)/home');
        } else if (!session && !inAuthGroup) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_layout.tsx:authChangeLogin',message:'Auth change - navigating to login',data:{hasSession:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          router.replace('/(auth)/login');
        }
      }
    });

    return () => subscription.unsubscribe();
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
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_bottom',
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
          name="statistics" 
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

