-- ============================================================================
-- COMPREHENSIVE FIX: Set BOTH subscription_tier AND is_beta_tester
-- This ensures access even if one check fails
-- ============================================================================

BEGIN;

-- Step 1: Fix RLS policies
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

-- Step 3: Ensure column type is boolean
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
    RAISE NOTICE 'Converted is_beta_tester to boolean';
  END IF;
END $$;

-- Step 4: Set BOTH subscription_tier to 'apex' AND is_beta_tester to true
-- This ensures access works even if one check fails
UPDATE public.profiles 
SET 
  subscription_tier = 'apex',
  is_beta_tester = true::boolean,
  beta_access_expires_at = NULL::timestamptz
WHERE 
  subscription_tier != 'apex' 
  OR is_beta_tester IS DISTINCT FROM true::boolean
  OR beta_access_expires_at IS NOT NULL;

-- Step 5: Set defaults for future inserts
ALTER TABLE public.profiles 
  ALTER COLUMN is_beta_tester SET DEFAULT true;

-- Step 6: Verify
SELECT 
  'COMPREHENSIVE FIX VERIFICATION' as status,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE subscription_tier = 'apex') as apex_tier_count,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_tester_count,
  COUNT(*) FILTER (WHERE subscription_tier = 'apex' AND is_beta_tester = true) as both_set_count
FROM public.profiles;

COMMIT;

-- ============================================================================
-- This sets BOTH:
-- 1. subscription_tier = 'apex' (works even if beta check fails)
-- 2. is_beta_tester = true (for beta tester check)
-- 
-- The app checks: isBetaTester ? 'apex' : subscription_tier
-- So with both set, access is guaranteed
-- ============================================================================
