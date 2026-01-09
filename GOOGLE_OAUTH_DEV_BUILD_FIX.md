# Google OAuth Development Build Configuration

## Issue
Development build isn't allowing Google account sign-in.

## Root Cause
The redirect URI `divin8://supabase-auth` needs to be configured in both Supabase and Google Cloud Console.

## Solution

### Step 1: Configure Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers** → **Google**
3. In the **Redirect URLs** section, add:
   ```
   divin8://supabase-auth
   ```
4. Save the changes

### Step 2: Configure Google Cloud Console

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (or create one if it doesn't exist)
5. Click **Edit**
6. In **Authorized redirect URIs**, add:
   ```
   https://bawkzybwbpoxftgawvha.supabase.co/auth/v1/callback
   ```
   (Replace with your actual Supabase project URL if different)
7. Save the changes

### Step 3: Verify Configuration

The redirect flow works like this:
1. App → Opens Google OAuth → Redirects to Supabase callback URL
2. Supabase → Processes auth → Redirects back to `divin8://supabase-auth`
3. App → Receives callback → Completes authentication

### Step 4: Test

1. Rebuild your development build
2. Try signing in with Google
3. Check console logs for the redirect URI being used:
   ```
   [Supabase] Generated dev build redirect URI: divin8://supabase-auth
   ```

## Troubleshooting

### If it still doesn't work:

1. **Check the console logs** - Look for the actual redirect URI being generated
2. **Verify the scheme** - Make sure `divin8` matches your app.json scheme
3. **Check Supabase logs** - Go to Supabase Dashboard → Logs → Auth logs
4. **Verify OAuth Client ID** - Make sure the Client ID in Supabase matches Google Cloud Console

### Common Issues:

- **"redirect_uri_mismatch"** - The redirect URI in Google Cloud Console doesn't match what Supabase is sending
- **"unauthorized_client"** - The OAuth Client ID isn't properly configured
- **"access_denied"** - User cancelled the OAuth flow (not a config issue)

## Additional Notes

- For **Expo Go**, the redirect URI is different: `https://auth.expo.io/@irowen/divin8-app`
- For **production builds**, you may need to add additional redirect URIs
- The redirect URI format is: `{scheme}://{path}` where scheme comes from app.json and path is `supabase-auth`



