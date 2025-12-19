// app/supabase-auth.tsx
// OAuth callback handler - prevents "unmatched route" error
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';

export default function SupabaseAuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Handle OAuth callbacks and email confirmation links
    // OAuth callbacks are already handled by WebBrowser.openAuthSessionAsync
    // Email confirmation links come from the web redirect page
    console.log('[Auth Callback] Route accessed with params:', params);

    const accessToken = params.access_token as string | undefined;
    const refreshToken = params.refresh_token as string | undefined;
    const type = params.type as string | undefined;

    // If we have tokens, set the session (for email confirmation)
    // NOTE: Do NOT handle 'recovery' type here - that's handled by reset-password.tsx
    if (accessToken && (type === 'signup' || type === 'email')) {
      console.log('[Auth Callback] Setting session with signup/email confirmation token');
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (error) {
          console.error('[Auth Callback] Error setting session:', error);
          Alert.alert(
            'Error',
            'Failed to confirm your account. The link may have expired. Please try signing up again or contact support.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
          setProcessing(false);
        } else {
          console.log('[Auth Callback] Session established successfully');
          // Wait a moment for the session to be established, then redirect
          setTimeout(() => {
            setProcessing(false);
            // Redirect to root - app/index.tsx will handle auth state and redirect appropriately
            router.replace('/');
          }, 500);
        }
      });
    } else {
      // No tokens, just wait and redirect (for OAuth flows already processed)
      const timer = setTimeout(() => {
        setProcessing(false);
        router.replace('/');
      }, 500);
      return () => clearTimeout(timer);
    }
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

