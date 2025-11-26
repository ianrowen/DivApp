-- QUICK SETUP: Copy and paste this entire file into Supabase SQL Editor
-- This sets up the tier system and gives you expert tier

-- Step 1: Create users table with subscription_tier
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Step 2: Create profiles for existing users (if any)
INSERT INTO public.users (id, email, subscription_tier)
SELECT id, email, 'free'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set YOUR tier to expert
-- Option A: Set by your email (replace with your actual email)
-- UPDATE public.users 
-- SET subscription_tier = 'expert'
-- WHERE email = 'your-email@example.com';

-- Option B: Set ALL existing users to expert (for development)
UPDATE public.users 
SET subscription_tier = 'expert'
WHERE subscription_tier = 'free';

-- Step 4: Verify setup
SELECT 
  id, 
  email, 
  subscription_tier,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- You should see your user(s) with subscription_tier = 'expert'

