// src/features/auth/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase, supabaseHelpers } from '../../../core/api/supabase';
import theme from '../../../theme';
import MysticalBackground from '../../../shared/components/ui/MysticalBackground';
import ThemedText from '../../../shared/components/ui/ThemedText';
import ThemedButton from '../../../shared/components/ui/ThemedButton';
import ThemedCard from '../../../shared/components/ui/ThemedCard';
import { useTranslation } from '../../../i18n';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Reset loading state when auth state changes (user signs in or error occurs)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if Apple Sign In is available (iOS only)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          // Dynamically import expo-apple-authentication only on iOS
          const AppleAuthentication = await import('expo-apple-authentication');
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(available);
        } catch (error) {
          console.log('Apple Sign In not available:', error);
          setIsAppleAvailable(false);
        }
      }
    };
    checkAppleAvailability();
  }, []);

  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.pleaseEnterEmailPassword'));
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://bawkzybwbpoxftgawvha.supabase.co',
          },
        });

        if (error) throw error;

        Alert.alert(
          t('auth.success'),
          t('auth.checkEmail'),
          [{ text: t('common.ok') }]
        );
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log('✅ Signed in:', data.user?.email);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      console.log('🔵 Starting Google sign in...');
      await supabaseHelpers.signInWithGoogle();
      console.log('🔵 Browser opened, waiting for OAuth callback...');
      // Don't set loading to false here - keep it true while waiting for OAuth callback
      // The loading state will be reset when auth state changes or on error
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Google sign in error:', error);
      Alert.alert(t('common.error'), error?.message || 'Failed to start Google sign in');
    }
  }

  async function handleAppleSignIn() {
    setLoading(true);
    try {
      console.log('🍎 Starting Apple sign in...');
      await supabaseHelpers.signInWithApple();
      console.log('🍎 Apple sign in successful');
      // Loading will be reset when auth state changes
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Apple sign in error:', error);
      // Don't show alert for user cancellation
      if (error?.message !== 'Sign in cancelled') {
        Alert.alert(t('common.error'), error?.message || t('auth.appleSignInFailed'));
      }
    }
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
          {/* Header */}
          <View style={styles.header}>
            <ThemedText variant="h1" style={styles.logo}>
              🔮
            </ThemedText>
            <ThemedText variant="h1">{t('common.appName')}</ThemedText>
            <View style={styles.subtitleSpacer} />
            <ThemedText variant="body">
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </ThemedText>
          </View>

          {/* Login Form Card */}
          <ThemedCard variant="elevated" style={styles.formCard}>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <ThemedButton
                title={loading ? '...' : isSignUp ? t('auth.signUp') : t('auth.signIn')}
                onPress={handleEmailAuth}
                variant="primary"
                disabled={loading}
                style={styles.primaryButton}
              />

              <ThemedButton
                title={
                  isSignUp
                    ? t('auth.alreadyHaveAccount')
                    : t('auth.dontHaveAccount')
                }
                onPress={() => setIsSignUp(!isSignUp)}
                variant="ghost"
                disabled={loading}
                style={styles.switchButton}
              />
            </View>
          </ThemedCard>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText variant="caption" style={styles.dividerText}>
              {t('common.or')}
            </ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <ThemedButton
            title={t('auth.continueWithGoogle')}
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={loading}
            style={styles.googleButton}
            textStyle={styles.googleButtonText}
          />

          {/* Apple Sign In Button - iOS only */}
          {isAppleAvailable && (
            <ThemedButton
              title={t('auth.continueWithApple')}
              onPress={handleAppleSignIn}
              variant="secondary"
              disabled={loading}
              style={styles.appleButton}
              textStyle={styles.appleButtonText}
            />
          )}

          {/* Test Button - Remove after deep linking works */}
          {__DEV__ && (
            <ThemedButton
              title="🧪 Test Deep Link"
              onPress={() => {
                Alert.alert(
                  'Test Deep Link',
                  'This will test if deep linking works',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Test',
                      onPress: async () => {
                        // Simulate receiving a token via deep link
                        console.log('🧪 Testing deep link handling...');
                        console.log('In production, this would come from OAuth callback');
                      },
                    },
                  ]
                );
              }}
              variant="ghost"
              style={styles.testButton}
              textStyle={styles.testButtonText}
            />
          )}
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
  logo: {
    fontSize: 64,
    marginBottom: theme.spacing.spacing.md,
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
  switchButton: {
    marginTop: theme.spacing.spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutrals.midGray,
  },
  dividerText: {
    marginHorizontal: theme.spacing.spacing.md,
    color: theme.colors.text.tertiary,
  },
  googleButton: {
    marginBottom: theme.spacing.spacing.md,
  },
  googleButtonText: {
    color: theme.colors.primary.gold,
  },
  appleButton: {
    marginBottom: theme.spacing.spacing.md,
  },
  appleButtonText: {
    color: theme.colors.primary.gold,
  },
  testButton: {
    marginTop: theme.spacing.spacing.sm,
  },
  testButtonText: {
    color: theme.colors.semantic.warning,
    fontSize: theme.typography.fontSize.sm,
  },
});
