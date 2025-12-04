// app/_layout.tsx - Root layout for Expo Router
// IMPORTANT: These must be imported first
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { TranslationProvider } from '../src/i18n';
import { useFonts, Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
import { Lato_400Regular } from '@expo-google-fonts/lato';
import { View, ActivityIndicator } from 'react-native';
import theme from '../src/theme';
import AIProvider from '../src/core/api/aiProvider';
import { geminiProvider } from '../src/core/api/gemini';

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

  useEffect(() => {
    // Register Gemini as the AI provider (must be done at root level)
    try {
      AIProvider.register('gemini', geminiProvider);
      AIProvider.setProvider('gemini');
      console.log('✅ AI Provider initialized: Gemini');
    } catch (error) {
      console.error('❌ Error initializing AI Provider:', error);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.gold} />
      </View>
    );
  }

  return (
    <TranslationProvider>
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
      </Stack>
    </TranslationProvider>
  );
}

