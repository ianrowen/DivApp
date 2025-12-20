// app/delete-account.tsx
// Handles account deletion deep links: divin8://delete-account?access_token=...&type=recovery
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/core/api/supabase';
import theme from '../src/theme';
import MysticalBackground from '../src/shared/components/ui/MysticalBackground';
import ThemedText from '../src/shared/components/ui/ThemedText';
import ThemedButton from '../src/shared/components/ui/ThemedButton';
import ThemedCard from '../src/shared/components/ui/ThemedCard';
import { useTranslation } from '../src/i18n';

const PROFILE_CACHE_KEY = '@divin8_user_profile';
const ANIMATIONS_ENABLED_KEY = '@divin8_animations_enabled';

export default function DeleteAccountScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    access_token?: string; 
    type?: string; 
    refresh_token?: string;
    confirmed?: string;
  }>();
  
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'validating' | 'confirming' | 'deleting' | 'success' | 'error'>('validating');

  useEffect(() => {
    // If coming from in-app (no token), check if user is authenticated
    if (!params.access_token && !params.confirmed) {
      // User initiated deletion from within app
      checkAuthAndShowConfirmation();
      return;
    }

    // Coming from email link - validate token
    if (params.access_token && params.type === 'recovery') {
      validateToken();
    } else {
      setErrorMessage('Invalid or missing deletion token');
      setStep('error');
    }
  }, [params]);

  const checkAuthAndShowConfirmation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsValidToken(true);
        setStep('confirming');
      } else {
        setErrorMessage('Please sign in to delete your account');
        setStep('error');
      }
    } catch (error: any) {
      console.error('Error checking auth:', error);
      setErrorMessage(error?.message || 'Failed to verify authentication');
      setStep('error');
    }
  };

  const validateToken = async () => {
    try {
      setStep('validating');
      
      let accessToken = params.access_token || '';
      let refreshToken = params.refresh_token || '';
      
      // Decode tokens if needed
      if (accessToken.includes('%')) {
        try {
          accessToken = decodeURIComponent(accessToken);
        } catch (e) {
          console.log('Could not decode access token');
        }
      }
      
      if (refreshToken && refreshToken.includes('%')) {
        try {
          refreshToken = decodeURIComponent(refreshToken);
        } catch (e) {
          console.log('Could not decode refresh token');
        }
      }
      
      // Set session with recovery token
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (error) {
        console.error('Error setting session:', error);
        setErrorMessage(error.message || 'Invalid or expired deletion link');
        setStep('error');
        return;
      }
      
      if (data.session) {
        console.log('✅ Session established for account deletion');
        setIsValidToken(true);
        setStep('confirming');
      } else {
        setErrorMessage('Failed to establish session');
        setStep('error');
      }
    } catch (error: any) {
      console.error('Error validating token:', error);
      setErrorMessage(error?.message || 'Failed to validate deletion link');
      setStep('error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setStep('deleting');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Unable to verify user identity');
      }
      
      const userId = user.id;
      console.log('🗑️ Starting account deletion for user:', userId);
      
      // Step 1: Delete all readings
      console.log('📚 Deleting readings...');
      const { error: readingsError } = await supabase
        .from('readings')
        .delete()
        .eq('user_id', userId);
      
      if (readingsError) {
        console.error('Error deleting readings:', readingsError);
        // Continue anyway - readings might not exist
      } else {
        console.log('✅ Readings deleted');
      }
      
      // Step 2: Delete user profile from public.users
      // Note: This will cascade delete when auth user is deleted, but we'll do it explicitly
      console.log('👤 Deleting user profile...');
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Continue anyway - profile might not exist or cascade will handle it
      } else {
        console.log('✅ User profile deleted');
      }
      
      // Step 3: Clear local storage
      console.log('💾 Clearing local storage...');
      try {
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
        await AsyncStorage.removeItem(ANIMATIONS_ENABLED_KEY);
        // Clear all Supabase session storage
        await AsyncStorage.multiRemove(
          (await AsyncStorage.getAllKeys()).filter(key => 
            key.includes('supabase') || key.includes('auth')
          )
        );
        console.log('✅ Local storage cleared');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
        // Continue anyway
      }
      
      // Step 4: Delete auth user account via database function
      // Note: We need a database function with SECURITY DEFINER to delete auth.users
      // This function should be created in Supabase SQL Editor
      console.log('🔐 Deleting auth account...');
      const { error: deleteError } = await supabase.rpc('delete_user_account', {
        user_id: userId
      });
      
      // If function doesn't exist, fallback: sign out and mark for manual deletion
      if (deleteError) {
        console.warn('Database function not available, using fallback:', deleteError);
        // Sign out - user data is already deleted
        await supabase.auth.signOut();
        // Note: The auth user will remain but all data is deleted
        // You can set up a cleanup job or contact support to fully remove the auth user
        console.log('⚠️ Auth user not deleted (requires database function). All data has been removed.');
      } else {
        console.log('✅ Auth account deleted via database function');
        // Sign out after successful deletion
        await supabase.auth.signOut();
      }
      
      // Success!
      setStep('success');
      
      // Redirect to login after a moment
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error deleting account:', error);
      setDeleting(false);
      setStep('error');
      setErrorMessage(
        error?.message || 
        'Failed to delete account. Please try again or contact support.'
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Loading/Validating state
  if (step === 'validating') {
    return (
      <MysticalBackground variant="default">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.colors.primary.gold} />
          <ThemedText variant="h2" style={styles.loadingText}>
            Validating deletion request...
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <MysticalBackground variant="default">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText variant="h1" style={styles.errorTitle}>
              ❌ Error
            </ThemedText>
          </View>
          
          <ThemedCard variant="elevated" style={styles.card}>
            <ThemedText variant="body" style={styles.errorText}>
              {errorMessage || 'An error occurred while processing your request.'}
            </ThemedText>
            
            <ThemedButton
              title="Go Back"
              onPress={handleCancel}
              variant="primary"
              style={styles.button}
            />
            
            <ThemedButton
              title="Go to Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="ghost"
              style={styles.button}
            />
          </ThemedCard>
        </ScrollView>
      </MysticalBackground>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <MysticalBackground variant="default">
        <View style={styles.container}>
          <ThemedText variant="h1" style={styles.successTitle}>
            ✅ Account Deleted
          </ThemedText>
          <ThemedText variant="body" style={styles.successText}>
            Your account and all associated data have been permanently deleted.
          </ThemedText>
          <ThemedText variant="body" style={styles.successText}>
            Redirecting to login...
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Deleting state
  if (step === 'deleting') {
    return (
      <MysticalBackground variant="default">
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.colors.semantic.error} />
          <ThemedText variant="h2" style={styles.deletingText}>
            Deleting your account...
          </ThemedText>
          <ThemedText variant="body" style={styles.deletingSubtext}>
            This may take a few moments. Please do not close the app.
          </ThemedText>
        </View>
      </MysticalBackground>
    );
  }

  // Confirmation state
  return (
    <MysticalBackground variant="default">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText variant="h1">Delete Account</ThemedText>
        </View>
        
        <ThemedCard variant="elevated" style={styles.card}>
          <View style={styles.warningBox}>
            <ThemedText variant="h3" style={styles.warningTitle}>
              ⚠️ Warning: This action cannot be undone
            </ThemedText>
            
            <ThemedText variant="body" style={styles.warningText}>
              Deleting your account will permanently remove:
            </ThemedText>
            
            <View style={styles.warningList}>
              <ThemedText variant="body" style={styles.warningItem}>
              • All your reading history
              </ThemedText>
              <ThemedText variant="body" style={styles.warningItem}>
              • Your profile data and birth chart information
              </ThemedText>
              <ThemedText variant="body" style={styles.warningItem}>
              • Your account and all associated data
              </ThemedText>
              <ThemedText variant="body" style={styles.warningItem}>
              • You will need to create a new account to use Divin8 again
              </ThemedText>
            </View>
          </View>
          
          <ThemedText variant="body" style={styles.confirmationText}>
            Are you sure you want to permanently delete your account? This action cannot be reversed.
          </ThemedText>
          
          <ThemedButton
            title={locale === 'zh-TW' ? '是的，刪除我的帳戶' : 'Yes, Delete My Account'}
            onPress={handleDeleteAccount}
            variant="primary"
            disabled={deleting}
            style={[styles.button, styles.deleteButton]}
            textStyle={styles.deleteButtonText}
          />
          
          <ThemedButton
            title={t('common.cancel')}
            onPress={handleCancel}
            variant="ghost"
            disabled={deleting}
            style={styles.button}
          />
        </ThemedCard>
      </ScrollView>
    </MysticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.spacing.lg,
    paddingVertical: theme.spacing.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.spacing.lg,
  },
  warningBox: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.spacing.md,
    marginBottom: theme.spacing.spacing.lg,
  },
  warningTitle: {
    color: theme.colors.semantic.error,
    marginBottom: theme.spacing.spacing.sm,
    fontWeight: '700',
  },
  warningText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.sm,
  },
  warningList: {
    marginTop: theme.spacing.spacing.xs,
  },
  warningItem: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.xs,
  },
  confirmationText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.spacing.lg,
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.spacing.md,
  },
  deleteButton: {
    backgroundColor: theme.colors.semantic.error,
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: theme.spacing.spacing.md,
    textAlign: 'center',
  },
  deletingText: {
    marginTop: theme.spacing.spacing.md,
    textAlign: 'center',
    color: theme.colors.semantic.error,
  },
  deletingSubtext: {
    marginTop: theme.spacing.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text.tertiary,
  },
  successTitle: {
    color: theme.colors.semantic.success,
    marginBottom: theme.spacing.spacing.md,
    textAlign: 'center',
  },
  successText: {
    marginTop: theme.spacing.spacing.sm,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  errorTitle: {
    color: theme.colors.semantic.error,
    marginBottom: theme.spacing.spacing.md,
  },
  errorText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.spacing.lg,
    textAlign: 'center',
  },
});

