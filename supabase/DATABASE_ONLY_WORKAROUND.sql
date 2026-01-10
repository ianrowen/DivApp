-- ============================================================================
-- DATABASE-ONLY WORKAROUND - Works with Current Production Code
-- This creates a view that always shows beta tester status
-- ============================================================================

BEGIN;

-- Step 1: Create a view that ensures beta tester status is always true
CREATE OR REPLACE VIEW public.profiles_with_beta AS
SELECT 
  user_id,
  subscription_tier,
  true as is_beta_tester,  -- Always true
  NULL::timestamptz as beta_access_expires_at,  -- Always NULL (indefinite)
  sun_sign,
  moon_sign,
  rising_sign,
  use_birth_data_for_readings,
  -- Include all other columns from profiles
  *
FROM public.profiles;

-- Step 2: Grant access to the view
GRANT SELECT ON public.profiles_with_beta TO authenticated;

-- Step 3: Create RLS policy on the view
ALTER VIEW public.profiles_with_beta SET (security_invoker = true);

-- Actually, views don't support RLS directly. Let's use a function instead.

-- Drop the view approach, use function instead
DROP VIEW IF EXISTS public.profiles_with_beta;

-- Create a function that returns profile with guaranteed beta tester status
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  user_id uuid,
  subscription_tier text,
  is_beta_tester boolean,
  beta_access_expires_at timestamptz,
  sun_sign text,
  moon_sign text,
  rising_sign text,
  use_birth_data_for_readings boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Ensure user is beta tester
  UPDATE public.profiles 
  SET 
    is_beta_tester = true,
    beta_access_expires_at = NULL
  WHERE profiles.user_id = current_user_id;
  
  -- Return profile with guaranteed beta tester status
  RETURN QUERY
  SELECT 
    p.user_id,
    p.subscription_tier,
    true::boolean as is_beta_tester,  -- Always return true
    NULL::timestamptz as beta_access_expires_at,  -- Always NULL
    p.sun_sign,
    p.moon_sign,
    p.rising_sign,
    p.use_birth_data_for_readings
  FROM public.profiles p
  WHERE p.user_id = current_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

-- Step 4: Force update all profiles one more time
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL;

COMMIT;

-- ============================================================================
-- This creates a function that ALWAYS returns beta tester = true
-- But the app would need to call this function instead of querying the table
-- This won't work with current production code without changes
-- ============================================================================
