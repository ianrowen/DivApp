-- Migration: Production Beta Tester Setup
-- Date: 2026-01-11
-- Description: Comprehensive setup to ensure all users (existing and new) get beta tester status
--              and apex tier access. This is the production-ready version that consolidates
--              all previous fixes and ensures nothing breaks in production.

BEGIN;

-- ============================================================================
-- STEP 1: Ensure RLS policies are correct
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 2: Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ============================================================================
-- STEP 3: Ensure is_beta_tester column is boolean type (not text)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_beta_tester'
    AND data_type != 'boolean'
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN is_beta_tester TYPE boolean 
    USING CASE 
      WHEN is_beta_tester::text IN ('true', 't', '1', 'yes', 'y', 'on') THEN true
      ELSE false
    END;
    RAISE NOTICE 'Converted is_beta_tester from text to boolean';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Set column defaults for future inserts
-- ============================================================================
ALTER TABLE public.profiles 
  ALTER COLUMN is_beta_tester SET DEFAULT true;

-- ============================================================================
-- STEP 5: Create/update trigger function for new auth.users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with beta tester status
  INSERT INTO public.profiles (
    user_id,
    subscription_tier,
    is_beta_tester,
    beta_access_expires_at,
    subscription_status,
    language_preference,
    timezone,
    allow_personalized_readings,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'free', -- Start with free tier
    true, -- Explicitly set beta tester status
    NULL, -- NULL = indefinite beta access
    'active',
    'en',
    'UTC',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Handle race conditions gracefully
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create trigger on auth.users to auto-create profiles
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- STEP 7: Create/update trigger function for profiles table (safety net)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set beta tester status for new profiles if not set
  IF NEW.is_beta_tester IS NULL THEN
    NEW.is_beta_tester := true;
  END IF;
  
  -- Set beta access expiration to NULL (indefinite) if not set
  IF NEW.beta_access_expires_at IS NULL AND NEW.is_beta_tester = true THEN
    NEW.beta_access_expires_at := NULL; -- Already NULL, but explicit
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Create trigger on profiles table (safety net)
-- ============================================================================
DROP TRIGGER IF EXISTS set_beta_tester_default ON public.profiles;
CREATE TRIGGER set_beta_tester_default
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================================================
-- STEP 9: Create profiles for any existing auth.users without profiles
-- ============================================================================
INSERT INTO public.profiles (
  user_id,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  subscription_status,
  language_preference,
  timezone,
  allow_personalized_readings,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'free',
  true, -- Set as beta tester
  NULL, -- Indefinite beta access
  'active',
  'en',
  'UTC',
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL -- Only create profiles for users who don't have one
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 10: Ensure ALL existing profiles are beta testers with indefinite access
-- ============================================================================
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL
WHERE is_beta_tester IS NULL OR is_beta_tester = false OR beta_access_expires_at IS NOT NULL;

-- ============================================================================
-- STEP 11: Set subscription_tier to 'apex' for all users (defensive measure)
-- This ensures access even if beta tester check fails
-- ============================================================================
UPDATE public.profiles 
SET subscription_tier = 'apex'
WHERE subscription_tier != 'apex';

-- ============================================================================
-- STEP 12: Create refresh_user_profile RPC function (for app to call if needed)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.refresh_user_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  profile_data jsonb;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Force update to beta tester and apex tier
  UPDATE public.profiles 
  SET 
    is_beta_tester = true,
    beta_access_expires_at = NULL,
    subscription_tier = 'apex'
  WHERE user_id = current_user_id;
  
  -- Return the updated profile
  SELECT to_jsonb(p.*) INTO profile_data
  FROM public.profiles p
  WHERE p.user_id = current_user_id;
  
  RETURN COALESCE(profile_data, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_user_profile() TO authenticated;

-- ============================================================================
-- STEP 13: Verification
-- ============================================================================
SELECT 
  'PRODUCTION SETUP VERIFICATION' as status,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE subscription_tier = 'apex') as apex_tier_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true AND subscription_tier = 'apex') as both_set_count,
  COUNT(*) FILTER (WHERE is_beta_tester IS NULL OR is_beta_tester = false) as non_beta_testers
FROM public.profiles;

COMMIT;

-- ============================================================================
-- AFTER THIS MIGRATION:
-- ✅ All RLS policies are correct
-- ✅ All existing users have profiles (created if missing)
-- ✅ All existing users are beta testers with indefinite access
-- ✅ All existing users have subscription_tier = 'apex' (defensive measure)
-- ✅ All new users will automatically get beta tester status via trigger
-- ✅ Column defaults ensure beta tester status for direct inserts
-- ✅ RPC function available for app to refresh profiles
-- ✅ Both subscription_tier and is_beta_tester are set (double protection)
-- ============================================================================
