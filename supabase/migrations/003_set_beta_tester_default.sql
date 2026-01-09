-- Migration: Set is_beta_tester default to true for all new users
-- This allows all new users to be beta testers automatically until disabled

-- Step 1: Set default value for is_beta_tester column
-- First, ensure the column exists (if it doesn't, create it)
DO $$ 
BEGIN
  -- Check if column exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'is_beta_tester'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN is_beta_tester BOOLEAN DEFAULT true;
  ELSE
    -- Column exists, just set the default
    ALTER TABLE public.user_profiles 
    ALTER COLUMN is_beta_tester SET DEFAULT true;
  END IF;
END $$;

-- Step 2: Update existing NULL values to true (optional - only if you want existing users to be beta testers too)
-- Uncomment the line below if you want to set existing users to beta testers:
-- UPDATE public.user_profiles SET is_beta_tester = true WHERE is_beta_tester IS NULL;

-- Step 3: Create or replace function to handle new user profile creation
-- This ensures that when a profiles row is created, is_beta_tester defaults to true
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_beta_tester is not explicitly set, default to true
  IF NEW.is_beta_tester IS NULL THEN
    NEW.is_beta_tester := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to set is_beta_tester before insert
DROP TRIGGER IF EXISTS set_beta_tester_default ON public.user_profiles;
CREATE TRIGGER set_beta_tester_default
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 5: If profiles are created via a trigger from auth.users, update that trigger
-- Check if there's a trigger that creates profiles from auth.users
-- This is a common pattern - if you have such a trigger, update it to include is_beta_tester = true

-- Example: If you have a trigger that creates profiles when auth.users is created,
-- you would update it like this (uncomment and modify if needed):
/*
CREATE OR REPLACE FUNCTION public.handle_new_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, is_beta_tester, created_at, updated_at)
  VALUES (NEW.id, NEW.email, true, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- Add comment
-- Note: This migration was run when the table was named 'user_profiles'
-- The table has since been renamed to 'profiles' (see migration 20260105115302)
COMMENT ON COLUMN public.user_profiles.is_beta_tester IS 'Beta tester flag - defaults to true for all new users. Set to false to disable beta features.';







