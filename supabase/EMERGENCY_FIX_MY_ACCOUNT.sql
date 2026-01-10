-- ============================================================================
-- EMERGENCY FIX - Check and Fix Your Account Immediately
-- Replace YOUR_EMAIL_HERE with your actual email address
-- ============================================================================

BEGIN;

-- Step 1: Check your current status
SELECT 
  'Current Status' as check_type,
  au.id as user_id,
  au.email,
  p.user_id as profile_exists,
  p.subscription_tier,
  p.is_beta_tester,
  p.beta_access_expires_at,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE'
    WHEN p.is_beta_tester IS NULL THEN '❌ NULL'
    WHEN p.is_beta_tester = false THEN '❌ FALSE'
    WHEN p.is_beta_tester = true AND (p.beta_access_expires_at IS NULL OR p.beta_access_expires_at >= NOW()) THEN '✅ SHOULD BE OK'
    ELSE '❌ EXPIRED'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Step 2: Create profile if missing
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
  true,
  NULL,
  'active',
  'en',
  'UTC',
  true,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.email = 'YOUR_EMAIL_HERE'  -- Replace with your email
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Force update your profile to beta tester (overrides everything)
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL,
  subscription_tier = COALESCE(subscription_tier, 'free')
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your email
);

-- Step 4: Verify the fix
SELECT 
  'After Fix' as check_type,
  au.email,
  p.is_beta_tester,
  p.beta_access_expires_at,
  p.subscription_tier,
  CASE 
    WHEN p.is_beta_tester = true AND p.beta_access_expires_at IS NULL THEN '✅ FIXED - Beta tester with full access'
    ELSE '❌ STILL BROKEN'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'YOUR_EMAIL_HERE';  -- Replace with your email

COMMIT;
