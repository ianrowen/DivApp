-- ============================================================================
-- SET ALL USERS AS BETA TESTERS (Full Access)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================
-- This ensures ALL users get full (apex) access during beta period
-- After beta ends, you can run SET_ALL_TO_APPRENTICE.sql to downgrade everyone

BEGIN;

-- Step 1: Create profiles for any auth.users that don't have profiles yet
INSERT INTO public.profiles (
  user_id,
  subscription_tier,
  is_beta_tester,
  beta_access_expires_at,
  subscription_status,
  language_preference,
  timezone,
  allow_personalized_readings,
  created_at,
  updated_at
)
SELECT 
  au.id,
  'free',
  true, -- Set as beta tester
  NULL, -- Indefinite beta access
  'active',
  'en',
  'UTC',
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL -- Only create profiles for users who don't have one
ON CONFLICT (user_id) DO NOTHING;

-- Step 2: Set ALL existing users as beta testers with no expiration
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL, -- NULL = indefinite beta access
  subscription_tier = COALESCE(subscription_tier, 'free') -- Keep existing tier, default to free if null
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

-- Step 3: Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta
FROM public.profiles;

COMMIT;

-- After running this, all users will have:
-- - is_beta_tester = true
-- - beta_access_expires_at = NULL (indefinite)
-- - They will automatically get 'apex' tier access via getUserTier() function

