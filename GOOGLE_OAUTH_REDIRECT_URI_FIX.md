# Fix: "Something went wrong trying to finish signing in"

## The Problem
You're seeing the error "something went wrong trying to finish signing in" from Expo. This happens when:
1. Google OAuth completes successfully
2. But Supabase rejects the authorization code exchange
3. Usually because the redirect URI doesn't match what's configured

## The Solution

### Step 1: Check Console Logs
When you try to sign in, look for this log message:
```
[Supabase] Generated dev build redirect URI: divin8://supabase-auth
```

**Copy that exact URI** - you'll need it in the next step.

### Step 2: Configure Supabase Dashboard (CRITICAL)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Providers** → **Google**
4. Scroll down to **Redirect URLs** section
5. **Add the exact redirect URI** from Step 1:
   ```
   divin8://supabase-auth
   ```
6. **Important**: Make sure there are no extra spaces or characters
7. Click **Save**

### Step 3: Verify Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used in Supabase)
5. Click **Edit**
6. In **Authorized redirect URIs**, make sure you have:
   ```
   https://bawkzybwbpoxftgawvha.supabase.co/auth/v1/callback
   ```
7. Save changes

### Step 4: Rebuild Your App

**Configuration changes require a rebuild:**
```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### Step 5: Test Again

1. Install the new build
2. Try signing in with Google
3. Check console logs for any errors

## Why This Happens

The OAuth flow works like this:
1. App opens Google OAuth → Google redirects to Supabase callback URL ✅
2. Supabase processes auth → Tries to redirect back to `divin8://supabase-auth` ❌
3. If the redirect URI isn't in Supabase's allowed list, the code exchange fails

## Common Mistakes

❌ **Adding redirect URI to Google Cloud Console**
- Don't add `divin8://supabase-auth` to Google Cloud Console
- Google only accepts HTTPS URLs
- Add the Supabase callback URL instead

❌ **Wrong redirect URI format**
- Must match exactly: `divin8://supabase-auth`
- No trailing slashes
- No extra paths

❌ **Not rebuilding after config changes**
- Supabase config changes don't require rebuild
- But you should rebuild to ensure everything is fresh

## Still Not Working?

Check these logs when signing in:
- `[Supabase] Generated dev build redirect URI: ...` - Copy this exact value
- `[Supabase] Error exchanging code for session: ...` - This will show the exact error
- `[Supabase] Expected redirect URI: ...` - Verify this matches what's in Supabase

If you see an error like "redirect_uri_mismatch" or "invalid_grant", it means the redirect URI in Supabase doesn't match what the app is sending.

## Quick Checklist

- [ ] Console shows: `[Supabase] Generated dev build redirect URI: divin8://supabase-auth`
- [ ] Supabase Dashboard → Google Provider → Redirect URLs includes: `divin8://supabase-auth`
- [ ] Google Cloud Console → OAuth Client → Authorized redirect URIs includes: `https://bawkzybwbpoxftgawvha.supabase.co/auth/v1/callback`
- [ ] Rebuilt the app after configuration changes
- [ ] Checked console logs for specific error messages



