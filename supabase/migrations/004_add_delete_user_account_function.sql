-- Migration: Add function to delete user account
-- This function allows users to delete their own accounts via RPC call
-- It requires SECURITY DEFINER to delete from auth.users table

-- Function to delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Delete all readings for this user
  DELETE FROM public.readings WHERE user_id = delete_user_account.user_id;
  
  -- Delete user profile from profiles table (will cascade if foreign key is set up)
  DELETE FROM public.profiles WHERE user_id = delete_user_account.user_id;
  
  -- Delete from legacy users table if it exists (for backwards compatibility)
  -- Note: The current system uses 'profiles' table, but this handles legacy 'users' table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    DELETE FROM public.users WHERE id = delete_user_account.user_id;
  END IF;
  
  -- Delete the auth user account
  -- This requires SECURITY DEFINER to access auth.users
  DELETE FROM auth.users WHERE id = delete_user_account.user_id;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account IS 'Allows users to delete their own account and all associated data. Requires SECURITY DEFINER to delete from auth.users.';



