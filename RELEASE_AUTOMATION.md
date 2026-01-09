# Release Automation Guide

## Overview

This guide explains how to automate iOS and Android releases with EAS Build and Submit.

## Current Configuration

### ✅ Automatic Version Incrementing
- **iOS**: `autoIncrement: true` in production profile
- **Android**: `autoIncrement: true` in production profile
- Build numbers increment automatically on each build
- Version numbers managed via `package.json` and synced to `app.json`

### ✅ Build Profiles
- **production**: Release builds for app stores
- **preview**: Internal testing builds (APK)
- **development**: Development client builds
- **simulator**: iOS simulator builds (doesn't use EAS quota)

### ✅ Submit Configuration
- **iOS**: Configured with Apple ID, ASC App ID, Team ID
- **Android**: Configured with service account, internal track

## Release Workflows

### Option 1: Build + Submit Separately (Recommended for First Release)

**Build:**
```bash
# Build iOS
npm run build:ios:production

# Build Android
npm run build:android:production

# Build both
npm run build:all:production
```

**Submit (after testing):**
```bash
# Submit iOS to App Store
npm run submit:ios

# Submit Android to Google Play
npm run submit:android

# Submit both
npm run submit:all
```

### Option 2: Build + Auto-Submit (Automated Release)

**One-command release:**
```bash
# iOS only
npm run release:ios

# Android only
npm run release:android

# Both platforms
npm run release:all
```

**What happens:**
1. Builds the app
2. Automatically submits to app stores after successful build
3. No manual intervention needed

**⚠️ Warning**: Auto-submit submits immediately after build. Only use when you're confident the build is ready!

## Version Management

### Update Version Before Release

**Patch version (1.0.0 → 1.0.1):**
```bash
npm run version:bump:patch
```

**Minor version (1.0.0 → 1.1.0):**
```bash
npm run version:bump:minor
```

**Major version (1.0.0 → 2.0.0):**
```bash
npm run version:bump:major
```

**What happens:**
- Updates `package.json` version
- Syncs version to `app.json`
- Build numbers auto-increment (handled by EAS)

### Manual Version Update

Edit `package.json`:
```json
{
  "version": "1.0.1"
}
```

Then run:
```bash
node scripts/update-app-version.js
```

## Complete Release Workflow

### Recommended Workflow (Safe)

1. **Update version:**
   ```bash
   npm run version:bump:patch
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git push
   ```

3. **Build for testing:**
   ```bash
   npm run build:all:production
   ```

4. **Test builds** (download from EAS dashboard)

5. **Submit after testing:**
   ```bash
   npm run submit:all
   ```

### Automated Workflow (Fast)

1. **Update version:**
   ```bash
   npm run version:bump:patch
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git push
   ```

3. **Build and auto-submit:**
   ```bash
   npm run release:all
   ```

## EAS Update (OTA Updates)

### Configuration
- **Production channel**: `production`
- **Preview channel**: `preview`

### Publish Updates (No App Store Review)

```bash
# Publish to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to preview
eas update --branch preview --message "Preview update"
```

### When to Use EAS Update vs New Build

**Use EAS Update for:**
- JavaScript/TypeScript code changes
- Asset updates (images, fonts)
- Bug fixes
- UI improvements
- No native code changes

**Use New Build for:**
- Native code changes
- New native dependencies
- iOS/Android SDK updates
- App Store metadata changes
- Version number changes

## Environment Variables

### Production Builds
- Set via EAS Secrets (recommended for sensitive keys)
- Set in `eas.json` env blocks (for non-sensitive config)
- Available at build time

### Current Setup
- `EXPO_PUBLIC_SUPABASE_URL` ✅ (in eas.json)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` ✅ (in eas.json)
- `EXPO_PUBLIC_GEMINI_API_KEY` ✅ (via EAS Secrets)

## App Store Configuration

### iOS (App Store Connect)
- **Apple ID**: `irowen@gmail.com`
- **ASC App ID**: `6756152597`
- **Team ID**: `WYP8PZFD4J`
- **Track**: Production (default)

### Android (Google Play)
- **Service Account**: `./google-service-account.json`
- **Track**: Internal (can change to `production`, `beta`, `alpha`)
- **Release Status**: Completed (auto-releases)

## Track Configuration

### Android Tracks

**Internal** (current):
- Fastest review
- Limited to 100 testers
- Good for initial testing

**Alpha/Beta**:
- More testers
- Longer review time
- Good for beta testing

**Production**:
- Public release
- Full review process
- Use for public releases

**To change track**, edit `eas.json`:
```json
"android": {
  "track": "production"  // or "beta", "alpha", "internal"
}
```

## Monitoring Releases

### Check Build Status
```bash
eas build:list
```

### Check Submission Status
```bash
eas submit:list
```

### View in Dashboard
- [EAS Dashboard](https://expo.dev)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

## Troubleshooting

### Build Fails
- Check EAS dashboard for error logs
- Verify environment variables are set
- Check git repository is up to date

### Submit Fails
- Verify credentials are correct
- Check app store status
- Ensure previous version is approved (iOS)

### Version Conflicts
- Ensure `package.json` and `app.json` versions match
- Run `node scripts/update-app-version.js` to sync

## Best Practices

1. ✅ **Always test before submitting**
2. ✅ **Use preview builds for internal testing**
3. ✅ **Increment version before release**
4. ✅ **Commit version changes to git**
5. ✅ **Use EAS Update for quick fixes**
6. ✅ **Monitor build/submit status**
7. ✅ **Keep credentials secure**

## Quick Reference

```bash
# Version management
npm run version:bump:patch    # 1.0.0 → 1.0.1
npm run version:bump:minor    # 1.0.0 → 1.1.0
npm run version:bump:major    # 1.0.0 → 2.0.0

# Build only
npm run build:ios:production
npm run build:android:production
npm run build:all:production

# Submit only (after build)
npm run submit:ios
npm run submit:android
npm run submit:all

# Build + Auto-submit
npm run release:ios
npm run release:android
npm run release:all

# OTA Updates
eas update --branch production --message "Update message"
```



