# Build Profiles Setup - Production vs Dev

## Configuration Complete ✅

Your `eas.json` is now configured to automatically use the correct package name based on the build profile:

- **Development builds**: `com.divin8.divin8.dev`
- **Production builds**: `com.divin8.app`

## How to Use

### Build for Development
```powershell
eas build --profile development --platform android
```
Uses: `com.divin8.divin8.dev`

### Build for Production
```powershell
eas build --profile production --platform android
```
Uses: `com.divin8.app`

## What Changed

1. **`eas.json`** - Added `"package"` override in both profiles:
   - `development` profile → `"package": "com.divin8.divin8.dev"`
   - `production` profile → `"package": "com.divin8.app"`

2. **`app.json`** - Kept as default (dev package), but production builds override it

## Benefits

✅ No need to edit `app.json` manually  
✅ Automatic package name selection based on profile  
✅ Less chance of mistakes  
✅ Clear separation between dev and production builds  

## Next Steps

1. **Verify production package name** matches Google Play Console
2. **Upload correct keystore** to EAS credentials for production
3. **Build production** with: `eas build --profile production --platform android`
