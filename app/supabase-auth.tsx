// app/supabase-auth.tsx
// OAuth callback handler - prevents "unmatched route" error
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';

export default function SupabaseAuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // The OAuth callback is already handled by WebBrowser.openAuthSessionAsync
    // in the signInWithGoogle/signInWithApple functions.
    // This route just prevents Expo Router from showing an "unmatched route" error.
    // The actual OAuth processing happens before navigation.
    console.log('[OAuth Callback] Route accessed with params:', params);

    // Wait a moment for the session to be established, then redirect
    const timer = setTimeout(() => {
      setProcessing(false);
      // Redirect to root - app/index.tsx will handle auth state and redirect appropriately
      router.replace('/');
    }, 500);

    return () => clearTimeout(timer);
  }, [params, router]);

  if (processing) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.colors.primary.gold} />
        </View>
      </MysticalBackground>
    );
  }

  // Redirect to root - the auth state change will be handled by app/index.tsx
  return <Redirect href="/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

