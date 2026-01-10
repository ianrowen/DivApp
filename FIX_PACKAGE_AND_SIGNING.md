# Fix Package Name and Signing Key Mismatch

## Problem Identified

You have **TWO issues**:

1. **Package Name Mismatch**:
   - `app.json`: `"package": "com.divin8.divin8.dev"` (DEV)
   - `android/app/build.gradle`: `applicationId 'com.divin8.app'` (PRODUCTION)
   - Building with `--profile production` but package is DEV

2. **Signing Key Mismatch**:
   - Previous builds: Local builds → Local keystore
   - Current build: EAS build → EAS-managed keystore (different!)

## Root Cause

**If you previously built locally** (using `npm run android` or `gradle assembleRelease`):
- Used `com.divin8.app` package name
- Used local keystore file
- Google Play has that keystore fingerprint registered

**Current EAS build**:
- Using `com.divin8.divin8.dev` package name (from app.json)
- Using EAS-managed keystore (different fingerprint)
- Google Play rejects it because:
  - Wrong package name, OR
  - Wrong signing key

## Solution

### Step 1: Determine What Google Play Expects

Check Google Play Console:
1. Go to: https://play.google.com/console
2. Your app → Setup → App signing
3. Note:
   - **Package name** (should be `com.divin8.app` for production)
   - **SHA1 fingerprint** (should match: `6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21`)

### Step 2: Fix Package Name

**If Google Play expects `com.divin8.app`** (production):

Update `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.divin8.app",  // Change from com.divin8.divin8.dev
      ...
    }
  }
}
```

**OR** use EAS build configuration to override:
```json
{
  "build": {
    "production": {
      "android": {
        "package": "com.divin8.app",  // Override for production builds
        "buildType": "app-bundle",
        ...
      }
    }
  }
}
```

### Step 3: Fix Signing Key

**If you built locally before**, you need your local keystore:

1. **Find your local keystore**:
   ```powershell
   # Check android/app/ directory
   Get-ChildItem android/app/*.jks, android/app/*.keystore -Recurse
   
   # Or check for release.keystore
   Get-ChildItem android/app/release.keystore
   ```

2. **Verify fingerprint matches**:
   ```powershell
   keytool -list -v -keystore android/app/release.keystore -alias your-alias
   # Should show SHA1: 6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21
   ```

3. **Upload to EAS**:
   - Go to: https://expo.dev/accounts/irowen/projects/divin8-app/credentials
   - Or run: `eas credentials --platform android --profile production`
   - Upload your local keystore file

### Step 4: Rebuild

After fixing both:
```powershell
eas build --profile production --platform android
```

## Quick Check

**Answer these questions:**

1. **What package name is in Google Play Console?**
   - `com.divin8.app` → Fix `app.json` package name
   - `com.divin8.divin8.dev` → Current is correct

2. **How did you build previous successful uploads?**
   - Local build (`npm run android` or `gradle`) → Need local keystore
   - EAS build → Need to check EAS credentials

3. **Do you have a local keystore file?**
   - Check `android/app/` directory
   - Check backups
   - If yes → Upload to EAS
   - If no → Critical problem (can't update existing app)

## Most Likely Fix

Based on your setup, you probably need to:

1. **Change package name** in `app.json` from `com.divin8.divin8.dev` to `com.divin8.app`
2. **Find and upload** your local keystore to EAS credentials

Let me know what package name Google Play expects and I'll help you fix it!
