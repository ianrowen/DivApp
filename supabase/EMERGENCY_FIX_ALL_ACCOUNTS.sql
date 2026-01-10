-- ============================================================================
-- EMERGENCY FIX - Force All Accounts to Beta Tester Status
-- This is more aggressive and will fix ALL accounts regardless of current state
-- ============================================================================

BEGIN;

-- Step 1: Create profiles for ALL missing users
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
  COALESCE((SELECT subscription_tier FROM public.profiles WHERE user_id = au.id), 'free'),
  true, -- Force beta tester
  NULL, -- Indefinite access
  COALESCE((SELECT subscription_status FROM public.profiles WHERE user_id = au.id), 'active'),
  COALESCE((SELECT language_preference FROM public.profiles WHERE user_id = au.id), 'en'),
  COALESCE((SELECT timezone FROM public.profiles WHERE user_id = au.id), 'UTC'),
  COALESCE((SELECT allow_personalized_readings FROM public.profiles WHERE user_id = au.id), true),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO UPDATE SET
  is_beta_tester = true,
  beta_access_expires_at = NULL;

-- Step 2: Force ALL existing profiles to beta tester (no WHERE clause - updates EVERYTHING)
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL;

-- Step 3: Verify ALL users are fixed
SELECT 
  'Final Verification' as report_type,
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers,
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_access
FROM public.profiles;

-- Step 4: Show any remaining issues (should be empty)
SELECT 
  'Remaining Issues' as report_type,
  au.email,
  p.is_beta_tester,
  p.beta_access_expires_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL 
   OR p.is_beta_tester IS NULL 
   OR p.is_beta_tester = false
   OR p.beta_access_expires_at IS NOT NULL;

COMMIT;

-- After running this:
-- ✅ ALL users will be beta testers
-- ✅ ALL users will have indefinite access
-- ✅ If you still have limited access, clear your app cache and log out/in
