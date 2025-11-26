// src/features/auth/screens/LoginScreen.tsx
import React, { useState } from 'react';
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
import theme from '../../../shared/theme';
import MysticalBackground from '../../../shared/components/ui/MysticalBackground';
import ThemedText from '../../../shared/components/ui/ThemedText';
import ThemedButton from '../../../shared/components/ui/ThemedButton';
import ThemedCard from '../../../shared/components/ui/ThemedCard';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleEmailAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
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
          'Success!',
          'Check your email for verification link',
          [{ text: 'OK' }]
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
      Alert.alert('Error', error.message);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const session = await supabaseHelpers.signInWithGoogle();
      if (session?.user?.email) {
        console.log('✅ Google sign in:', session.user.email);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
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
            <ThemedText variant="h1">Divin8</ThemedText>
            <View style={styles.subtitleSpacer} />
            <ThemedText variant="body">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </ThemedText>
          </View>

          {/* Login Form Card */}
          <ThemedCard variant="elevated" style={styles.formCard}>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <ThemedButton
                title={loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
                onPress={handleEmailAuth}
                variant="primary"
                disabled={loading}
                style={styles.primaryButton}
              />

              <ThemedButton
                title={
                  isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"
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
              OR
            </ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <ThemedButton
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            disabled={loading}
            style={styles.googleButton}
            textStyle={styles.googleButtonText}
          />

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
  testButton: {
    marginTop: theme.spacing.spacing.sm,
  },
  testButtonText: {
    color: theme.colors.semantic.warning,
    fontSize: theme.typography.fontSize.sm,
  },
});
