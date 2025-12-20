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
  
  -- Delete user profile (will cascade if foreign key is set up)
  DELETE FROM public.users WHERE id = delete_user_account.user_id;
  
  -- Delete the auth user account
  -- This requires SECURITY DEFINER to access auth.users
  DELETE FROM auth.users WHERE id = delete_user_account.user_id;
  
  -- Note: If you have other tables with user data, add DELETE statements here
  -- Example:
  -- DELETE FROM public.user_profiles WHERE id = delete_user_account.user_id;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account IS 'Allows users to delete their own account and all associated data. Requires SECURITY DEFINER to delete from auth.users.';

