-- ============================================================================
-- CHECK SPECIFIC USER'S BETA TESTER STATUS
-- Replace USER_EMAIL_HERE with the user's email address
-- ============================================================================

-- Option 1: Check by email
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  p.user_id as profile_user_id,
  p.subscription_tier,
  p.is_beta_tester,
  p.beta_access_expires_at,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE - Profile missing!'
    WHEN p.is_beta_tester IS NULL THEN '❌ NULL - Beta tester status is NULL!'
    WHEN p.is_beta_tester = false THEN '❌ FALSE - Not a beta tester!'
    WHEN p.beta_access_expires_at IS NOT NULL AND p.beta_access_expires_at < NOW() THEN '❌ EXPIRED - Beta access expired!'
    WHEN p.is_beta_tester = true AND (p.beta_access_expires_at IS NULL OR p.beta_access_expires_at >= NOW()) THEN '✅ ACTIVE - Beta tester with full access'
    ELSE '⚠️ UNKNOWN STATUS'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'USER_EMAIL_HERE'  -- Replace with actual email
ORDER BY au.created_at DESC;

-- Option 2: Check all Google OAuth users
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  p.user_id as profile_user_id,
  p.subscription_tier,
  p.is_beta_tester,
  p.beta_access_expires_at,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NO PROFILE'
    WHEN p.is_beta_tester IS NULL THEN '❌ NULL'
    WHEN p.is_beta_tester = false THEN '❌ FALSE'
    WHEN p.beta_access_expires_at IS NOT NULL AND p.beta_access_expires_at < NOW() THEN '❌ EXPIRED'
    WHEN p.is_beta_tester = true AND (p.beta_access_expires_at IS NULL OR p.beta_access_expires_at >= NOW()) THEN '✅ ACTIVE'
    ELSE '⚠️ UNKNOWN'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email LIKE '%@gmail.com' OR au.email LIKE '%@googlemail.com'  -- Google OAuth users
ORDER BY au.created_at DESC;

-- Option 3: Fix a specific user (replace USER_ID_HERE with the user's UUID)
-- UPDATE public.profiles 
-- SET 
--   is_beta_tester = true,
--   beta_access_expires_at = NULL
-- WHERE user_id = 'USER_ID_HERE';

-- Option 4: Fix all users with NULL or false beta tester status
-- UPDATE public.profiles 
-- SET 
--   is_beta_tester = true,
--   beta_access_expires_at = NULL
-- WHERE is_beta_tester IS NULL OR is_beta_tester = false;
