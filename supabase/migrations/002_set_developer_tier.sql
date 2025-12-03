-- Migration: Set developer tier for specific users
-- Run this after migration 001 to set your own tier to expert

-- Option 1: Set tier by email (replace with your email)
-- UPDATE public.users 
-- SET subscription_tier = 'expert'
-- WHERE email = 'your-email@example.com';

-- Option 2: Set tier for all existing users to expert (for development)
-- UPDATE public.users 
-- SET subscription_tier = 'expert'
-- WHERE subscription_tier = 'free';

-- Option 3: Set tier for a specific user ID (get your user ID from auth.users)
-- UPDATE public.users 
-- SET subscription_tier = 'expert'
-- WHERE id = 'your-user-uuid-here';

-- Note: Uncomment the option you want to use









