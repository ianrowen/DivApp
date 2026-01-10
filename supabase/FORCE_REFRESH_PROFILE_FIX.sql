-- ============================================================================
-- FORCE REFRESH PROFILE - Clear any cached data issues
-- This ensures RLS policies exist and profiles are accessible
-- ============================================================================

BEGIN;

-- Step 1: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop and recreate SELECT policy (ensures it's correct)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Step 3: Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Ensure INSERT policy exists (for profile creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Step 6: Double-check all users are beta testers
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

COMMIT;

-- After running this:
-- ✅ RLS policies are correct
-- ✅ All users can read their own profiles
-- ✅ All users are beta testers
-- ✅ Users need to log out/in to clear app cache
