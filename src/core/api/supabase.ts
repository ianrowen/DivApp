// src/core/api/supabase.ts
import 'react-native-url-polyfill/auto'; // CRITICAL: Required for Supabase in RN
import { createClient, type Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // CRITICAL: Required for session persistence
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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

    // For Expo Go, use the sessionUrlProvider without a path to match Supabase config
    // The redirect URI in Supabase should be: https://auth.expo.io/@irowen/divin8-app
    const redirectUri = sessionUrlProvider.getRedirectUrl({
      projectNameForProxy: EXPO_PROJECT_FULL_NAME,
    });
    console.log('[Supabase] Generated Expo Go redirect URI:', redirectUri);
    return redirectUri;
  }

  // For development builds, use custom scheme
  const redirectUri = makeRedirectUri({
    scheme: 'com.divin8.app',
    path: 'supabase-auth',
  });
  console.log('[Supabase] Generated dev build redirect URI:', redirectUri);
  return redirectUri;
};

const parseOAuthCallback = (callbackUrl: string): Record<string, string> => {
  try {
    // Handle both http/https URLs and custom scheme URLs
    let url: URL;
    try {
      url = new URL(callbackUrl);
    } catch {
      // If URL parsing fails, try to extract params manually
      const params: Record<string, string> = {};
      const urlParts = callbackUrl.split(/[?#]/);
      if (urlParts.length > 1) {
        const queryString = urlParts[1];
        const pairs = queryString.split('&');
        pairs.forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }
      return params;
    }

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
  } catch (error) {
    console.error('[Supabase] Error parsing OAuth callback URL:', error, 'URL:', callbackUrl);
    throw error;
  }
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
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (error) {
        console.warn('Could not fetch user tier, defaulting to free:', error.message);
        return 'free'; 
    }
    return (data?.subscription_tier as 'free' | 'premium' | 'pro' | 'expert') || 'free';
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
    try {
      const redirectTo = getRedirectUri();
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
        console.error('[Supabase] OAuth initialization error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('Unable to start Google OAuth flow.');
      }

    // Log the OAuth URL for debugging
    console.log('[Supabase] OAuth URL:', data.url);
    try {
      const urlObj = new URL(data.url);
      // Note: Supabase uses 'redirect_to', not 'redirect_uri'
      const redirectTo = urlObj.searchParams.get('redirect_to');
      console.log('[Supabase] Redirect to (Supabase param):', redirectTo ? decodeURIComponent(redirectTo) : 'null');
      
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

    console.log('[Supabase] Opening auth session with URL:', data.url);
    console.log('[Supabase] Expected redirect URI:', redirectTo);
    
    // Add a timeout promise to detect if the auth session hangs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('OAuth flow timed out after 5 minutes. Please try again.'));
      }, 5 * 60 * 1000); // 5 minute timeout
    });

    let authResult;
    try {
      // Race between the auth session and timeout
      authResult = await Promise.race([
        WebBrowser.openAuthSessionAsync(data.url, redirectTo),
        timeoutPromise,
      ]);
      console.log('[Supabase] Auth session completed. Result:', JSON.stringify(authResult, null, 2));
    } catch (error: any) {
      console.error('[Supabase] Error opening auth session:', error);
      if (error.message?.includes('timed out')) {
        throw error;
      }
      throw new Error(`Failed to open OAuth browser: ${error?.message || error}`);
    }

    const resultType = authResult.type;

    console.log('[Supabase] Auth result type:', resultType);
    console.log('[Supabase] Auth result URL:', authResult.url);
    console.log('[Supabase] Expected redirect URI:', redirectTo);

    if (resultType === 'cancel' || resultType === 'dismiss') {
      console.log('[Supabase] User cancelled or dismissed OAuth');
      return null;
    }

    if (resultType !== 'success') {
      console.error('[Supabase] OAuth failed with type:', resultType);
      throw new Error(`Google sign in was interrupted. Result type: ${resultType}`);
    }

    if (authResult.type === 'success' && authResult.url) {
      callbackUrl = authResult.url;
      console.log('[Supabase] Callback URL received:', callbackUrl);
      
      // Check if callback URL matches expected redirect
      if (!callbackUrl.includes(redirectTo.replace('https://', '').replace('http://', ''))) {
        console.warn('[Supabase] Callback URL does not match expected redirect URI');
        console.warn('[Supabase] Expected contains:', redirectTo);
        console.warn('[Supabase] Callback URL:', callbackUrl);
      }
      
      try {
        authUrlParams = parseOAuthCallback(authResult.url);
        console.log('[Supabase] Parsed OAuth params:', JSON.stringify(authUrlParams, null, 2));
      } catch (parseError: any) {
        console.error('[Supabase] Error parsing OAuth callback:', parseError);
        // Try to extract code from URL manually using multiple patterns
        const patterns = [
          /[?&#]code=([^&?#]+)/,
          /[?&#]access_token=([^&?#]+)/,
          /[?&#]error=([^&?#]+)/,
        ];
        
        authUrlParams = {};
        patterns.forEach((pattern) => {
          const match = authResult.url.match(pattern);
          if (match) {
            authUrlParams![match[0].split('=')[0].replace(/[?&#]/, '')] = decodeURIComponent(match[1]);
          }
        });
        
        if (Object.keys(authUrlParams).length > 0) {
          console.log('[Supabase] Manually extracted params:', authUrlParams);
        } else {
          throw new Error(`Failed to parse OAuth callback: ${parseError?.message || parseError}. Callback URL: ${callbackUrl}`);
        }
      }
    }

    if (!authUrlParams && callbackUrl) {
      try {
        authUrlParams = parseOAuthCallback(callbackUrl);
      } catch (parseError) {
        console.error('[Supabase] Error parsing callback URL on retry:', parseError);
      }
    }

    if (!authUrlParams) {
      console.error('[Supabase] No OAuth params extracted from callback URL:', callbackUrl);
      throw new Error('No OAuth response received from Google. The callback URL may be malformed or missing required parameters.');
    }

    if (authUrlParams.error) {
      if (authUrlParams.error === 'access_denied') {
        console.log('[Supabase] OAuth access denied by user.');
        return null;
      }
      console.error('[Supabase] OAuth error in params:', authUrlParams.error_description || authUrlParams.error);
      throw new Error(authUrlParams.error_description || authUrlParams.error || 'Google sign in failed.');
    }

    // Log what we received for debugging
    console.log('[Supabase] Received OAuth params:', {
      hasCode: !!authUrlParams.code,
      hasAccessToken: !!authUrlParams.access_token,
      hasRefreshToken: !!authUrlParams.refresh_token,
      type: authUrlParams.type,
      keys: Object.keys(authUrlParams),
    });

    if (authUrlParams.code) {
      console.log('[Supabase] Exchanging code for session...');
      console.log('[Supabase] Code length:', authUrlParams.code.length);
      
      try {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authUrlParams.code);

        if (exchangeError) {
          console.error('[Supabase] Error exchanging code for session:', exchangeError);
          console.error('[Supabase] Error details:', JSON.stringify(exchangeError, null, 2));
          throw exchangeError;
        }

        if (!sessionData?.session) {
          console.error('[Supabase] No session returned from code exchange');
          throw new Error('No session returned from code exchange');
        }

        console.log('[Supabase] Session exchange successful');
        console.log('[Supabase] User ID:', sessionData.session.user?.id);
        return sessionData.session;
      } catch (error: any) {
        console.error('[Supabase] Exception during code exchange:', error);
        throw error;
      }
    }

    // If we have tokens but they're recovery tokens (from Expo's auth proxy), ignore them
    // Recovery tokens are not valid for Supabase OAuth
    if (authUrlParams.type === 'recovery') {
      console.warn('[Supabase] Received recovery tokens from Expo auth proxy. These are not valid for Supabase OAuth.');
      console.warn('[Supabase] Callback URL:', callbackUrl);
      throw new Error('OAuth flow returned recovery tokens instead of an authorization code. This usually means the redirect URI configuration is incorrect.');
    }

    if (authUrlParams.access_token && authUrlParams.refresh_token && !authUrlParams.type) {
      console.log('[Supabase] Setting session with access and refresh tokens...');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: authUrlParams.access_token,
          refresh_token: authUrlParams.refresh_token,
        });

        if (sessionError) {
          console.error('[Supabase] Error setting session with tokens:', sessionError);
          console.error('[Supabase] Error message:', sessionError.message);
          throw sessionError;
        }

        if (!sessionData?.session) {
          console.error('[Supabase] No session returned after setting tokens');
          throw new Error('No session returned after setting tokens');
        }

        console.log('[Supabase] Session set successfully with tokens');
        console.log('[Supabase] User ID:', sessionData.session.user?.id);
        return sessionData.session;
      } catch (error: any) {
        console.error('[Supabase] Exception during session setup:', error);
        throw error;
      }
    }

    throw new Error('No session returned from Google OAuth flow.');
    } catch (error: any) {
      console.error('[Supabase] signInWithGoogle error:', error);
      console.error('[Supabase] Error stack:', error?.stack);
      throw error;
    }
  },
};

export default supabase;