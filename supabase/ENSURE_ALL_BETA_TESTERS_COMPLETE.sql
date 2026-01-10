-- ============================================================================
-- COMPLETE BETA TESTER SETUP - Run this ONE script to ensure all users are beta testers
-- ============================================================================
-- This script:
-- 1. Creates profiles for any auth.users without profiles (as beta testers)
-- 2. Sets all existing profiles as beta testers with indefinite access
-- 3. Sets up trigger so all NEW users automatically get beta tester status
-- 4. Removes old legacy trigger that created rows in public.users table
--
-- SAFE TO RUN: No data will be deleted, only added/updated
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create function to automatically create profiles with beta tester status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with beta tester status
  -- The trigger set_beta_tester_default will ensure is_beta_tester is set to true
  -- even if somehow NULL gets passed
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
    'free',
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
-- STEP 2: Create trigger on auth.users to create profiles automatically for NEW users
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- STEP 3: Create profiles for existing auth.users that don't have profiles yet
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
-- STEP 4: Ensure ALL existing profiles are beta testers with indefinite access
-- ============================================================================
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL -- NULL = indefinite beta access
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- ============================================================================
-- STEP 5: Remove old legacy trigger that created rows in public.users table
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 6: Verify the setup
-- ============================================================================
SELECT 
  'Verification Report' as report_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta_access
FROM public.profiles;

COMMIT;

-- ============================================================================
-- AFTER RUNNING THIS SCRIPT:
-- ✅ All existing users have profiles (created if missing)
-- ✅ All existing users are beta testers with indefinite access
-- ✅ All new users will automatically get beta tester status via trigger
-- ✅ Old legacy trigger removed (no conflicts)
-- ✅ All users get 'apex' tier access via getUserTier() function
-- ============================================================================
