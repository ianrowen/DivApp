-- Debug script to check your tier setup
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- 2. Check all users and their tiers
SELECT 
  id,
  email,
  subscription_tier,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 3. Check your current auth user
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Check if your auth user has a profile in public.users
SELECT 
  au.id AS auth_id,
  au.email AS auth_email,
  pu.id AS profile_id,
  pu.subscription_tier,
  CASE 
    WHEN pu.id IS NULL THEN '❌ NO PROFILE - Run migration to create it'
    WHEN pu.subscription_tier = 'expert' THEN '✅ Expert tier set'
    ELSE '⚠️ Tier: ' || pu.subscription_tier
  END AS status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 5. Fix: Create profile for auth user if missing
INSERT INTO public.users (id, email, subscription_tier)
SELECT id, email, 'expert'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 6. Fix: Set all existing profiles to expert
UPDATE public.users 
SET subscription_tier = 'expert'
WHERE subscription_tier != 'expert';

-- 7. Verify final state
SELECT 
  id,
  email,
  subscription_tier,
  CASE 
    WHEN subscription_tier = 'expert' THEN '✅'
    ELSE '❌'
  END AS status
FROM public.users;









