-- Quick script to set YOUR tier to expert
-- Run this after the main setup

-- Method 1: Set by email (replace with your email)
UPDATE public.users 
SET subscription_tier = 'expert'
WHERE email = 'your-email@example.com';

-- Method 2: Set by user ID (get your ID from: SELECT id, email FROM auth.users;)
-- UPDATE public.users 
-- SET subscription_tier = 'expert'
-- WHERE id = 'your-user-uuid-here';

-- Verify it worked:
SELECT id, email, subscription_tier 
FROM public.users 
WHERE subscription_tier = 'expert';









