-- Migration: Ensure ALL users are beta testers (full access during beta)
-- Date: 2026-01-05
-- Description: Sets all existing and future users as beta testers with full access
--              This is the simplest way to give everyone apex-level access during beta

BEGIN;

-- Step 1: Set ALL existing users as beta testers with no expiration
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL -- NULL = indefinite beta access
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- Step 2: Update the trigger function to ensure new users are beta testers
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set beta tester status for new profiles
  IF NEW.is_beta_tester IS NULL THEN
    NEW.is_beta_tester := true;
  END IF;
  
  -- Set beta access expiration to NULL (indefinite) if not set
  IF NEW.beta_access_expires_at IS NULL AND NEW.is_beta_tester = true THEN
    NEW.beta_access_expires_at := NULL; -- Already NULL, but explicit
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure the trigger exists and points to profiles table
DROP TRIGGER IF EXISTS set_beta_tester_default ON public.profiles;
CREATE TRIGGER set_beta_tester_default
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 4: Set default value for is_beta_tester column (for direct inserts)
ALTER TABLE public.profiles 
  ALTER COLUMN is_beta_tester SET DEFAULT true;

-- Step 5: Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta
FROM public.profiles;

COMMIT;

-- After this migration:
-- ✅ All existing users are beta testers with indefinite access
-- ✅ All new users will automatically be beta testers
-- ✅ All users will get 'apex' tier access via getUserTier() function
-- 
-- To end beta period later, run: supabase/SET_ALL_TO_APPRENTICE.sql

