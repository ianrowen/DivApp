-- ============================================================================
-- CHECK RLS POLICIES AND PROFILE ACCESS
-- Run this to verify the app can read beta tester status
-- ============================================================================

-- Step 1: Check RLS policies on profiles table
SELECT 
  'RLS Policies on profiles' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 2: Check if RLS is enabled
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- Step 3: Test query as authenticated user (simulate what app does)
-- This will show what the app can actually see
-- Note: Replace YOUR_USER_ID with an actual user ID from auth.users
SELECT 
  'Test Query (as authenticated)' as check_type,
  user_id,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  CASE 
    WHEN is_beta_tester = true AND (beta_access_expires_at IS NULL OR beta_access_expires_at >= NOW()) 
    THEN '✅ Should have apex access'
    ELSE '❌ Should NOT have apex access'
  END as access_status
FROM public.profiles
WHERE user_id IN (
  SELECT id FROM auth.users LIMIT 5  -- Test with first 5 users
)
ORDER BY created_at DESC;

-- Step 4: Check if there are any missing RLS policies
-- If this returns empty, RLS policies exist
SELECT 
  'Missing Policies' as check_type,
  'profiles' as table_name,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND cmd = 'SELECT'
    ) THEN '❌ Missing SELECT policy'
    ELSE '✅ SELECT policy exists'
  END as select_policy,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND cmd = 'UPDATE'
    ) THEN '❌ Missing UPDATE policy'
    ELSE '✅ UPDATE policy exists'
  END as update_policy;

-- Step 5: Create/verify RLS policies if missing
-- Run this ONLY if policies are missing
DO $$
BEGIN
  -- Check if SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Created SELECT policy';
  ELSE
    RAISE NOTICE 'SELECT policy already exists';
  END IF;
  
  -- Check if UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created UPDATE policy';
  ELSE
    RAISE NOTICE 'UPDATE policy already exists';
  END IF;
END $$;

-- Step 6: Verify column exists and has correct type
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
