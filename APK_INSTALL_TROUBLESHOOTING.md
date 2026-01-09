# APK Installation Troubleshooting

## Common Issues & Fixes

### 1. Signature Mismatch (Most Common)
**Problem**: You have a previous version installed with a different signature
**Fix**: 
- Uninstall the existing app completely from your phone
- Then try installing the new APK

### 2. "Install from Unknown Sources" Disabled
**Problem**: Android blocks installation from unknown sources
**Fix**:
- Go to Settings → Security → Install unknown apps
- Enable for your file manager/browser
- Or use: Settings → Apps → Special access → Install unknown apps

### 3. Architecture Mismatch
**Problem**: APK doesn't match your phone's CPU architecture
**Fix**: The EAS build should include all architectures, but if it doesn't:
- Check your phone's architecture: Settings → About phone → CPU
- Rebuild with specific architecture if needed

### 4. Conflicting Package Name
**Problem**: Another app with same package name is installed
**Fix**: Uninstall any conflicting apps first

## Better Option: Use Google Play Internal Testing

Since your build is already configured for "internal" distribution, you can upload it to Google Play Console's internal testing track. This is actually **easier and more reliable** than direct APK installation.

### Steps:

1. **Build for Production** (uses same signing as Play Store):
   ```bash
   eas build --profile production --platform android
   ```

2. **Submit to Google Play Console**:
   ```bash
   eas submit --platform android --profile production
   ```

3. **Or manually upload**:
   - Go to Google Play Console → Your App → Testing → Internal testing
   - Upload the APK/AAB from the build
   - Add yourself as a tester
   - Download from Play Store (much easier!)

### Benefits:
- ✅ No "unknown sources" issues
- ✅ Automatic updates via Play Store
- ✅ Proper signing and verification
- ✅ Easy to share with testers
- ✅ Better for testing production-like builds

## Quick Fix: Try Uninstalling First

Before uploading to Play Store, try this:

1. **Uninstall existing app** from your phone completely
2. **Enable "Install from unknown sources"** in Settings
3. **Download APK** from EAS build page
4. **Install APK** directly

If that still doesn't work, the Google Play internal testing track is your best bet!



