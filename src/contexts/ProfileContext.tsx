// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../core/api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugLog } from '../utils/debugLog';

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
    // #region agent log
    debugLog('ProfileContext.tsx:loadProfile', 'loadProfile entry', {userId}, 'I');
    // #endregion
    try {
      // Try to load from cache first
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      let hasCachedProfile = false;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Check if cache is for current user
          if (parsed.user_id === userId) {
            setProfile(parsed);
            hasCachedProfile = true;
            // #region agent log
            debugLog('ProfileContext.tsx:cacheLoaded', 'Loaded profile from cache', {userId}, 'I');
            // #endregion
            console.log('✅ Loaded profile from cache');
          }
        } catch (e) {
          console.warn('Failed to parse cached profile:', e);
        }
      }

      // Set loading to false immediately - don't block app on profile load
      setIsLoading(false);

      // Fetch fresh data from database in background (non-blocking)
      // #region agent log
      debugLog('ProfileContext.tsx:queryProfile', 'Querying profile from DB (background)', {userId}, 'I');
      // #endregion
      // Query profile with timeout - if timeout, just continue without profile (user can still use app)
      let data, error;
      try {
        const queryPromise = supabase
          .from('profiles')
          .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
          .eq('user_id', userId)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 5000) // Reduced to 5s - faster timeout
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        data = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        // Timeout occurred - log but don't fail, user can still use the app
        console.warn('Profile query timed out, continuing without profile:', timeoutError?.message);
        error = { code: 'TIMEOUT', message: 'Profile query timeout' };
      }

      // #region agent log
      debugLog('ProfileContext.tsx:queryResult', 'Profile query result', {hasData:!!data,hasError:!!error,errorCode:error?.code,error:error?.message}, 'I');
      // #endregion

      if (error) {
        // PGRST116 = no rows returned - this is OK, user just doesn't have a profile yet
        if (error.code === 'PGRST116') {
          // User doesn't have a profile - use upsert to create one with beta tester status
          console.log('📝 Creating new profile with beta tester status for user:', userId);
          try {
            // Use upsert to handle race conditions (if profile gets created between check and insert)
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .upsert({
                user_id: userId,
                subscription_tier: 'free',
                is_beta_tester: true, // All users get beta tester status
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
              .single();
            
            if (createError) {
              console.error('❌ Error creating profile:', createError);
              console.error('❌ Create error code:', createError.code);
              console.error('❌ Create error message:', createError.message);
              console.error('❌ Create error details:', createError.details);
              console.error('❌ Create error hint:', createError.hint);
              // Try to fetch the profile again in case it was created by another process
              const { data: fetchedProfile } = await supabase
                .from('profiles')
                .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
                .eq('user_id', userId)
                .single();
              if (fetchedProfile) {
                console.log('✅ Profile found after failed create, using it');
                setProfile(fetchedProfile);
                await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fetchedProfile));
              }
            } else if (newProfile) {
              setProfile(newProfile);
              await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile));
              console.log('✅ Created and cached new profile with beta tester status');
            }
          } catch (createErr) {
            console.error('❌ Exception creating profile:', createErr);
          }
        } else if (error.code !== 'TIMEOUT') {
          console.error('Error loading profile:', error);
        }
        return;
      }

      if (data) {
        // Ensure beta tester status is set (migration might not have caught all users)
        // Also handle case where is_beta_tester is null (should be treated as false)
        if (!data.is_beta_tester || data.is_beta_tester === null) {
          console.log('📝 Updating profile to set beta tester status for user:', userId, 'current value:', data.is_beta_tester);
          try {
            // Use upsert to ensure the update happens even if there's a race condition
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .upsert({
                user_id: userId,
                is_beta_tester: true,
                subscription_tier: data.subscription_tier || 'free', // Preserve existing tier
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
              .single();
            
            if (updateError) {
              console.error('❌ Error updating beta tester status:', updateError);
              console.error('❌ Update error code:', updateError.code);
              console.error('❌ Update error message:', updateError.message);
              console.error('❌ Update error details:', updateError.details);
              console.error('❌ Update error hint:', updateError.hint);
              // Continue with existing data even if update fails
            } else if (updatedProfile) {
              data = updatedProfile;
              console.log('✅ Updated profile to beta tester status');
            }
          } catch (updateErr) {
            console.error('❌ Exception updating beta tester status:', updateErr);
            // Continue with existing data even if update fails
          }
        }
        
        setProfile(data);
        // Cache the profile
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        // #region agent log
        debugLog('ProfileContext.tsx:profileLoaded', 'Profile loaded and cached', {userId}, 'I');
        // #endregion
        console.log('✅ Loaded and cached profile');
      }
    } catch (error) {
      // #region agent log
      debugLog('ProfileContext.tsx:error', 'Error in loadProfile', {error:error?.message}, 'I');
      // #endregion
      console.error('Error in loadProfile:', error);
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

    // Load profile on mount if user is already signed in (non-blocking)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Load profile in background - don't await, let it run async
        loadProfile(session.user.id).catch((err) => {
          console.warn('Background profile load failed:', err);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
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

