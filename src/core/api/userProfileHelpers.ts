// src/core/api/userProfileHelpers.ts
import { supabase } from './supabase';
import type { UserProfile } from '../ai/prompts/types';

/**
 * Load user profile with birth data and preferences
 * Returns null if no profile exists
 */
export async function loadUserProfile(
  userId: string | undefined
): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('sun_sign, moon_sign, rising_sign, use_birth_data_for_readings')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.warn('Error loading user profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      birth_date: null,
      birth_time: null,
      birth_location: null,
      sun_sign: data.sun_sign,
      moon_sign: data.moon_sign,
      rising_sign: data.rising_sign,
      use_birth_data_for_readings: data.use_birth_data_for_readings ?? false,
    };
  } catch (error) {
    console.error('Error in loadUserProfile:', error);
    return null;
  }
}







