// src/core/api/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Environment variables - set these in your .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
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
    
    if (error) throw error;
    return data?.subscription_tier || 'free';
  },

  // Check if user can access a feature based on tier
  async canAccessFeature(userId: string, featureName: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_tier_access', {
        user_uuid: userId,
        required_tier: 'premium', // This should be dynamic based on feature
        feature_name: featureName,
      });
    
    if (error) throw error;
    return data || false;
  },
};

export default supabase;
