-- ============================================================================
-- SET ALL USERS AS BETA TESTERS (Full Access)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================
-- This ensures ALL users get full (apex) access during beta period
-- After beta ends, you can run SET_ALL_TO_APPRENTICE.sql to downgrade everyone

BEGIN;

-- Set ALL existing users as beta testers with no expiration
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL, -- NULL = indefinite beta access
  subscription_tier = COALESCE(subscription_tier, 'free') -- Keep existing tier, default to free if null
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL) as indefinite_beta
FROM public.profiles;

COMMIT;

-- After running this, all users will have:
-- - is_beta_tester = true
-- - beta_access_expires_at = NULL (indefinite)
-- - They will automatically get 'apex' tier access via getUserTier() function

