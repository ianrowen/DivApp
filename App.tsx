// App.tsx
/**
 * Divin8 App Entry Point
 * 
 * Initializes:
 * - AI providers (Gemini)
 * - Navigation
 * - Authentication state
 * - Global error handling
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Core
import AIProvider from './src/core/api/aiProvider';
import { geminiProvider } from './src/core/api/gemini';
import { supabase } from './src/core/api/supabase';

// Screens (you'll create these)
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/features/auth/screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // 1. Register AI providers
      AIProvider.register('gemini', geminiProvider);
      AIProvider.setProvider('gemini'); // Set Gemini as active
      console.log('✅ AI provider initialized');

      // 2. Check authentication state
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log('✅ Auth state loaded');

      // 3. Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      setIsReady(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      // Show error to user (implement error boundary)
    }
  }

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // Authenticated routes
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              {/* Add more authenticated screens here */}
            </>
          ) : (
            // Unauthenticated routes
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
    backgroundColor: '#F9FAFB',
  },
});
