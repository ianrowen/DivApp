# Dev Build vs Production Build Redirect URI Issue

## Problem
Google OAuth works in Google Play early access build (production) but NOT in development build.

## Root Cause
`makeRedirectUri` may generate different redirect URIs for development vs production builds, especially on Android where it might use the package name (`com.divin8.app`) instead of the custom scheme (`divin8`).

## Solution

### Step 1: Check What Redirect URI Your Dev Build Is Using

When you try to sign in with the dev build, check the console logs for:
```
[Supabase] Generated dev build redirect URI: ...
```

**Copy that exact URI** - it might be different from `divin8://supabase-auth`.

### Step 2: Add ALL Possible Redirect URIs to Supabase

Go to Supabase Dashboard → Authentication → Providers → Google → Redirect URLs and add **ALL** of these:

```
divin8://supabase-auth
com.divin8.app://supabase-auth
```

**Why both?**
- `divin8://supabase-auth` - Used when the scheme is explicitly set
- `com.divin8.app://supabase-auth` - Used by Android production builds or when makeRedirectUri falls back to package name

### Step 3: Verify Production Build Redirect URI

Check what redirect URI your production build is using. You can:
1. Check the production build logs when signing in
2. Or check Supabase Auth logs to see what redirect URI was used in successful logins

### Step 4: Common Differences

**Development Build:**
- May use: `divin8://supabase-auth`
- Or: `com.divin8.app://supabase-auth` (Android)

**Production Build:**
- Usually uses: `com.divin8.app://supabase-auth` (Android)
- Or: `divin8://supabase-auth` (iOS)

### Step 5: Force Consistent Redirect URI

The code has been updated to log both possible formats. If you see a different URI in the logs, add that exact URI to Supabase.

## Quick Fix Checklist

- [ ] Check dev build console logs for exact redirect URI
- [ ] Add `divin8://supabase-auth` to Supabase Redirect URLs
- [ ] Add `com.divin8.app://supabase-auth` to Supabase Redirect URLs  
- [ ] Check production build logs to see what URI it uses
- [ ] Add any other redirect URI formats you see in logs
- [ ] Test dev build again

## Why This Happens

`expo-auth-session`'s `makeRedirectUri` function:
- Uses the `scheme` parameter when provided
- But on Android, may fall back to package name in some build configurations
- Production builds might have different signing/config that affects URI generation

The safest approach is to add **all possible redirect URI formats** to Supabase so both dev and production builds work.



