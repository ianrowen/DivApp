# Account Deletion Setup Guide

This guide explains how to set up account deletion functionality for Divin8.

## Files Created

1. **`public/delete-account.html`** - HTML page for email link validation and confirmation
2. **`app/delete-account.tsx`** - App screen that performs the actual account deletion
3. **`supabase/migrations/004_add_delete_user_account_function.sql`** - Database function for deleting auth users

## Setup Steps

### 1. Deploy HTML File

Upload `public/delete-account.html` to your website:
- URL: `https://divin8.com/delete-account.html`
- Make sure it's publicly accessible

### 2. Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add this URL to **Redirect URLs**:
   ```
   https://divin8.com/delete-account.html
   ```

### 3. Create Database Function

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/004_add_delete_user_account_function.sql`
3. Click **Run** to execute the migration

This creates a function `delete_user_account()` that:
- Verifies the user is deleting their own account
- Deletes all readings
- Deletes user profile
- Deletes the auth user account

### 4. Configure Email Template (Optional)

If you want to send account deletion emails:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Create a new template or modify existing one:
   - **Subject**: "Delete Your Divin8 Account"
   - **Body**: Include a link to `https://divin8.com/delete-account.html?token={{ .Token }}&type=recovery`
   - Or use the magic link format that Supabase provides

### 5. Add Delete Account Button to Profile Screen (Optional)

To allow users to delete their account directly from the app:

Add a button in `src/screens/ProfileScreen.tsx`:

```tsx
<ThemedButton
  title="Delete Account"
  onPress={() => router.push('/delete-account')}
  variant="ghost"
  style={styles.deleteAccountButton}
  textStyle={styles.deleteAccountText}
/>
```

## How It Works

### Email Link Flow:
1. User clicks deletion link in email
2. Opens `delete-account.html` in browser
3. HTML page validates token and shows confirmation
4. User confirms → redirects to app via deep link: `divin8://delete-account?access_token=...&type=recovery`
5. App screen receives token, validates session
6. Shows confirmation screen
7. User confirms → deletes all data:
   - All readings from `readings` table
   - User profile from `users` table
   - Local storage (AsyncStorage)
   - Auth user account (via database function)
8. Signs out and redirects to login

### In-App Flow:
1. User navigates to delete account screen from Profile
2. App checks authentication
3. Shows confirmation screen
4. User confirms → performs same deletion steps as above

## Data Deleted

When an account is deleted, the following data is removed:

- ✅ All readings from `readings` table (`user_id` matches)
- ✅ User profile from `public.users` table
- ✅ Auth user account from `auth.users` table
- ✅ Local storage:
  - `@divin8_user_profile`
  - `@divin8_animations_enabled`
  - All Supabase session/auth keys

## Security Notes

- The database function uses `SECURITY DEFINER` to allow deletion of auth users
- The function verifies `auth.uid() == user_id` to prevent unauthorized deletions
- Email links use recovery tokens that expire
- All deletions are permanent and cannot be undone

## Troubleshooting

### "Database function not available" Error

If you see this error, it means the database function hasn't been created yet:
1. Run the SQL migration in Supabase SQL Editor
2. Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'delete_user_account';`

### "Unauthorized" Error

This means the user is trying to delete someone else's account. The function checks `auth.uid() == user_id`.

### Auth User Not Deleted

If readings and profile are deleted but auth user remains:
- Check that the database function was created successfully
- Verify the function has `SECURITY DEFINER` set
- Check Supabase logs for errors

## Testing

1. **Test Email Link Flow:**
   - Request account deletion via email
   - Click link in email
   - Confirm deletion on HTML page
   - Verify app opens and completes deletion

2. **Test In-App Flow:**
   - Sign in to app
   - Navigate to delete account screen
   - Confirm deletion
   - Verify all data is deleted

3. **Verify Deletion:**
   - Check `readings` table - should have no rows for deleted user
   - Check `users` table - should have no row for deleted user
   - Check `auth.users` - user should be deleted
   - Check AsyncStorage - should be cleared

## Notes

- Account deletion is **permanent** and **cannot be undone**
- Users will need to create a new account to use Divin8 again
- Consider adding a "soft delete" option if you want to allow account recovery
- You may want to add a grace period (e.g., 30 days) before permanent deletion



