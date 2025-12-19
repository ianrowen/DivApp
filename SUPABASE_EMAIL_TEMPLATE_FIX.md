# Fix for Gmail Pre-fetching Password Reset Links

## Problem
Gmail pre-fetches links in emails for security scanning, which consumes Supabase one-time codes before users click them, causing "otp_expired" errors.

## Solution: Modify Supabase Email Template

### Steps:
1. **Upload `reset-password-intermediate.html`** to your web server at `https://divin8.com/reset-password-intermediate.html`
2. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
3. Select **"Reset Password"** template
4. Modify the template to use the intermediate page URL (see template below)
5. **IMPORTANT**: Make sure the URL includes `.html` extension: `/reset-password-intermediate.html`

### Recommended Template:

**IMPORTANT**: Use `{{ .TokenHash }}` for the token parameter (not `{{ .ConfirmationURL }}`)

```html
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password:</p>
<p>
  <a href="{{ .SiteURL }}/reset-password-intermediate.html?token={{ .TokenHash }}" 
     style="display: inline-block; padding: 12px 24px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600;">
    Reset Password
  </a>
</p>
<p><small>This link will expire in 1 hour.</small></p>
<p><small>If the button doesn't work, copy and paste this link into your browser:</small></p>
<p style="word-break: break-all; font-size: 12px;">{{ .SiteURL }}/reset-password-intermediate.html?token={{ .TokenHash }}</p>
```

**Note**: The intermediate page (`reset-password-intermediate.html`) has been created and will redirect to the actual reset page, preventing Gmail pre-fetching from consuming the code.

### Alternative: Use JavaScript Redirect (Prevents Pre-fetching)

Create an intermediate page that uses JavaScript to redirect:

**File: `public/reset-password-intermediate.html`**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirecting...</title>
    <script>
        // Extract token from URL and redirect to actual reset page
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            // Redirect to reset page with token
            window.location.href = `https://divin8.com/reset-password.html?code=${token}`;
        } else {
            window.location.href = 'https://divin8.com/reset-password.html?error=missing_token';
        }
    </script>
</head>
<body>
    <p>Redirecting to password reset page...</p>
</body>
</html>
```

### Or: Increase Token Expiration Time

1. Go to **Supabase Dashboard** → **Project Settings** → **API**
2. Look for `GOTRUE_MAILER_OTP_EXP` setting (or similar)
3. Increase from default 3600 seconds (1 hour) to 7200 seconds (2 hours) or more

### Or: Use Magic Link Instead of Code

Consider using Supabase's magic link flow instead of password reset codes, which may be less susceptible to pre-fetching issues.

## Current Status
- ✅ Error detection is working correctly
- ✅ Error messages display properly
- ⚠️ Gmail pre-fetching consumes codes before user clicks
- 🔧 Fix requires Supabase Dashboard configuration changes

