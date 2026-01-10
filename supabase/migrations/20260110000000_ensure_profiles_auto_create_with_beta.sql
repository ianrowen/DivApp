-- Migration: Ensure profiles are automatically created from auth.users with beta tester status
-- Date: 2026-01-10
-- Description: Creates a trigger that automatically creates a profiles row when an auth.users
--              row is created, ensuring all new users get beta tester status automatically.
--              This is a safety net in addition to ProfileContext.tsx handling.

BEGIN;

-- Step 1: Create or replace function to automatically create profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with beta tester status
  -- The trigger set_beta_tester_default will ensure is_beta_tester is set to true
  -- even if somehow NULL gets passed
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
  VALUES (
    NEW.id,
    'free',
    true, -- Explicitly set beta tester status
    NULL, -- NULL = indefinite beta access
    'active',
    'en',
    'UTC',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Handle race conditions gracefully
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create trigger on auth.users to create profiles automatically
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Step 3: Ensure all existing auth.users have profiles (create missing ones)
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

-- Step 4: Ensure all existing profiles are beta testers (safety check)
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL -- NULL = indefinite beta access
WHERE is_beta_tester IS NULL OR is_beta_tester = false;

COMMIT;

-- After this migration:
-- ✅ All new auth.users will automatically get a profiles row with beta tester status
-- ✅ All existing auth.users without profiles will get one created
-- ✅ All existing profiles are ensured to be beta testers
-- ✅ This works alongside ProfileContext.tsx as a safety net
