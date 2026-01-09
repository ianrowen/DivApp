-- Migration: Rename user_profiles to profiles
-- Date: 2026-01-05
-- Description: Safely renames the user_profiles table to profiles while maintaining
--              all existing data, constraints, triggers, and policies.
--              This migration is idempotent and can be run multiple times safely.

BEGIN;

-- Step 1: Rename the table (only if it hasn't been renamed already)
-- This automatically transfers:
--   - All columns and data
--   - All constraints (primary keys, foreign keys, check constraints)
--   - All indexes
--   - All RLS policies (they reference by OID, not name)
DO $$
BEGIN
  -- Check if old table exists and new table doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.user_profiles RENAME TO profiles;
    RAISE NOTICE 'Table user_profiles renamed to profiles';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE 'Table profiles already exists, skipping rename';
  ELSE
    RAISE EXCEPTION 'Neither user_profiles nor profiles table found';
  END IF;
END $$;

-- Step 2: Update the trigger (it references the table name explicitly)
-- The trigger function handle_new_user_profile() doesn't need updating as it uses NEW/OLD
-- but the trigger itself needs to be recreated to point to the new table name
DROP TRIGGER IF EXISTS set_beta_tester_default ON public.profiles;
CREATE TRIGGER set_beta_tester_default
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Step 3: Verify RLS policies transferred automatically
-- RLS policies are stored by OID reference, so they automatically transfer with table rename.
-- To verify policies exist after migration, run:
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
-- If policies are missing, recreate them:
-- CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Step 4: Ensure index on user_id exists (good practice for foreign key lookups)
-- This index likely already exists, but IF NOT EXISTS ensures idempotency
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Step 5: Update table comment
COMMENT ON TABLE public.profiles IS 'User profile data, linked 1:1 with auth.users via user_id. Contains birth data, preferences, subscription tier, and beta tester status.';

-- Step 6: Update column comment if it exists
-- The is_beta_tester column comment from migration 003 needs updating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_beta_tester'
  ) THEN
    COMMENT ON COLUMN public.profiles.is_beta_tester IS 'Beta tester flag - defaults to true for all new users. Set to false to disable beta features.';
  END IF;
END $$;

COMMIT;

-- Verification queries (run these after migration to verify success):
-- 
-- 1. Verify table exists:
--    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';
--
-- 2. Verify trigger exists:
--    SELECT trigger_name, event_object_table FROM information_schema.triggers 
--    WHERE trigger_schema = 'public' AND event_object_table = 'profiles';
--
-- 3. Verify RLS policies:
--    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
--
-- 4. Verify index exists:
--    SELECT indexname FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_user_id';
--
-- 5. Verify foreign keys (if any tables reference profiles):
--    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
--    FROM information_schema.table_constraints AS tc
--    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
--    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
--    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'profiles';

