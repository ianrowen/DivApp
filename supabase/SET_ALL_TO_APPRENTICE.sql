-- ============================================================================
-- SET ALL USERS TO APPRENTICE TIER (After Beta Ends)
-- Run this in Supabase Dashboard → SQL Editor when beta period ends
-- ============================================================================
-- This downgrades all users to 'adept' (apprentice) tier
-- You can modify the tier value if you want 'free' instead

BEGIN;

-- Option 1: Set all users to 'adept' tier (recommended)
UPDATE public.profiles 
SET 
  subscription_tier = 'adept',
  is_beta_tester = false, -- Disable beta tester status
  beta_access_expires_at = NOW() -- Set expiration to now
WHERE is_beta_tester = true;

-- Option 2: Set all users to 'free' tier (uncomment if preferred)
-- UPDATE public.profiles 
-- SET 
--   subscription_tier = 'free',
--   is_beta_tester = false,
--   beta_access_expires_at = NOW()
-- WHERE is_beta_tester = true;

-- Verify the update
SELECT 
  subscription_tier,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;

COMMIT;

-- After running this:
-- - All users will have subscription_tier = 'adept' (or 'free' if you used Option 2)
-- - Beta tester status will be disabled
-- - Beta access will be expired
-- - Users will only get their subscription_tier access (no automatic apex from beta)

