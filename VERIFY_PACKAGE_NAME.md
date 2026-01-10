# How to Verify Production Package Name

## Step-by-Step Instructions

### Option 1: Google Play Console (Recommended)

1. **Go to Google Play Console**:
   - https://play.google.com/console
   - Sign in with your Google account

2. **Select Your App**:
   - Click on your app (should be "Divin8" or similar)

3. **Navigate to App Info**:
   - Left sidebar → **Setup** → **App information**
   - OR: **Policy** → **App content** → Look for package name

4. **Find Package Name**:
   - Look for **"App package name"** or **"Package name"**
   - Should show something like: `com.divin8.app` or `com.divin8.divin8.dev`

### Option 2: App Signing Page

1. **Go to App Signing**:
   - Left sidebar → **Setup** → **App signing**

2. **Check Package Name**:
   - The package name is usually displayed at the top
   - Also check the **SHA1 fingerprint** shown there
   - Expected fingerprint: `6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21`

### Option 3: Release Dashboard

1. **Go to Release**:
   - Left sidebar → **Release** → **Production** (or **Testing**)

2. **Check Active Release**:
   - Look at any active release
   - Package name is usually shown in the release details

## What to Look For

**Expected values:**
- ✅ **Production package**: `com.divin8.app`
- ✅ **Dev package**: `com.divin8.divin8.dev`

**If you see:**
- `com.divin8.app` → Your `eas.json` production profile is correct ✅
- `com.divin8.divin8.dev` → You need to change production profile to `com.divin8.app` ❌
- Something else → Check what it is and update accordingly

## Quick Visual Guide

```
Google Play Console
├── Your App (Divin8)
    ├── Setup
    │   ├── App information ← Package name here
    │   └── App signing ← Also shows package name + fingerprint
    └── Release
        └── Production ← May show package name
```

## After Verification

Once you confirm the package name:

1. **If it matches** (`com.divin8.app`):
   - ✅ Your `eas.json` is correct
   - Proceed to upload the correct keystore

2. **If it doesn't match**:
   - Update `eas.json` production profile to match what Google Play shows
   - Or update Google Play Console (if you have access)

## Need Help?

If you can't find it, try:
- Searching for "package" in Google Play Console
- Checking the URL - sometimes it shows in the browser address bar
- Looking at any error messages from previous uploads (they often show expected package name)
