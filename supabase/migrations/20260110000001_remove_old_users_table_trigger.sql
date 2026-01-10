-- Migration: Remove old users table trigger if it exists (legacy cleanup)
-- Date: 2026-01-10
-- Description: Removes the old trigger that created rows in public.users table
--              since the current system uses public.profiles table instead.
--              This prevents conflicts and ensures all new users go to profiles table.

BEGIN;

-- Step 1: Drop the old trigger if it exists (it creates rows in public.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Optionally drop the old function if it's no longer needed
-- (Only if you're sure nothing else uses it)
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: We keep the new trigger 'on_auth_user_created_create_profile' 
-- which creates rows in public.profiles with beta tester status

COMMIT;

-- After this migration:
-- ✅ Old trigger that created rows in public.users is removed
-- ✅ Only the new trigger 'on_auth_user_created_create_profile' remains
-- ✅ All new users will go to public.profiles table with beta tester status
