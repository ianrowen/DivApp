// app/index.tsx - Root route for Expo Router
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import { debugLog } from '../src/utils/debugLog';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import SpinningLogo from '../src/shared/components/ui/SpinningLogo';

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session - wrap in try-catch to prevent crashes
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      debugLog('index.tsx:17', 'Initial session loaded', { hasSession: !!session, userId: session?.user?.id }, 'C');
      // #endregion
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      // #region agent log
      debugLog('index.tsx:21', 'Error getting initial session', { error: error?.message }, 'C');
      // #endregion
      setLoading(false);
    });

      // Listen for auth changes
      let subscription: { unsubscribe: () => void } | null = null;
      
      try {
        const {
          data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          try {
            // #region agent log
            debugLog('index.tsx:28', 'Auth state changed', { event, hasSession: !!session, userId: session?.user?.id }, 'B');
            // #endregion
            setSession(session);
            // Clear loading state when auth state changes (important for OAuth flow)
            setLoading(false);
          } catch (error) {
            console.error('❌ Error in auth state change handler:', error);
            setLoading(false);
          }
        });
        subscription = authSubscription;
      } catch (error) {
        console.error('❌ Error setting up auth state listener:', error);
      }

      return () => {
        try {
          subscription?.unsubscribe();
        } catch (error) {
          console.error('❌ Error unsubscribing from auth listener:', error);
        }
      };
    } catch (error) {
      console.error('❌ Error initializing session check:', error);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.loadingContainer}>
          <SpinningLogo size={120} />
          <ThemedText variant="body" style={styles.loadingText}>
            Loading...
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Redirect based on auth state - using key to force re-render when session changes
  if (session) {
    // #region agent log
    debugLog('index.tsx:49', 'Redirecting to home', { hasSession: true, userId: session?.user?.id }, 'F');
    // #endregion
    return <Redirect href="/(tabs)/home" key={`home-${session?.user?.id || 'session'}`} />;
  } else {
    // #region agent log
    debugLog('index.tsx:52', 'Redirecting to login', { hasSession: false }, 'F');
    // #endregion
    return <Redirect href="/(auth)/login" key="login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    color: theme.colors.text.secondary,
  },
});

