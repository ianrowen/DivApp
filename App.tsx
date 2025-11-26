// App.tsx
/**
 * Divin8 App Entry Point
 * * CRITICAL: This file handles:
 * - AI provider initialization
 * - Authentication state management
 * - Navigation setup
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as WebBrowser from 'expo-web-browser'; // Required for auth flows
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
} from '@expo-google-fonts/cinzel';
import {
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';

// Core
import AIProvider from './src/core/api/aiProvider';
import { geminiProvider } from './src/core/api/gemini';
import { supabase } from './src/core/api/supabase';
import type { User } from '@supabase/supabase-js';

// Theme
import theme from './src/shared/theme';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import TarotReadingScreen from './src/screens/TarotReadingScreen';
import HistoryScreen from './src/screens/HistoryScreen';

export type AppStackParamList = {
  Login: undefined;
  Home: undefined;
  TarotReading: undefined;
  History: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

// CRITICAL: Tell Expo's WebBrowser to check for and finish any pending auth flows.
// This is the most stable method for handling OAuth and Magic Link redirects.
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    'Cinzel': Cinzel_400Regular,
    'Cinzel-SemiBold': Cinzel_600SemiBold,
    'Lato': Lato_400Regular,
    'Lato-Bold': Lato_700Bold,
  });

  useEffect(() => {
    initializeApp();
  }, []);

  // Deep link URL handling for OAuth callbacks
  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 Initial URL received:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    // Handle URL events (app already running, new deep link arrives)
    const handleURL = (event: { url: string }) => {
      console.log('🔗 URL event received:', event.url);
      handleDeepLink(event.url);
    };

    // Process deep link URL
    const handleDeepLink = async (url: string) => {
      try {
        console.log('🔍 Processing deep link:', url);

        // Check if URL contains OAuth tokens or codes
        if (url.includes('access_token') || url.includes('code')) {
          console.log('✅ OAuth callback detected in URL');

          // Parse URL to extract parameters
          const parsedUrl = Linking.parse(url);
          const params = parsedUrl.queryParams || {};

          console.log('📋 Extracted URL params:', JSON.stringify(params, null, 2));

          // Check for access_token and refresh_token (Supabase OAuth)
          if (params.access_token && params.refresh_token) {
            console.log('🔑 Found access_token and refresh_token, setting session...');
            
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: params.access_token as string,
                refresh_token: params.refresh_token as string,
              });

              if (error) {
                console.error('❌ Error setting session:', error);
              } else {
                console.log('✅ Session set successfully:', data.user?.email);
                setUser(data.user);
              }
            } catch (sessionError) {
              console.error('❌ Exception setting session:', sessionError);
            }
          } else if (params.code) {
            console.log('🔐 Found authorization code:', params.code);
            // Note: Supabase typically handles code exchange automatically,
            // but we log it here for debugging
          } else {
            console.log('⚠️ URL contains OAuth indicators but no recognizable tokens/codes');
          }
        } else {
          console.log('ℹ️ URL does not appear to be an OAuth callback');
        }
      } catch (error) {
        console.error('❌ Error processing deep link:', error);
      }
    };

    // Set up listeners
    handleInitialURL();
    const subscription = Linking.addEventListener('url', handleURL);

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);

  async function initializeApp() {
    try {
      // 1. Register AI providers
      AIProvider.register('gemini', geminiProvider);
      AIProvider.setProvider('gemini');
      console.log('✅ AI provider initialized');

      // 2. Check initial authentication state (Supabase persistence)
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log('✅ Auth state loaded:', session?.user ? 'User logged in' : 'No user');

      // 3. Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        // This listener automatically updates when tokens arrive from the deep link redirect
        setUser(session?.user ?? null);
      });

      setIsReady(true);

      // Cleanup subscription on unmount
      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setIsReady(true);
    }
  }

  // Show loading screen while fonts are loading or app is initializing
  if (!fontsLoaded || !isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary.gold} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.neutrals.black} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: theme.colors.neutrals.black },
          }}
        >
          {user ? (
            // Authenticated: Show main app screens
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="TarotReading" component={TarotReadingScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
            </>
          ) : (
            // Not authenticated: Show login screen
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutrals.black,
  },
});
