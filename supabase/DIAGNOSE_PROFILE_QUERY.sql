-- ============================================================================
-- DIAGNOSE WHAT THE APP ACTUALLY SEES
-- Run this to see what a specific user's profile query returns
-- ============================================================================

-- Replace YOUR_EMAIL_HERE with your email
-- This simulates what the app query returns

-- Step 1: Check what columns exist
SELECT 
  'Column Check' as check_type,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('is_beta_tester', 'beta_access_expires_at', 'subscription_tier', 'user_id')
ORDER BY column_name;

-- Step 2: Simulate the exact query the app makes
-- Replace YOUR_EMAIL_HERE with your email
SELECT 
  'App Query Simulation' as check_type,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  sun_sign,
  moon_sign,
  rising_sign,
  user_id,
  use_birth_data_for_readings,
  -- Type checks
  pg_typeof(is_beta_tester) as is_beta_tester_type,
  is_beta_tester::text as is_beta_tester_as_text,
  CASE 
    WHEN is_beta_tester = true THEN '✅ TRUE'
    WHEN is_beta_tester = false THEN '❌ FALSE'
    WHEN is_beta_tester IS NULL THEN '❌ NULL'
    ELSE '⚠️ UNKNOWN: ' || is_beta_tester::text
  END as beta_tester_status
FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);

-- Step 3: Check RLS policy allows reading is_beta_tester
SELECT 
  'RLS Policy Check' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'Users can view own profile';

-- Step 4: Test if RLS is blocking anything
-- This will show if RLS is preventing access
SELECT 
  'RLS Test' as check_type,
  COUNT(*) as total_rows_visible,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers_visible
FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);
