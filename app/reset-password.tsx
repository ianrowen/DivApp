// app/reset-password.tsx
// Handles password reset deep links: divin8://reset-password?access_token=...&type=recovery
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import { useTranslation } from '../src/i18n';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; type?: string; refresh_token?: string; code?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for password recovery event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state change in reset-password:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD_RECOVERY event detected');
        setIsValidToken(true);
        setErrorMessage(null);
      }
    });

    console.log('🔍 Reset Password Screen - Params received:', {
      hasAccessToken: !!params.access_token,
      type: params.type,
      hasRefreshToken: !!params.refresh_token,
      hasCode: !!params.code,
      accessTokenLength: params.access_token?.length,
      refreshTokenLength: params.refresh_token?.length,
      codeLength: params.code?.length,
      allParams: Object.keys(params),
    });
    
    // Check if we have a code that needs to be exchanged (from email link)
    // Note: Codes need to be exchanged via web page first, then redirected to app
    // This is a fallback in case code somehow reaches app directly
    if (params.code && !params.access_token) {
      console.log('⚠️ Code parameter detected in app - codes should be exchanged via web page first');
      setErrorMessage('Please use the password reset link from your email. Codes must be exchanged via web page.');
      setIsValidToken(false);
      Alert.alert(
        'Invalid Link',
        'Please click the password reset link from your email. The link will open in a browser first, then redirect to the app.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }
    // Check if we have a valid recovery token
    else if (params.access_token && params.type === 'recovery') {
      console.log('✅ Password reset token detected');
      console.log('📝 Access token (first 20 chars):', params.access_token.substring(0, 20) + '...');
      console.log('📝 Refresh token (first 20 chars):', params.refresh_token?.substring(0, 20) + '...');
      
      // Expo Router's useLocalSearchParams should automatically decode URL parameters
      // But if the token contains % characters, it might still be encoded
      let accessToken = params.access_token;
      let refreshToken = params.refresh_token || '';
      
      // Check if token looks encoded (contains % characters)
      // If so, try decoding it
      if (accessToken.includes('%')) {
        try {
          const decodedAccess = decodeURIComponent(accessToken);
          console.log('🔐 Token appears encoded, decoded it');
          accessToken = decodedAccess;
        } catch (e) {
          console.log('⚠️ Could not decode access token, using as-is');
        }
      } else {
        console.log('🔐 Token appears already decoded');
      }
      
      if (refreshToken && refreshToken.includes('%')) {
        try {
          const decodedRefresh = decodeURIComponent(refreshToken);
          console.log('🔐 Refresh token appears encoded, decoded it');
          refreshToken = decodedRefresh;
        } catch (e) {
          console.log('⚠️ Could not decode refresh token, using as-is');
        }
      }
      
      console.log('🔐 Final access token (first 20 chars):', accessToken.substring(0, 20) + '...');
      console.log('🔐 Token length:', accessToken.length);
      
      // Exchange the recovery token for a session
      // This allows the user to update their password
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ Error setting session:', error);
          console.error('❌ Error code:', error.code);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error status:', error.status);
          
          // Show more detailed error message
          const errorMsg = error.message || 'Unknown error';
          const errorDetails = error.code ? `Error code: ${error.code}` : '';
          setErrorMessage(`${errorMsg}\n${errorDetails}`);
          
          Alert.alert(
            'Invalid Link',
            `This password reset link is invalid or has expired.\n\n${errorMsg}\n${errorDetails}\n\nPlease request a new password reset.`,
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
          setIsValidToken(false);
        } else if (data.session) {
          console.log('✅ Recovery session established');
          console.log('✅ Session user ID:', data.session.user?.id);
          console.log('✅ Session expires at:', data.session.expires_at);
          setIsValidToken(true);
          setErrorMessage(null);
        } else {
          console.error('❌ No session returned from setSession');
          setErrorMessage('No session returned from Supabase');
          Alert.alert(
            'Invalid Link',
            'Failed to establish session. Please request a new password reset.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
          setIsValidToken(false);
        }
      }).catch((catchError) => {
        console.error('❌ Exception in setSession:', catchError);
        setErrorMessage(catchError?.message || 'Unknown error');
        Alert.alert(
          'Error',
          `An unexpected error occurred: ${catchError?.message || 'Unknown error'}`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
        setIsValidToken(false);
      });
    } else {
      console.log('⚠️ No valid password reset token found');
      console.log('⚠️ Missing params:', {
        hasAccessToken: !!params.access_token,
        type: params.type,
        expectedType: 'recovery',
      });
      setErrorMessage('Missing access_token or type parameter');
      Alert.alert(
        'Invalid Link',
        'This password reset link is invalid or has expired. Please request a new password reset.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [params]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(t('common.error'), 'Please enter both password fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Exchange the recovery token for a session and update password
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      Alert.alert(
        'Password Reset',
        'Your password has been successfully reset. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        t('common.error'),
        error?.message || 'Failed to reset password. The link may have expired. Please request a new password reset.',
        [
          {
            text: 'Request New Link',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <MysticalBackground variant="default">
        <View style={styles.container}>
          <ThemedText variant="h2">Loading...</ThemedText>
          {errorMessage && (
            <ThemedText variant="body" style={styles.errorText}>
              ❌ {errorMessage}
            </ThemedText>
          )}
        </View>
      </MysticalBackground>
    );
  }

  return (
    <MysticalBackground variant="default">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText variant="h1">Reset Password</ThemedText>
            <View style={styles.subtitleSpacer} />
            <ThemedText variant="body">Enter your new password below</ThemedText>
          </View>

          <ThemedCard variant="elevated" style={styles.formCard}>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                autoCapitalize="none"
              />

              <ThemedButton
                title={loading ? 'Resetting...' : 'Reset Password'}
                onPress={handleResetPassword}
                variant="primary"
                disabled={loading}
                style={styles.primaryButton}
              />

              <ThemedButton
                title="Cancel"
                onPress={() => router.replace('/(auth)/login')}
                variant="ghost"
                disabled={loading}
                style={styles.cancelButton}
              />
            </View>
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.spacing.lg,
    paddingVertical: theme.spacing.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  subtitleSpacer: {
    height: theme.spacing.spacing.sm,
  },
  formCard: {
    marginBottom: theme.spacing.spacing.lg,
  },
  form: {
    gap: theme.spacing.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.neutrals.darkGray,
    borderWidth: 1,
    borderColor: theme.colors.primary.goldDark,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.body,
  },
  primaryButton: {
    marginTop: theme.spacing.spacing.sm,
  },
  cancelButton: {
    marginTop: theme.spacing.spacing.xs,
  },
  errorText: {
    color: theme.colors.semantic.error,
    marginTop: theme.spacing.spacing.md,
    textAlign: 'center',
  },
});

