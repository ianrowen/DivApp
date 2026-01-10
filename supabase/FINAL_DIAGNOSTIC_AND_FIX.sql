-- ============================================================================
-- FINAL DIAGNOSTIC AND FIX - Run This to Find and Fix the Issue
-- ============================================================================

BEGIN;

-- Step 1: Check column type and values
SELECT 
  'Column Type Check' as diagnostic,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'is_beta_tester';

-- Step 2: Check actual values in database
SELECT 
  'Value Check' as diagnostic,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as true_count,
  COUNT(*) FILTER (WHERE is_beta_tester = false) as false_count,
  COUNT(*) FILTER (WHERE is_beta_tester IS NULL) as null_count,
  COUNT(*) FILTER (WHERE pg_typeof(is_beta_tester)::text != 'boolean') as wrong_type_count
FROM public.profiles;

-- Step 3: Show sample of actual values
SELECT 
  'Sample Values' as diagnostic,
  user_id,
  is_beta_tester,
  pg_typeof(is_beta_tester) as type,
  is_beta_tester::text as as_text,
  beta_access_expires_at
FROM public.profiles
LIMIT 5;

-- Step 4: Fix column type if it's not boolean
DO $$
BEGIN
  -- Check current type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_beta_tester'
    AND data_type != 'boolean'
  ) THEN
    -- Convert to boolean
    ALTER TABLE public.profiles 
    ALTER COLUMN is_beta_tester TYPE boolean 
    USING CASE 
      WHEN is_beta_tester::text IN ('true', 't', '1', 'yes', 'y', 'on') THEN true
      WHEN is_beta_tester::text IN ('false', 'f', '0', 'no', 'n', 'off', '') THEN false
      ELSE true  -- Default to true for any other value
    END;
    
    RAISE NOTICE 'Converted is_beta_tester to boolean type';
  END IF;
END $$;

-- Step 5: Force update ALL profiles with explicit boolean
UPDATE public.profiles 
SET 
  is_beta_tester = true::boolean,
  beta_access_expires_at = NULL::timestamptz
WHERE 
  is_beta_tester IS DISTINCT FROM true::boolean
  OR beta_access_expires_at IS NOT NULL;

-- Step 6: Set default and NOT NULL constraint
ALTER TABLE public.profiles 
  ALTER COLUMN is_beta_tester SET DEFAULT true;

-- Try to set NOT NULL (might fail if there are NULLs, but UPDATE above should have fixed that)
DO $$
BEGIN
  ALTER TABLE public.profiles 
    ALTER COLUMN is_beta_tester SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set NOT NULL (may have NULL values)';
END $$;

-- Step 7: Verify RLS allows reading
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Step 8: Final verification
SELECT 
  'FINAL CHECK' as diagnostic,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester IS NULL) as nulls,
  COUNT(*) FILTER (WHERE is_beta_tester = false) as false_values,
  COUNT(*) FILTER (WHERE pg_typeof(is_beta_tester)::text = 'boolean') as correct_type_count
FROM public.profiles;

COMMIT;

-- ============================================================================
-- After running this:
-- 1. Check console logs in app for: 🔍 PROFILE LOADED
-- 2. Look for is_beta_tester value in the log
-- 3. If it shows null/false, there's an RLS or query issue
-- 4. Share the console log output
-- ============================================================================
