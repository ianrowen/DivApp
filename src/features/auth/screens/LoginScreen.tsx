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
  Image,
} from 'react-native';
import { supabase, supabaseHelpers } from '../../../core/api/supabase';
import theme from '../../../theme';
import MysticalBackground from '../../../shared/components/ui/MysticalBackground';
import ThemedText from '../../../shared/components/ui/ThemedText';
import ThemedButton from '../../../shared/components/ui/ThemedButton';
import ThemedCard from '../../../shared/components/ui/ThemedCard';
import { useTranslation } from '../../../i18n';
import { debugLog } from '../../../utils/debugLog';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Reset loading state when auth state changes (user signs in or error occurs)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // #region agent log
      debugLog('LoginScreen.tsx:31', 'Auth state change in LoginScreen', {event,hasSession:!!session,userId:session?.user?.id}, 'D');
      // #endregion
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // #region agent log
        debugLog('LoginScreen.tsx:33', 'Resetting loading state', {event}, 'D');
        // #endregion
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
        // Use web URL that will redirect to app (same pattern as password reset)
        const confirmUrl = 'https://divin8.com/confirm-signup.html';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: confirmUrl,
          },
        });

        if (error) {
          console.error('Signup error:', error);
          throw error;
        }

        // Check if user was auto-confirmed (email confirmation disabled)
        if (data.user && data.session) {
          console.log('✅ User signed up and auto-confirmed:', data.user.email);
          // User is automatically signed in - auth state change will handle navigation
        } else if (data.user) {
          // User created but needs email confirmation
          console.log('📧 User created, confirmation email should be sent to:', data.user.email);
          Alert.alert(
            t('auth.success'),
            `Account created! Please check your email (${email}) to confirm your account.\n\nCheck your spam folder if you don't see it.\n\nNote: If emails are not being sent, check Supabase Dashboard → Authentication → Email Templates and SMTP settings.`,
            [{ text: t('common.ok') }]
          );
        } else {
          Alert.alert(
            t('common.error'),
            'Signup completed but no user data returned. Please try signing in, or contact support if the issue persists.',
            [{ text: t('common.ok') }]
          );
        }
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
      console.error('Auth error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid credentials')) {
        // Show forgot password link when incorrect password is entered
        setShowForgotPassword(true);
        Alert.alert(
          t('common.error'),
          'Invalid email or password. Would you like to reset your password?',
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: 'Reset Password',
              onPress: async () => {
                    try {
                      // Use web URL that will exchange code and redirect to app
                      // CRITICAL: Must be a web URL (not deep link) - Supabase requires web URLs in email links
                      // The web page will exchange code for tokens, then redirect to app deep link
                      const resetUrl = 'https://divin8.com/reset-password.html';
                      
                      console.log('📧 Requesting password reset for:', email);
                      console.log('📧 Redirect URL:', resetUrl);
                      console.log('⚠️ IMPORTANT: This URL must be in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs');
                      
                      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: resetUrl,
                      });
                      
                      if (resetError) {
                        console.error('❌ Password reset error:', resetError);
                        console.error('❌ Error code:', resetError.code);
                        console.error('❌ Error message:', resetError.message);
                        throw resetError;
                      }
                      
                      console.log('✅ Password reset request accepted by Supabase');
                      console.log('⚠️ NOTE: Supabase returns success even if email sending fails');
                      console.log('⚠️ Check Supabase Dashboard → Authentication → Logs for email sending status');
                      console.log('⚠️ Look for "email_sent" or "email_failed" events after "user_recovery_requested"');
                      
                      // Check if we got any data back (Supabase might return email sending status)
                      if (data) {
                        console.log('📧 Response data:', JSON.stringify(data, null, 2));
                      }
                      
                      Alert.alert(
                        'Password Reset Requested',
                        `Password reset instructions have been sent to ${email}. Please check your email to reset your password.`,
                        [{ text: t('common.ok') }]
                      );
                    } catch (resetErr: any) {
                      console.error('❌ Exception requesting password reset:', resetErr);
                      Alert.alert(
                        t('common.error'), 
                        `Failed to request password reset:\n\n${resetErr?.message || 'Unknown error'}\n\nCheck Supabase Dashboard → Authentication → Logs for details.`,
                        [{ text: t('common.ok') }]
                      );
                    }
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), error.message || 'An error occurred');
      }
      
      // Reset form state on error to allow retry
      setEmail('');
      setPassword('');
      setShowForgotPassword(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    // #region agent log
    debugLog('LoginScreen.tsx:104', 'handleGoogleSignIn entry', {}, 'A');
    // #endregion
    setLoading(true);
    try {
      const session = await supabaseHelpers.signInWithGoogle();
      // #region agent log
      debugLog('LoginScreen.tsx:108', 'signInWithGoogle returned', {hasSession:!!session,userId:session?.user?.id}, 'A');
      // #endregion
      // Don't set loading to false here - keep it true while waiting for OAuth callback
      // The loading state will be reset when auth state changes or on error
    } catch (error: any) {
      // #region agent log
      debugLog('LoginScreen.tsx:112', 'Google sign in error', {error:error?.message}, 'A');
      // #endregion
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
            <Image
              source={require('../../../../assets/images/logo/divin8-card-curtains-horizontal.webp')}
              style={styles.logo}
              resizeMode="contain"
            />
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
                onChangeText={(text) => {
                  setPassword(text);
                  // Hide forgot password link when user starts typing again
                  if (showForgotPassword) {
                    setShowForgotPassword(false);
                  }
                }}
                secureTextEntry
                editable={!loading}
              />

              {!isSignUp && showForgotPassword && (
                <ThemedButton
                  title="Forgot Password?"
                  onPress={async () => {
                    if (!email) {
                      Alert.alert(t('common.error'), 'Please enter your email address first');
                      return;
                    }
                    try {
                      // Use web URL that will redirect to app
                      // IMPORTANT: This URL MUST be added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
                      // If emails aren't sending, check that this URL is in the allowed list!
                      const resetUrl = 'https://divin8.com/reset-password.html';
                      
                      console.log('📧 Requesting password reset for:', email);
                      console.log('📧 Using redirect URL:', resetUrl);
                      console.log('⚠️ CRITICAL: Make sure this URL is in Supabase allowed redirect URLs!');
                      console.log('⚠️ Go to: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs');
                      
                      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: resetUrl,
                      });
                      
                      if (resetError) {
                        console.error('❌ Password reset error:', resetError);
                        console.error('❌ Error code:', resetError.code);
                        console.error('❌ Error message:', resetError.message);
                        throw resetError;
                      }
                      
                      console.log('✅ Password reset request accepted by Supabase');
                      Alert.alert(
                        'Password Reset Requested',
                        `Password reset instructions have been sent to ${email}. Please check your email to reset your password.`,
                        [{ text: t('common.ok') }]
                      );
                    } catch (resetErr: any) {
                      Alert.alert(t('common.error'), resetErr?.message || 'Failed to send password reset email');
                    }
                  }}
                  variant="ghost"
                  disabled={loading}
                  style={styles.forgotPasswordButton}
                />
              )}

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
    width: 120,
    height: 120,
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
  forgotPasswordButton: {
    marginTop: theme.spacing.spacing.xs,
    marginBottom: theme.spacing.spacing.xs,
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
});
