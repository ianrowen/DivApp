-- ============================================================================
-- TEST PROFILE QUERY AS AUTHENTICATED USER
-- This simulates what the app sees when it queries profiles
-- Run this while logged into Supabase Dashboard as your user account
-- ============================================================================

-- Step 1: Check your current auth user
SELECT 
  'Current Auth User' as check_type,
  id,
  email
FROM auth.users
WHERE id = auth.uid();

-- Step 2: Query your profile exactly as the app does
SELECT 
  'Profile Query (as app)' as check_type,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  sun_sign,
  moon_sign,
  rising_sign,
  user_id,
  use_birth_data_for_readings,
  -- Type information
  pg_typeof(is_beta_tester) as is_beta_tester_type,
  is_beta_tester::text as is_beta_tester_text,
  -- Status check
  CASE 
    WHEN is_beta_tester = true AND (beta_access_expires_at IS NULL OR beta_access_expires_at >= NOW()) 
    THEN '✅ Should have APEX access'
    WHEN is_beta_tester = true AND beta_access_expires_at < NOW()
    THEN '❌ Beta tester but EXPIRED'
    WHEN is_beta_tester = false
    THEN '❌ NOT a beta tester'
    WHEN is_beta_tester IS NULL
    THEN '❌ NULL - needs fix'
    ELSE '⚠️ UNKNOWN STATUS'
  END as access_status
FROM public.profiles
WHERE user_id = auth.uid();

-- Step 3: Force refresh your profile
SELECT refresh_user_profile() as refreshed_profile;

-- Step 4: Query again to verify
SELECT 
  'After Refresh' as check_type,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  CASE 
    WHEN is_beta_tester = true AND (beta_access_expires_at IS NULL OR beta_access_expires_at >= NOW()) 
    THEN '✅ Should have APEX access'
    ELSE '❌ Still broken'
  END as access_status
FROM public.profiles
WHERE user_id = auth.uid();
