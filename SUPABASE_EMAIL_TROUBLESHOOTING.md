# Supabase Email Troubleshooting Guide

## Password Reset Emails Not Sending

If password reset emails are not being sent, follow these steps:

### Step 1: Check Supabase Email Logs

1. Go to **Supabase Dashboard** → **Authentication** → **Logs**
2. Look for entries related to password reset requests
3. Check for any error messages
4. Common errors:
   - "SMTP not configured"
   - "Email sending failed"
   - "Rate limit exceeded"
   - "Invalid SMTP credentials"

### Step 2: Verify SMTP Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Check if **"Enable Custom SMTP"** is turned ON
3. Verify all SMTP fields are filled:
   - **Host**: e.g., `smtp.gmail.com` or your SMTP server
   - **Port**: Usually `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password/app password
   - **Sender email**: The email address that will send emails (e.g., `support@divin8.com`)
   - **Sender name**: Display name (e.g., "Divin8")

4. **Test SMTP Connection:**
   - Click "Test SMTP" or "Send test email" if available
   - Check if test email is received

### Step 3: Check Email Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Find **"Reset Password"** template
3. Make sure it's **enabled**
4. Check the template content - it should include:
   ```
   {{ .ConfirmationURL }}
   ```
5. Verify the redirect URL in the template matches your setup

### Step 4: Check Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, make sure these are added:
   ```
   https://divin8.com/reset-password.html
   https://divin8.com/confirm-signup.html
   ```
3. Also add your app's deep link scheme (if needed):
   ```
   divin8://reset-password
   divin8://auth/callback
   ```

### Step 5: Common SMTP Issues

#### Gmail SMTP
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Username**: Your full Gmail address
- **Password**: **App-specific password** (NOT your regular password)
  - Go to Google Account → Security → 2-Step Verification → App passwords
  - Generate an app password for "Mail"
  - Use that 16-character password

#### SendGrid SMTP
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey` (literally the word "apikey")
- **Password**: Your SendGrid API key

#### Custom SMTP Server
- Make sure your SMTP server allows connections from Supabase's IPs
- Check firewall rules
- Verify TLS/SSL settings match your server configuration

### Step 6: Check Rate Limits

- Supabase default email service has rate limits
- Custom SMTP usually has higher limits
- Check if you've exceeded daily/monthly email limits

### Step 7: Verify Email Address

- Make sure the email address you're testing with is valid
- Check for typos
- Some email providers block automated emails - try a different email provider

### Step 8: Check Spam Folder

- Even if configured correctly, emails might go to spam
- Check spam/junk folder
- Add `support@divin8.com` to contacts/whitelist

### Step 9: Test with Supabase API Directly

You can test if Supabase is configured correctly by checking the API response:

```javascript
// In browser console on your website or in app
const response = await fetch('https://YOUR_PROJECT.supabase.co/auth/v1/recover', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    email: 'test@example.com'
  })
});
console.log(await response.json());
```

### Step 10: Alternative Solution - Manual Password Reset

If emails continue to fail, you can implement a manual password reset flow:
1. User requests reset
2. Admin receives notification
3. Admin manually resets password or sends reset link
4. User receives password via secure channel

## Quick Fix: Disable Email Confirmation

For beta testing, you can disable email requirements:

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. Turn **OFF** "Enable email confirmations"
3. Turn **OFF** "Enable email change confirmations" (if exists)
4. Save changes

This allows users to sign up and sign in without email verification.

## Still Not Working?

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Project Logs**: Supabase Dashboard → Logs → API Logs
3. **Contact Supabase Support**: If SMTP is configured correctly but emails still don't send
4. **Try Different SMTP Provider**: Switch to SendGrid, Mailgun, or another provider

## Testing Checklist

- [ ] SMTP is enabled and configured
- [ ] SMTP credentials are correct
- [ ] Test email was sent successfully
- [ ] Email templates are enabled
- [ ] Redirect URLs are configured
- [ ] Checked spam folder
- [ ] Checked Supabase logs for errors
- [ ] Verified email address is valid
- [ ] Not hitting rate limits







