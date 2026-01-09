-- Migration: Add subscription and feature columns to profiles table
-- Date: 2026-01-05
-- Description: Adds comprehensive subscription, preference, and astrology columns
--              to the profiles table. This migration is idempotent and can be
--              run multiple times safely.
--
-- Prerequisites: This migration assumes the table has been renamed from
--                user_profiles to profiles (see migration 20260105115302).
--                If running manually, ensure the table is named 'profiles'.

BEGIN;

-- Step 1: Add subscription-related columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status varchar DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS language_preference varchar DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone varchar DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS allow_personalized_readings boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_complete_birth_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS birth_data_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS astrological_data_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Step 2: Add beta tester expiration column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_access_expires_at timestamptz;

-- Step 3: Add future astrology fields (for later use)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS western_sun_sign varchar,
  ADD COLUMN IF NOT EXISTS western_moon_sign varchar,
  ADD COLUMN IF NOT EXISTS western_rising_sign varchar,
  ADD COLUMN IF NOT EXISTS chinese_zodiac_sign varchar,
  ADD COLUMN IF NOT EXISTS chinese_element varchar,
  ADD COLUMN IF NOT EXISTS bazi_four_pillars jsonb,
  ADD COLUMN IF NOT EXISTS vedic_rashi varchar,
  ADD COLUMN IF NOT EXISTS life_path_number integer,
  ADD COLUMN IF NOT EXISTS expression_number integer;

-- Step 4: Add check constraints for subscription_status
DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_check 
      CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'suspended', 'trial'));
  END IF;
END $$;

-- Step 5: Add check constraint for language_preference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_language_preference_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_preference_check 
      CHECK (language_preference IN ('en', 'zh-TW', 'zh-CN', 'ja', 'ko', 'es', 'fr', 'de'));
  END IF;
END $$;

-- Step 6: Update existing records with defaults
-- Set ALL users as beta testers (full access during beta period)
-- This ensures everyone gets apex-level access during beta
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL -- NULL means indefinite during beta
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- Set subscription_status for existing records
UPDATE public.profiles
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

-- Set language_preference for existing records
UPDATE public.profiles
SET language_preference = 'en'
WHERE language_preference IS NULL;

-- Set timezone for existing records
UPDATE public.profiles
SET timezone = 'UTC'
WHERE timezone IS NULL;

-- Set allow_personalized_readings for existing records
UPDATE public.profiles
SET allow_personalized_readings = true
WHERE allow_personalized_readings IS NULL;

-- Set last_active_at for existing records
UPDATE public.profiles
SET last_active_at = COALESCE(last_active_at, created_at, now())
WHERE last_active_at IS NULL;

-- Step 7: Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON public.profiles(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_language_preference ON public.profiles(language_preference);
CREATE INDEX IF NOT EXISTS idx_profiles_is_beta_tester ON public.profiles(is_beta_tester) WHERE is_beta_tester = true;
CREATE INDEX IF NOT EXISTS idx_profiles_beta_access_expires_at ON public.profiles(beta_access_expires_at) WHERE beta_access_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at);

-- Step 8: Add column comments for documentation
COMMENT ON COLUMN public.profiles.subscription_status IS 'Subscription status: active, cancelled, expired, suspended, or trial';
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 'When the subscription expires. NULL means no expiration (lifetime/indefinite)';
COMMENT ON COLUMN public.profiles.language_preference IS 'User preferred language code (en, zh-TW, etc.)';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone (IANA timezone name, e.g., America/New_York)';
COMMENT ON COLUMN public.profiles.allow_personalized_readings IS 'Whether user allows birth data to be used for personalized readings';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN public.profiles.has_complete_birth_data IS 'Whether user has provided complete birth data (date, time, location)';
COMMENT ON COLUMN public.profiles.birth_data_verified IS 'Whether birth data has been verified (manual or automated)';
COMMENT ON COLUMN public.profiles.astrological_data_updated_at IS 'Last time astrological calculations were updated based on birth data';
COMMENT ON COLUMN public.profiles.last_active_at IS 'Last time user was active in the app';
COMMENT ON COLUMN public.profiles.beta_access_expires_at IS 'When beta access expires. NULL means indefinite beta access';
COMMENT ON COLUMN public.profiles.western_sun_sign IS 'Western astrology sun sign (Aries, Taurus, etc.)';
COMMENT ON COLUMN public.profiles.western_moon_sign IS 'Western astrology moon sign';
COMMENT ON COLUMN public.profiles.western_rising_sign IS 'Western astrology rising sign (ascendant)';
COMMENT ON COLUMN public.profiles.chinese_zodiac_sign IS 'Chinese zodiac sign (Rat, Ox, Tiger, etc.)';
COMMENT ON COLUMN public.profiles.chinese_element IS 'Chinese element (Wood, Fire, Earth, Metal, Water)';
COMMENT ON COLUMN public.profiles.bazi_four_pillars IS 'BaZi (Four Pillars) chart data as JSONB';
COMMENT ON COLUMN public.profiles.vedic_rashi IS 'Vedic astrology rashi (moon sign)';
COMMENT ON COLUMN public.profiles.life_path_number IS 'Numerology life path number (1-9, 11, 22, 33)';
COMMENT ON COLUMN public.profiles.expression_number IS 'Numerology expression number';

COMMIT;

-- Verification queries (run these after migration to verify success):
--
-- 1. Verify all columns exist:
--    SELECT column_name, data_type, column_default, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'profiles'
--    ORDER BY ordinal_position;
--
-- 2. Verify constraints:
--    SELECT constraint_name, constraint_type
--    FROM information_schema.table_constraints
--    WHERE table_schema = 'public' AND table_name = 'profiles';
--
-- 3. Verify indexes:
--    SELECT indexname, indexdef
--    FROM pg_indexes
--    WHERE tablename = 'profiles' AND schemaname = 'public';
--
-- 4. Check data updates:
--    SELECT 
--      COUNT(*) as total_profiles,
--      COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subscriptions,
--      COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
--      COUNT(*) FILTER (WHERE language_preference IS NOT NULL) as with_language_pref
--    FROM public.profiles;

