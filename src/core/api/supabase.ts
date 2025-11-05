// src/core/api/supabase.ts
import 'react-native-url-polyfill/auto'; // CRITICAL: Required for Supabase in RN
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // CRITICAL: Required for session persistence

// Environment variables - set these in your .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

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
  },
});

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
};

export default supabase;