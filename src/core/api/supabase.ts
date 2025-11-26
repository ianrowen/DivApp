// src/core/api/supabase.ts
import 'react-native-url-polyfill/auto'; // CRITICAL: Required for Supabase in RN
import { createClient, type Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // CRITICAL: Required for session persistence
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import sessionUrlProvider from 'expo-auth-session/build/SessionUrlProvider';

// Environment variables - set these in your .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const expoConfig = Constants.expoConfig ?? null;
const expoGoConfig = Constants.expoGoConfig ?? null;
const manifest2 = Constants.manifest2 as
  | (typeof Constants.manifest2 & {
      extra?: {
        expoClient?: {
          owner?: string;
          slug?: string;
        };
      };
    })
  | null;

const deriveFullNameFromConfig = (): string | undefined => {
  if (expoConfig?.owner && expoConfig?.slug) {
    return `@${expoConfig.owner}/${expoConfig.slug}`;
  }

  const manifestOwner = manifest2?.extra?.expoClient?.owner ?? expoGoConfig?.owner;
  const manifestSlug = manifest2?.extra?.expoClient?.slug ?? expoGoConfig?.slug;
  if (manifestOwner && manifestSlug) {
    return `@${manifestOwner}/${manifestSlug}`;
  }

  if (typeof expoConfig?.originalFullName === 'string') {
    return expoConfig.originalFullName;
  }

  return undefined;
};

const EXPO_PROJECT_FULL_NAME =
  process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME ||
  (expoConfig?.extra as Record<string, unknown> | undefined)?.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME ||
  deriveFullNameFromConfig();

console.log('[Supabase] Expo ownership:', Constants.appOwnership);
console.log('[Supabase] Expo project full name resolved to:', EXPO_PROJECT_FULL_NAME);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // CRITICAL FIX: Use AsyncStorage for session persistence in React Native
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

const isExpoGo = Constants.appOwnership === 'expo';

const getRedirectUri = () => {
  if (isExpoGo) {
    if (!EXPO_PROJECT_FULL_NAME) {
      throw new Error(
        'Unable to resolve Expo project full name. Sign in with `npx expo login`, add `"owner": "<username>"` to app.json, or set EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME=@owner/slug.'
      );
    }

    return sessionUrlProvider.getRedirectUrl({
      urlPath: 'supabase-auth',
      projectNameForProxy: EXPO_PROJECT_FULL_NAME,
    });
  }

  return makeRedirectUri({
    scheme: 'com.divin8.app',
    path: 'supabase-auth',
  });
};

const parseOAuthCallback = (callbackUrl: string): Record<string, string> => {
  const url = new URL(callbackUrl);
  const searchParams = new URLSearchParams(url.search);
  const hashParams = url.hash ? new URLSearchParams(url.hash.replace(/^#/, '')) : null;

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  hashParams?.forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Sign in with email
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign up with email
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Check user tier (for subscription features)
  async getUserTier(userId: string): Promise<'free' | 'premium' | 'pro' | 'expert'> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('❌ Could not fetch user tier:', error.message);
        console.warn('   Error details:', JSON.stringify(error, null, 2));
        console.warn('   User ID:', userId);
        // For development: return expert instead of free
        console.warn('⚠️ Defaulting to expert tier for development');
        return 'expert';
      }
      
      const tier = (data?.subscription_tier as 'free' | 'premium' | 'pro' | 'expert') || 'free';
      console.log('✅ Fetched user tier:', tier, 'for user:', userId);
      return tier;
    } catch (err) {
      console.error('❌ Exception fetching user tier:', err);
      // For development: return expert instead of free
      console.warn('⚠️ Defaulting to expert tier for development');
      return 'expert';
    }
  },

  // Check if user can access a feature based on tier
  async canAccessFeature(userId: string, featureName: string, requiredTier: 'free' | 'premium' | 'pro' | 'expert' = 'premium'): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_tier_access', {
        user_uuid: userId,
        required_tier: requiredTier, 
        feature_name: featureName,
      });
    
    if (error) {
        console.error('RPC call to check_tier_access failed:', error.message);
        throw error;
    }
    return data || false;
  },

  async signInWithGoogle(): Promise<Session | null> {
    // Use custom deep link scheme instead of Expo auth proxy
    const redirectTo = 'com.divin8.app://supabase-auth';
    console.log('[Supabase] Using redirect URI:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error('Unable to start Google OAuth flow.');
    }

    // Log the OAuth URL to see what redirect_uri Supabase is sending to Google
    console.log('[Supabase] OAuth URL:', data.url);
    try {
      const urlObj = new URL(data.url);
      const redirectUri = urlObj.searchParams.get('redirect_uri');
      console.log('[Supabase] Redirect URI sent to Google:', redirectUri);
      console.log('[Supabase] Decoded redirect URI:', redirectUri ? decodeURIComponent(redirectUri) : 'null');
      
      // Also check all query params
      console.log('[Supabase] All OAuth URL params:');
      urlObj.searchParams.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
    } catch (e) {
      console.warn('[Supabase] Could not parse OAuth URL:', e);
    }

    let authUrlParams: Record<string, string> | null = null;
    let callbackUrl: string | null = null;

    const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    const resultType = authResult.type;

    if (authResult.type === 'success' && authResult.url) {
      callbackUrl = authResult.url;
      authUrlParams = parseOAuthCallback(authResult.url);
    }

    if (resultType === 'cancel' || resultType === 'dismiss') {
      return null;
    }

    if (resultType !== 'success') {
      throw new Error('Google sign in was interrupted.');
    }

    if (!authUrlParams && callbackUrl) {
      authUrlParams = parseOAuthCallback(callbackUrl);
    }

    if (!authUrlParams) {
      throw new Error('No OAuth response received from Google.');
    }

    if (authUrlParams.error) {
      if (authUrlParams.error === 'access_denied') {
        return null;
      }
      throw new Error(authUrlParams.error_description || authUrlParams.error || 'Google sign in failed.');
    }

    if (authUrlParams.code) {
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authUrlParams.code);

      if (exchangeError) {
        throw exchangeError;
      }

      return sessionData.session ?? null;
    }

    if (authUrlParams.access_token && authUrlParams.refresh_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: authUrlParams.access_token,
        refresh_token: authUrlParams.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }

      return sessionData.session ?? null;
    }

    throw new Error('No session returned from Google OAuth flow.');
  },
};

export default supabase;