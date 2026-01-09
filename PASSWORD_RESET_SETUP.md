# Password Reset Setup Guide

## Overview
This guide explains how to set up password reset functionality with deep linking from email to your Divin8 app.

## Files Created

1. **`app/reset-password.tsx`** - App route that handles password reset deep links
2. **`public/reset-password.html`** - Web page that redirects email links to the app

## Setup Steps

### 1. Deploy HTML File to Your Website

Upload `public/reset-password.html` to your website at:
- **URL**: `https://divin8.com/reset-password.html` (or your domain)
- Make sure the file is publicly accessible

### 2. Update Supabase Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your website URL to **Redirect URLs**:
   ```
   https://divin8.com/reset-password.html
   ```

### 3. Update App Code (Already Done)

The app code has been updated to use:
```typescript
const resetUrl = 'https://divin8.com/reset-password.html';
```

**Important**: Update this URL in `src/features/auth/screens/LoginScreen.tsx` if your domain is different!

### 4. Test the Flow

1. Request password reset from the app
2. Check email for reset link
3. Click link - should open `reset-password.html` on your website
4. Website should automatically redirect to `divin8://reset-password?access_token=...`
5. App should open and show password reset screen
6. User enters new password and submits
7. Password is updated and user is redirected to login

## How It Works

1. **User requests password reset** → Supabase sends email with link to `https://divin8.com/reset-password.html?access_token=...&type=recovery`

2. **User clicks email link** → Opens `reset-password.html` in browser

3. **HTML page extracts token** → Reads `access_token` and `type` from URL parameters

4. **HTML redirects to app** → Creates deep link `divin8://reset-password?access_token=...&type=recovery`

5. **App opens** → `app/reset-password.tsx` route handles the deep link

6. **App sets session** → Uses the recovery token to establish a temporary session

7. **User resets password** → Calls `supabase.auth.updateUser({ password })`

8. **Redirect to login** → User can now sign in with new password

## Troubleshooting

### Deep link not opening app
- Check that `divin8://` scheme is registered in `app.json`
- Verify AndroidManifest.xml has intent filter for `divin8://`
- Test deep link manually: `adb shell am start -W -a android.intent.action.VIEW -d "divin8://reset-password?access_token=test&type=recovery"`

### Token expired error
- Password reset tokens expire after 1 hour (default)
- User needs to request a new reset link

### HTML page not redirecting
- Check browser console for JavaScript errors
- Verify URL parameters are being read correctly
- Test deep link URL format manually

### App route not found
- Verify `app/reset-password.tsx` exists
- Check that route is registered in `app/_layout.tsx`
- Restart Expo dev server

## Security Notes

- Password reset tokens are single-use and expire after 1 hour
- The HTML page doesn't store or log tokens
- All password updates go through Supabase's secure API
- Deep links are handled securely by the app







