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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:loadProfile',message:'loadProfile entry',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
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
            fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:cacheLoaded',message:'Loaded profile from cache',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
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
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:queryProfile',message:'Querying profile from DB (background)',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      // Query profile with timeout - if timeout, just continue without profile (user can still use app)
      let data, error;
      try {
        const queryPromise = supabase
          .from('user_profiles')
          .select('subscription_tier, is_beta_tester, sun_sign, moon_sign, rising_sign, user_id')
          .eq('user_id', userId)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 15000) // Increased to 15s
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
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:queryResult',message:'Profile query result',data:{hasData:!!data,hasError:!!error,errorCode:error?.code,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (error) {
        // PGRST116 = no rows returned - this is OK, user just doesn't have a profile yet
        if (error.code !== 'PGRST116' && error.code !== 'TIMEOUT') {
          console.error('Error loading profile:', error);
        }
        return;
      }

      if (data) {
        setProfile(data);
        // Cache the profile
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:profileLoaded',message:'Profile loaded and cached',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        console.log('✅ Loaded and cached profile');
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProfileContext.tsx:error',message:'Error in loadProfile',data:{error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
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

