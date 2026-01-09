# Supabase Email Configuration Guide

## Password Reset Emails Not Sending

If password reset emails are not being sent, you need to configure Supabase email settings:

### Option 1: Use Supabase Default Email Service (Recommended for Development)

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Make sure email templates are enabled
3. Check that the **Reset Password** template exists and is properly configured
4. Go to **Authentication** → **Settings** → **SMTP Settings**
5. If SMTP is not configured, Supabase will use their default email service (may have rate limits)

### Option 2: Configure Custom SMTP (Recommended for Production)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Enable Custom SMTP**
3. Configure your SMTP provider:
   - **Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
   - **Port**: Usually 587 for TLS or 465 for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: The email address that will send the emails
   - **Sender name**: Display name for emails

### Common SMTP Providers

**Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: App-specific password (not your regular password)

**SendGrid:**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key

**Mailgun:**
- Host: `smtp.mailgun.org`
- Port: `587`
- Username: Your Mailgun SMTP username
- Password: Your Mailgun SMTP password

### Email Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Customize the **Reset Password** template if needed
3. Make sure the redirect URL in the template matches your app's deep link: `divin8://reset-password`

### Testing

After configuration:
1. Try the "Forgot Password" flow in your app
2. Check your email (including spam folder)
3. Check Supabase Dashboard → **Authentication** → **Logs** for email sending errors

### Troubleshooting

- **Emails not sending**: Check SMTP settings and credentials
- **Emails going to spam**: Configure SPF/DKIM records for your domain
- **Rate limits**: Supabase default email service has rate limits; use custom SMTP for production
- **Redirect URL not working**: Make sure your app's deep link handler is configured correctly







