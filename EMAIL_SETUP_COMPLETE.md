# Email Setup Complete Guide

## Files Created

1. **`public/reset-password.html`** - Password reset redirect page
2. **`public/confirm-signup.html`** - Signup confirmation redirect page
3. **`app/reset-password.tsx`** - Password reset screen in app
4. **`app/supabase-auth.tsx`** - Updated to handle email confirmation

## Setup Checklist

### 1. Deploy HTML Files to Your Website

Upload both HTML files to your website:
- `https://divin8.com/reset-password.html`
- `https://divin8.com/confirm-signup.html`

Make sure both files are publicly accessible.

### 2. Configure Supabase Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   https://divin8.com/reset-password.html
   https://divin8.com/confirm-signup.html
   ```

### 3. Configure Supabase Email Settings

#### Option A: Disable Email Confirmation (Recommended for Beta Testing)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. Turn it **OFF**
4. Users will be able to sign in immediately after signup

#### Option B: Enable Email Confirmation (Recommended for Production)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. Turn it **ON**
4. Configure SMTP (you already have this set up for password reset):
   - Go to **Authentication** → **Settings** → **SMTP Settings**
   - Make sure your SMTP is configured (support@divin8.com)
   - Test that emails are being sent

### 4. Configure Email Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Check these templates exist and are configured:
   - **Confirm signup** - Should redirect to `https://divin8.com/confirm-signup.html`
   - **Reset password** - Should redirect to `https://divin8.com/reset-password.html`

### 5. Test the Flow

#### Test Signup:
1. Sign up with a new email
2. If email confirmation is **disabled**: You should be signed in immediately
3. If email confirmation is **enabled**: 
   - Check email for confirmation link
   - Click link → Opens `confirm-signup.html`
   - Website redirects to `divin8://auth/callback`
   - App opens and confirms account
   - User is signed in

#### Test Password Reset:
1. Click "Forgot Password" on login screen
2. Enter email address
3. Check email for reset link
4. Click link → Opens `reset-password.html`
5. Website redirects to `divin8://reset-password`
6. App opens password reset screen
7. Enter new password and submit

## Troubleshooting

### Emails Not Being Sent

1. **Check SMTP Configuration:**
   - Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
   - Verify SMTP is enabled and credentials are correct
   - Test SMTP connection

2. **Check Email Templates:**
   - Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
   - Make sure templates exist and are enabled
   - Check that redirect URLs are correct

3. **Check Email Logs:**
   - Go to **Supabase Dashboard** → **Authentication** → **Logs**
   - Look for email sending errors
   - Check for rate limiting or SMTP errors

4. **Check Spam Folder:**
   - Emails might be going to spam
   - Check spam/junk folder
   - Add support@divin8.com to contacts

### Deep Links Not Opening App

1. **Test Deep Link Manually:**
   ```bash
   # Android
   adb shell am start -W -a android.intent.action.VIEW -d "divin8://auth/callback?access_token=test&type=signup"
   
   # iOS (use Safari)
   # Open: divin8://auth/callback?access_token=test&type=signup
   ```

2. **Check App Configuration:**
   - Verify `app.json` has `"scheme": "divin8"`
   - Check AndroidManifest.xml has intent filter
   - Check iOS Info.plist has URL scheme

3. **Check HTML Redirect:**
   - Open browser console on `confirm-signup.html`
   - Check for JavaScript errors
   - Verify deep link URL is being constructed correctly

### User Can't Sign In After Signup

1. **If email confirmation is disabled:**
   - User should be signed in immediately
   - If not, check console logs for errors
   - Verify user was created in Supabase Dashboard → Authentication → Users

2. **If email confirmation is enabled:**
   - User must click confirmation link in email
   - Check if email was sent (see Email Logs)
   - User can request a new confirmation email if needed

## Quick Fix: Disable Email Confirmation for Beta

If you want users to sign in immediately without email confirmation:

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. Turn **OFF** "Enable email confirmations"
3. Save changes
4. New signups will be auto-confirmed and can sign in immediately

This is recommended for beta testing to avoid email delivery issues.





