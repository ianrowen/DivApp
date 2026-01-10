// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  
  // Set loading to false immediately on mount - don't block app on profile load
  // Profile will load in background and update when ready
  useEffect(() => {
    // Very short delay to allow cache check, then set loading false
    const quickTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 100); // 100ms max - just enough for cache check
    
    return () => clearTimeout(quickTimeout);
  }, []); // Run once on mount
  
  // Global failsafe: Force loading to false after 2 seconds to prevent app-wide blocking
  useEffect(() => {
    const globalFailsafe = setTimeout(() => {
      if (isLoading) {
        console.warn('ProfileContext: Global failsafe triggered - forcing isLoading to false after 2s');
        setIsLoading(false);
      }
    }, 2000); // Reduced to 2s since we set it false early
    
    return () => clearTimeout(globalFailsafe);
  }, [isLoading]);

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
      let queryAttempted = false;
      try {
        queryAttempted = true;
        const queryPromise = supabase
          .from('profiles')
          .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
          .eq('user_id', userId)
          .single();
        
        // Increased timeout to 15s for slow networks (existing users may have complex profiles)
        // Index exists on user_id, so query should be fast, but network can be slow
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 15000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        data = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        // Timeout occurred - retry once (network might be slow, or database busy)
        console.warn('Profile query timed out, retrying once:', timeoutError?.message);
        try {
          const retryPromise = supabase
            .from('profiles')
            .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
            .eq('user_id', userId)
            .single();
          
          // Longer timeout for retry (10s) - give it more time
          const retryTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Retry timeout')), 10000)
          );
          
          const retryResult = await Promise.race([retryPromise, retryTimeoutPromise]) as any;
          if (retryResult?.data) {
            // Profile found on retry - use it
            data = retryResult.data;
            error = null;
          } else if (retryResult?.error) {
            // Got an error response (not timeout) - use it
            error = retryResult.error;
          } else {
            // Retry also timed out - treat as timeout
            error = { code: 'TIMEOUT', message: 'Profile query timeout (retry also failed)' };
          }
        } catch (retryError: any) {
          // Retry also timed out - treat as timeout
          error = { code: 'TIMEOUT', message: 'Profile query timeout (retry also failed)' };
        }
      }

      // #region agent log
      debugLog('ProfileContext.tsx:queryResult', 'Profile query result', {hasData:!!data,hasError:!!error,errorCode:error?.code,error:error?.message}, 'I');
      // #endregion

      if (error) {
        // PGRST116 = no rows returned - user doesn't have a profile yet, create one
        if (error.code === 'PGRST116') {
          console.log('📝 Creating new profile with beta tester status for user:', userId);
          try {
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
              .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
              .single();
            
            if (createError) {
              // Profile may have been created by trigger - try to fetch it
              const { data: fetchedProfile } = await supabase
                .from('profiles')
                .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
                .eq('user_id', userId)
                .single();
              if (fetchedProfile) {
                console.log('✅ Profile found after create attempt, using it');
                setProfile(fetchedProfile);
                await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fetchedProfile));
              } else {
                console.warn('⚠️ Could not create or fetch profile, user will continue without profile');
              }
            } else if (newProfile) {
              setProfile(newProfile);
              await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(newProfile));
              console.log('✅ Created and cached new profile with beta tester status');
            }
          } catch (createErr) {
            console.error('❌ Exception creating profile:', createErr);
          }
        } else if (error.code === 'TIMEOUT') {
          // Query timed out - for existing users, profile exists but query is slow
          // Don't try to create (would fail with conflict), just log and continue
          // Schedule a background retry after a delay (non-blocking)
          console.warn('⚠️ Profile query timed out for existing user, continuing without profile. Will retry in background.');
          
          // Schedule background retry after 5 seconds (non-blocking)
          setTimeout(async () => {
            try {
              const { data: backgroundProfile } = await supabase
                .from('profiles')
                .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
                .eq('user_id', userId)
                .single();
              
              if (backgroundProfile) {
                console.log('✅ Profile loaded successfully in background retry');
                setProfile(backgroundProfile);
                await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(backgroundProfile));
              }
            } catch (bgError) {
              // Silently fail - will retry on next app load
            }
          }, 5000);
        } else {
          console.error('Error loading profile:', error);
        }
        return;
      }

      if (data) {
        // PRODUCTION DEBUG: Log what we actually received from database
        if (__DEV__) {
          console.log('🔍 PROFILE LOADED:', {
            userId,
            subscription_tier: data.subscription_tier,
            is_beta_tester: data.is_beta_tester,
            beta_tester_type: typeof data.is_beta_tester,
            beta_tester_value: JSON.stringify(data.is_beta_tester),
            beta_access_expires_at: data.beta_access_expires_at,
            rawData: JSON.stringify(data)
          });
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:profileLoaded',message:'Profile loaded from DB',data:{userId,subscriptionTier:data.subscription_tier,isBetaTester:data.is_beta_tester,betaTesterType:typeof data.is_beta_tester,betaTesterValue:JSON.stringify(data.is_beta_tester),betaExpiresAt:data.beta_access_expires_at,rawData:JSON.stringify(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Ensure beta tester status is set (migration might not have caught all users)
        // Also handle case where is_beta_tester is null (should be treated as false)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:checkBetaTester',message:'Checking beta tester status',data:{userId,isBetaTester:data.is_beta_tester,isBetaTesterType:typeof data.is_beta_tester,isBetaTesterValue:JSON.stringify(data.is_beta_tester),needsUpdate:!data.is_beta_tester || data.is_beta_tester === null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (!data.is_beta_tester || data.is_beta_tester === null) {
          console.log('📝 Updating profile to set beta tester status for user:', userId, 'current value:', data.is_beta_tester);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:updatingBetaTester',message:'Updating profile to beta tester',data:{userId,currentValue:data.is_beta_tester},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          try {
            // Use upsert to ensure the update happens even if there's a race condition
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .upsert({
                user_id: userId,
                is_beta_tester: true,
                beta_access_expires_at: null, // Explicitly set to null for indefinite access
                subscription_tier: data.subscription_tier || 'free', // Preserve existing tier
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select('subscription_tier, is_beta_tester, beta_access_expires_at, sun_sign, moon_sign, rising_sign, user_id, use_birth_data_for_readings')
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
              console.log('✅ Updated profile to beta tester status:', {
                is_beta_tester: updatedProfile.is_beta_tester,
                beta_access_expires_at: updatedProfile.beta_access_expires_at
              });
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:profileUpdated',message:'Profile updated to beta tester',data:{userId,isBetaTester:updatedProfile.is_beta_tester,betaExpiresAt:updatedProfile.beta_access_expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
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
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:profileSet',message:'Profile set in state and cached',data:{userId,isBetaTester:data.is_beta_tester,subscriptionTier:data.subscription_tier,betaExpiresAt:data.beta_access_expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
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
    console.log('🔄 Force refreshing profile from database...');
    // Clear cache first to force fresh load
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    
    // Try calling database function to force refresh (if it exists)
    try {
      const { data: refreshedData, error: rpcError } = await supabase.rpc('refresh_user_profile');
      if (!rpcError && refreshedData) {
        console.log('✅ Profile refreshed via database function');
        setProfile(refreshedData as any);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(refreshedData));
        return;
      }
    } catch (e) {
      // Function might not exist, fall back to normal refresh
      console.log('Database function not available, using normal refresh');
    }
    
    await loadProfile(user.id);
  }, [loadProfile]);

  // Clear profile (on sign out)
  const clearProfile = useCallback(async () => {
    setProfile(null);
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('✅ Cleared profile cache');
  }, []);

  // Refresh profile when app comes to foreground (after long background periods)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - refresh profile if we have a user
        // Use timeout to prevent hanging if session refresh fails
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        Promise.race([sessionPromise, timeoutPromise])
          .then((result: any) => {
            const { data: { session } } = result;
            if (session?.user) {
              // Refresh profile in background (non-blocking)
              refreshProfile().catch((err) => {
                // Silently handle background refresh failures
              });
            }
          })
          .catch((error) => {
            // Suppress timeout and "Invalid Refresh Token" errors - expected after long background
          });
      }
    });
    
    return () => subscription.remove();
  }, [refreshProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
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
      } catch (error: any) {
        // Suppress "Invalid Refresh Token" errors - these are expected when session expires
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Refresh Token Not Found')) {
          // Expected behavior - session expired, user needs to sign in again
          // Silently handle it
          return;
        }
        // Log other errors
        console.warn('Error in auth state change handler:', error?.message || error);
      }
    });

    // Load profile on mount if user is already signed in (non-blocking)
    // Add timeout to prevent hanging if getSession() hangs (common on reload)
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    );
    
    Promise.race([sessionPromise, timeoutPromise])
      .then(async (result: any) => {
        const { data: { session }, error } = result;
        // Suppress "Invalid Refresh Token" errors - these are expected when session expires
        if (error && error.message?.includes('Invalid Refresh Token')) {
          // This is expected - session expired, user needs to sign in again
          // Silently handle it - don't log as error
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          // Load profile in background - don't await, let it run async
          loadProfile(session.user.id).catch((err) => {
            console.warn('Background profile load failed:', err);
          });
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // Timeout or other error
        if (error?.message?.includes('timeout')) {
          // Timeout expected - continue without blocking
        } else if (error?.message?.includes('Invalid Refresh Token') || 
                   error?.message?.includes('Refresh Token Not Found')) {
          // Expected behavior - session expired, user needs to sign in again
          // Silently handle it
        } else {
          // Log other errors
          console.warn('Error getting session:', error?.message || error);
        }
        // CRITICAL: Always set loading to false to prevent blocking UI/navigation
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

