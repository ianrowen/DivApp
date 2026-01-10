-- ============================================================================
-- IMMEDIATE PRODUCTION FIX - No Code Changes Required
-- Run this NOW to fix production build access issues
-- ============================================================================

BEGIN;

-- Step 1: Ensure RLS policies allow reading is_beta_tester column
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Step 2: Force update ALL profiles to ensure boolean type is correct
-- Sometimes PostgreSQL stores booleans as strings, this forces them to be true booleans
-- Use COALESCE to handle NULL values and ensure they become true
UPDATE public.profiles 
SET 
  is_beta_tester = COALESCE(is_beta_tester, true)::boolean,  -- Handle NULL and cast to boolean
  beta_access_expires_at = NULL
WHERE COALESCE(is_beta_tester, false)::boolean IS DISTINCT FROM true::boolean 
   OR beta_access_expires_at IS NOT NULL;

-- Step 2b: Double-check - update any remaining NULL or false values
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL
WHERE is_beta_tester IS NULL 
   OR is_beta_tester = false
   OR (is_beta_tester::text NOT IN ('true', 't', '1', 'yes', 'y', 'on'));

-- Step 3: Create a function that apps can call to refresh their profile
-- This can be called via RPC if needed
CREATE OR REPLACE FUNCTION public.refresh_user_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  profile_data jsonb;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Force update to beta tester
  UPDATE public.profiles 
  SET 
    is_beta_tester = true::boolean,
    beta_access_expires_at = NULL
  WHERE profiles.user_id = refresh_user_profile.user_id;
  
  -- Return the updated profile
  SELECT to_jsonb(p.*) INTO profile_data
  FROM public.profiles p
  WHERE p.user_id = refresh_user_profile.user_id;
  
  RETURN profile_data;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_user_profile() TO authenticated;

-- Step 4: Verify the fix worked
SELECT 
  'Verification' as check_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester::text = 'true') as beta_testers_boolean_true,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers_direct_check,
  COUNT(*) FILTER (WHERE is_beta_tester IS NULL) as null_values,
  COUNT(*) FILTER (WHERE is_beta_tester = false) as false_values
FROM public.profiles;

COMMIT;

-- ============================================================================
-- HOW TO USE:
-- 1. Run this script in Supabase SQL Editor
-- 2. Users need to log out and log back in (clears app cache)
-- 3. If still not working, the app can call: SELECT refresh_user_profile();
--    This will force refresh their profile
-- ============================================================================
