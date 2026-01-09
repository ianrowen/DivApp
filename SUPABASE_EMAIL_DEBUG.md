# Supabase Email Debugging - No Email Sent After user_recovery_requested

## Problem
- Log shows `user_recovery_requested` ✅
- But NO `email_sent` event ❌
- SMTP is configured correctly ✅
- Redirect URL is in allowed list ✅

## What to Check in Supabase Dashboard

### 1. Check Email Template Status
Go to **Authentication → Email Templates**

- Find **"Reset Password"** template
- Check if it's **ENABLED** (there might be a toggle/switch)
- Check if template content is valid
- Look for any error messages or warnings

### 2. Check SMTP Test
Go to **Authentication → Settings → SMTP Settings**

- Click **"Test SMTP"** or **"Send Test Email"** button
- Does the test email send successfully?
- If test fails, check error message

### 3. Check for Email Sending Errors
Go to **Authentication → Logs**

- Filter for events around the time you requested password reset
- Look for:
  - `email_failed`
  - `email_send_error`
  - `smtp_error`
  - `template_error`
  - Any error messages

### 4. Check Rate Limits
- Supabase has rate limits on email sending
- Check if you've exceeded daily/monthly limits
- Look in **Authentication → Settings** for rate limit info

### 5. Check Email Template Content
Go to **Authentication → Email Templates → Reset Password**

- Make sure the template includes: `{{ .ConfirmationURL }}` or `{{.ConfirmationURL}}`
- Check for any syntax errors
- Verify the redirect URL in the template matches: `https://divin8.com/reset-password.html`

### 6. Check Site URL Configuration
Go to **Authentication → URL Configuration**

- Verify **Site URL** is set correctly
- Check **Redirect URLs** includes: `https://divin8.com/reset-password.html`
- Make sure there are no typos

### 7. Check SMTP Credentials
Even though SMTP worked before, credentials might have:
- Expired (especially Gmail app passwords)
- Been changed
- Been revoked

Try sending a test email from SMTP settings to verify.

### 8. Check Email Provider Limits
- Gmail: Check if account has sending limits
- Check if emails are being blocked by provider
- Check spam/security settings on email account

## Quick Test

Try this in Supabase Dashboard:
1. Go to **Authentication → Users**
2. Find the user who requested password reset
3. Click on the user
4. Look for **"Send password reset email"** button
5. Click it manually
6. Check if email is sent
7. Check logs for `email_sent` event

## If Still Not Working

1. **Try a different redirect URL temporarily:**
   - Change code to use: `divin8://reset-password` (deep link)
   - Add that to allowed redirect URLs
   - Test if emails send

2. **Check Supabase Status:**
   - https://status.supabase.com
   - See if there are any email service issues

3. **Contact Supabase Support:**
   - If SMTP test works but password reset emails don't send
   - This might be a Supabase bug

## Code Check

The code is correct - it's calling `resetPasswordForEmail` with the right parameters. The issue is in Supabase configuration, not the code.







