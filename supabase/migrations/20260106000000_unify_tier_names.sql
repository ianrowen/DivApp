-- Migration: Unify tier names to 'free' | 'adept' | 'apex'
-- Date: 2026-01-06
-- Description: Standardizes tier naming across database, app, and internal code
--              Maps old names: premium→adept, pro→adept, expert→apex

BEGIN;

-- Step 1: Update existing subscription_tier values
-- Map premium → adept, pro → adept, expert → apex
UPDATE public.profiles
SET subscription_tier = CASE
  WHEN subscription_tier = 'premium' THEN 'adept'
  WHEN subscription_tier = 'pro' THEN 'adept'
  WHEN subscription_tier = 'expert' THEN 'apex'
  ELSE subscription_tier -- Keep 'free' and 'adept'/'apex' as-is
END
WHERE subscription_tier IN ('premium', 'pro', 'expert');

-- Step 2: Update the check constraint on profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_subscription_tier_check
CHECK (subscription_tier IN ('free', 'adept', 'apex'));

-- Step 3: Update any users table if it exists (legacy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Update users table subscription_tier values
    UPDATE public.users
    SET subscription_tier = CASE
      WHEN subscription_tier = 'premium' THEN 'adept'
      WHEN subscription_tier = 'pro' THEN 'adept'
      WHEN subscription_tier = 'expert' THEN 'apex'
      ELSE subscription_tier
    END
    WHERE subscription_tier IN ('premium', 'pro', 'expert');
    
    -- Update users table constraint
    ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
    
    ALTER TABLE public.users
    ADD CONSTRAINT users_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'adept', 'apex'));
  END IF;
END $$;

-- Step 4: Verify the migration
SELECT 
  subscription_tier,
  COUNT(*) as user_count
FROM public.profiles
GROUP BY subscription_tier
ORDER BY 
  CASE subscription_tier
    WHEN 'free' THEN 1
    WHEN 'adept' THEN 2
    WHEN 'apex' THEN 3
  END;

COMMIT;

-- After this migration:
-- ✅ All tiers unified to: 'free' | 'adept' | 'apex'
-- ✅ Database constraints updated
-- ✅ Old tier names (premium/pro/expert) mapped to new names
-- ✅ Next: Update TypeScript types and internal code

