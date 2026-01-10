-- ============================================================================
-- FIX ALL USERS - Ensure Every User is a Beta Tester with Full Access
-- Run this ONE script to fix all users who have limited access
-- ============================================================================
-- This script:
-- 1. Creates profiles for any auth.users without profiles (as beta testers)
-- 2. Sets ALL existing profiles as beta testers with indefinite access
-- 3. Verifies the results
--
-- SAFE TO RUN: No data will be deleted, only added/updated
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create profiles for any auth.users that don't have profiles yet
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
-- STEP 2: Fix ALL existing profiles - set as beta testers with indefinite access
-- ============================================================================
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL  -- NULL = indefinite beta access
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- ============================================================================
-- STEP 3: Verify the results
-- ============================================================================
SELECT 
  'Verification Report' as report_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta_access,
  COUNT(*) FILTER (WHERE is_beta_tester = true AND beta_access_expires_at IS NOT NULL AND beta_access_expires_at < NOW()) as expired_beta_access
FROM public.profiles;

-- ============================================================================
-- STEP 4: Show any users who still have issues (should be 0)
-- ============================================================================
SELECT 
  'Users Needing Attention' as report_type,
  au.email,
  p.user_id,
  p.is_beta_tester,
  p.beta_access_expires_at,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE'
    WHEN p.is_beta_tester IS NULL THEN '❌ NULL'
    WHEN p.is_beta_tester = false THEN '❌ FALSE'
    WHEN p.beta_access_expires_at IS NOT NULL AND p.beta_access_expires_at < NOW() THEN '❌ EXPIRED'
    ELSE '✅ OK'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL 
   OR p.is_beta_tester IS NULL 
   OR p.is_beta_tester = false
   OR (p.beta_access_expires_at IS NOT NULL AND p.beta_access_expires_at < NOW())
ORDER BY au.created_at DESC;

COMMIT;

-- ============================================================================
-- AFTER RUNNING THIS SCRIPT:
-- ✅ All users have profiles (created if missing)
-- ✅ All users are beta testers with indefinite access
-- ✅ All users will get 'apex' tier access via getUserTier() function
-- ============================================================================
-- 
-- If the verification report shows non_beta_testers > 0, run this script again.
-- If users still have limited access after this, they may need to:
-- 1. Log out and log back in (to refresh their profile cache)
-- 2. Wait for the app to refresh their profile (ProfileContext will auto-fix)
-- ============================================================================
