// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../core/api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = '@divin8_user_profile';

interface UserProfile {
  subscription_tier: 'free' | 'adept' | 'apex';
  is_beta_tester: boolean;
  sun_sign?: string;
  moon_sign?: string;
  rising_sign?: string;
  user_id?: string;
  [key: string]: any;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from cache or database
  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Try to load from cache first
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Check if cache is for current user
          if (parsed.user_id === userId) {
            setProfile(parsed);
            setIsLoading(false);
            console.log('✅ Loaded profile from cache');
          }
        } catch (e) {
          console.warn('Failed to parse cached profile:', e);
        }
      }

      // Always fetch fresh data from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        // Cache the profile
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        console.log('✅ Loaded and cached profile');
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh profile from database
  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
      return;
    }
    await loadProfile(user.id);
  }, [loadProfile]);

  // Clear profile (on sign out)
  const clearProfile = useCallback(async () => {
    setProfile(null);
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('✅ Cleared profile cache');
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 User signed in, loading profile...');
        await loadProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out, clearing profile...');
        await clearProfile();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally refresh profile on token refresh
        console.log('🔄 Token refreshed, checking profile...');
        await refreshProfile();
      }
    });

    // Load profile on mount if user is already signed in
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        await loadProfile(user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, clearProfile, refreshProfile]);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refreshProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

