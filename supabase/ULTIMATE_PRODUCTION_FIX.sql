-- ============================================================================
-- ULTIMATE PRODUCTION FIX - Run This ONE Script
-- This fixes everything database-side for immediate production use
-- ============================================================================

BEGIN;

-- Step 1: Fix RLS policies (ensure they're correct)
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

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Step 3: Force ALL profiles to beta tester with explicit boolean casting
-- This handles NULL, false, string 'true', and any other edge cases
UPDATE public.profiles 
SET 
  is_beta_tester = true,  -- PostgreSQL will handle the type
  beta_access_expires_at = NULL
WHERE 
  -- Update if NULL
  is_beta_tester IS NULL
  -- Update if false
  OR is_beta_tester = false
  -- Update if expiration is set
  OR beta_access_expires_at IS NOT NULL
  -- Update if somehow stored as text 'false'
  OR is_beta_tester::text = 'false'
  OR is_beta_tester::text = 'f'
  OR is_beta_tester::text = '0';

-- Step 4: Verify column type is boolean (not text)
DO $$
BEGIN
  -- Check if column is text type and needs conversion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_beta_tester'
    AND data_type = 'text'
  ) THEN
    -- Convert text column to boolean
    ALTER TABLE public.profiles 
    ALTER COLUMN is_beta_tester TYPE boolean 
    USING CASE 
      WHEN is_beta_tester::text IN ('true', 't', '1', 'yes', 'y', 'on') THEN true
      ELSE false
    END;
    
    -- Set default
    ALTER TABLE public.profiles 
    ALTER COLUMN is_beta_tester SET DEFAULT true;
    
    RAISE NOTICE 'Converted is_beta_tester from text to boolean';
  END IF;
END $$;

-- Step 5: Set default value for future inserts
ALTER TABLE public.profiles 
  ALTER COLUMN is_beta_tester SET DEFAULT true;

-- Step 6: Create refresh function (for app to call if needed)
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
  
  -- Force update to beta tester
  UPDATE public.profiles 
  SET 
    is_beta_tester = true,
    beta_access_expires_at = NULL
  WHERE user_id = current_user_id;
  
  -- Return the updated profile
  SELECT to_jsonb(p.*) INTO profile_data
  FROM public.profiles p
  WHERE p.user_id = current_user_id;
  
  RETURN COALESCE(profile_data, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_user_profile() TO authenticated;

-- Step 7: Final verification
SELECT 
  'FINAL VERIFICATION' as report_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers_true,
  COUNT(*) FILTER (WHERE is_beta_tester IS NULL) as null_values,
  COUNT(*) FILTER (WHERE is_beta_tester = false) as false_values,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_access
FROM public.profiles;

COMMIT;

-- ============================================================================
-- AFTER RUNNING THIS:
-- ✅ All RLS policies are correct
-- ✅ All profiles are beta testers (boolean true)
-- ✅ All have indefinite access (NULL expiration)
-- ✅ Database function exists for app to call refresh_user_profile()
-- 
-- USERS MUST: Log out and log back in to clear app cache
-- ============================================================================
