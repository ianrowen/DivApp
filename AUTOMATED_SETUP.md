# Automated Production Build Setup

## Quick Start

I've created automated scripts to handle everything. Here's how to use them:

## Option 1: Full Automated Setup (Recommended)

```powershell
npm run setup:production
```

This script will:
1. ✅ Check EAS credentials
2. ✅ Search for keystore files
3. ✅ Guide you through keystore upload (if needed)
4. ✅ Verify package name configuration
5. ✅ Build and auto-submit to Google Play

## Option 2: Find Keystore First

```powershell
npm run find:keystore
```

This searches for keystore files and helps verify fingerprints.

## Option 3: Manual Steps

### Step 1: Check if EAS Already Has Credentials

```powershell
eas credentials --platform android --profile production
```

If credentials exist, skip to Step 3.

### Step 2: Upload Keystore (if needed)

If you have the keystore file:

```powershell
eas credentials --platform android --profile production
```

Then follow prompts to upload your keystore.

**If you don't have the keystore:**
- Check backups (Google Drive, Dropbox, password manager)
- Check old project folders
- ⚠️ **Critical**: Without the original keystore, you cannot update the existing app

### Step 3: Build and Submit

```powershell
npm run build:android:production
```

This automatically:
- Builds with correct package name (`com.divin8.app`)
- Signs with correct keystore (from EAS)
- Submits to Google Play (alpha track)

## What's Already Configured

✅ **Package name**: Production uses `com.divin8.app` (from `eas.json`)  
✅ **Auto-submit**: Enabled via `--auto-submit` flag  
✅ **Submit track**: Configured for "alpha" track  
✅ **Version code**: Set to 12 in `app.json`  

## Next Steps

1. **Run the automated setup:**
   ```powershell
   npm run setup:production
   ```

2. **Or if you know EAS has credentials, just build:**
   ```powershell
   npm run build:android:production
   ```

3. **Monitor progress:**
   - Builds: https://expo.dev/accounts/irowen/projects/divin8-app/builds
   - Submissions: https://expo.dev/accounts/irowen/projects/divin8-app/submissions
   - Google Play: https://play.google.com/console

## Troubleshooting

**"No credentials found"**
- Run `npm run find:keystore` to locate keystore
- Upload it with `eas credentials --platform android --profile production`

**"Wrong signing key"**
- Make sure you uploaded the correct keystore
- Verify fingerprint matches: `6D:5F:A2:7E:20:5D:2A:07:51:63:E8:4B:78:58:18:0F:F9:A9:C7:21`

**"Package name mismatch"**
- Already fixed in `eas.json` - production uses `com.divin8.app`
- Just rebuild with `npm run build:android:production`
