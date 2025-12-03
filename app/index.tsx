// app/index.tsx - Root route for Expo Router
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/shared/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.loadingContainer}>
          <ThemedText variant="h1" style={styles.loadingEmoji}>
            🔮
          </ThemedText>
          <ActivityIndicator size="large" color={theme.colors.primary.gold} />
          <ThemedText variant="body" style={styles.loadingText}>
            Loading...
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spacing.xl,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    color: theme.colors.text.secondary,
  },
});

