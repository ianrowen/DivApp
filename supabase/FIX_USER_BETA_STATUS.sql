-- ============================================================================
-- FIX USER'S BETA TESTER STATUS
-- Use this to fix a specific user who has limited access
-- ============================================================================

-- Step 1: Check the user's current status (replace USER_EMAIL_HERE)
SELECT 
  au.id as user_id,
  au.email,
  p.is_beta_tester,
  p.beta_access_expires_at,
  p.subscription_tier,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE'
    WHEN p.is_beta_tester IS NULL THEN '❌ NULL - Needs fix!'
    WHEN p.is_beta_tester = false THEN '❌ FALSE - Needs fix!'
    WHEN p.is_beta_tester = true AND (p.beta_access_expires_at IS NULL OR p.beta_access_expires_at >= NOW()) THEN '✅ ACTIVE'
    ELSE '⚠️ CHECK EXPIRATION'
  END as current_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'USER_EMAIL_HERE';  -- Replace with actual email

-- Step 2: Create profile if missing (replace USER_EMAIL_HERE)
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
WHERE au.email = 'USER_EMAIL_HERE'  -- Replace with actual email
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Fix beta tester status (replace USER_EMAIL_HERE)
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL  -- NULL = indefinite beta access
WHERE user_id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = 'USER_EMAIL_HERE'  -- Replace with actual email
)
AND (is_beta_tester IS NULL OR is_beta_tester = false);

-- Step 4: Verify the fix (replace USER_EMAIL_HERE)
SELECT 
  au.email,
  p.is_beta_tester,
  p.beta_access_expires_at,
  p.subscription_tier,
  CASE 
    WHEN p.is_beta_tester = true AND (p.beta_access_expires_at IS NULL OR p.beta_access_expires_at >= NOW()) 
    THEN '✅ FIXED - Beta tester with full access'
    ELSE '❌ STILL NEEDS FIX'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'USER_EMAIL_HERE';  -- Replace with actual email

-- ============================================================================
-- ALTERNATIVE: Fix by user ID (if you know the UUID)
-- ============================================================================
-- UPDATE public.profiles 
-- SET 
--   is_beta_tester = true,
--   beta_access_expires_at = NULL
-- WHERE user_id = 'USER_UUID_HERE';  -- Replace with actual UUID
