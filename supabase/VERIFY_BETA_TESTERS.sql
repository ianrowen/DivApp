-- ============================================================================
-- VERIFY ALL USERS ARE BETA TESTERS
-- Run this in Supabase Dashboard → SQL Editor to verify beta tester setup
-- ============================================================================

-- Step 1: Check all existing users
SELECT 
  'Current Users Status' as check_type,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta
FROM public.profiles;

-- Step 2: List any users who are NOT beta testers
SELECT 
  'Users NOT Beta Testers' as check_type,
  user_id,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  created_at
FROM public.profiles
WHERE is_beta_tester IS NULL OR is_beta_tester = false
ORDER BY created_at DESC;

-- Step 3: Verify database triggers exist
SELECT 
  'Database Triggers' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND (trigger_name LIKE '%beta%' OR trigger_name LIKE '%profile%' OR trigger_name LIKE '%user%')
ORDER BY trigger_name;

-- Step 4: Verify column defaults
SELECT 
  'Column Defaults' as check_type,
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('is_beta_tester', 'beta_access_expires_at', 'subscription_tier')
ORDER BY column_name;

-- Step 5: Verify trigger function exists
SELECT 
  'Trigger Functions' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user_profile', 'handle_new_user')
ORDER BY routine_name;

-- Step 6: Check for auth.users without profiles (if any)
SELECT 
  'Auth Users Without Profiles' as check_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- Step 7: Summary report
SELECT 
  'SUMMARY' as report_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.profiles WHERE is_beta_tester IS NULL OR is_beta_tester = false) = 0 
    THEN '✅ All users are beta testers'
    ELSE '❌ Some users are NOT beta testers - run SET_ALL_BETA_TESTERS.sql'
  END as status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
      AND trigger_name = 'set_beta_tester_default'
      AND event_object_table = 'profiles'
    ) 
    THEN '✅ Beta tester trigger exists'
    ELSE '❌ Beta tester trigger missing'
  END as trigger_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles'
      AND column_name = 'is_beta_tester'
      AND column_default = 'true'
    )
    THEN '✅ Column default is true'
    ELSE '❌ Column default is NOT true'
  END as default_status;
