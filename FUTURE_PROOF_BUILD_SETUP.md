# Future-Proof Build Setup ✅

## What's Configured

Your setup now automatically handles **both dev and production builds**:

### Development Builds
```powershell
npm run build:android:development
# or
eas build --profile development --platform android
```
- **Package**: `com.divin8.divin8.dev`
- **Name**: "Divin8 Dev"
- **Distribution**: Internal testing

### Production Builds
```powershell
npm run build:android:production
# or
eas build --profile production --platform android --auto-submit
```
- **Package**: `com.divin8.app`
- **Name**: "Divin8"
- **Distribution**: Google Play Store (alpha track)
- **Auto-submit**: Enabled

## How It Works

**`app.config.js`** dynamically sets the package name based on `EAS_BUILD_PROFILE`:
- `development` → `com.divin8.divin8.dev`
- `production` → `com.divin8.app`
- Any other profile → `com.divin8.app` (defaults to production)

## Benefits

✅ **No manual editing** - Package name changes automatically  
✅ **Future-proof** - Works for any new build profiles you add  
✅ **Type-safe** - Uses JavaScript instead of static JSON  
✅ **Consistent** - Same npm scripts work for both profiles  

## Available Commands

**Development:**
```powershell
npm run build:android:development
npm run build:ios:development
npm run build:all:development
```

**Production:**
```powershell
npm run build:android:production  # Auto-submits to Google Play
npm run build:ios:production
npm run build:all:production
```

**Manual submit (if needed):**
```powershell
npm run submit:android
npm run submit:ios
npm run submit:all
```

## Adding New Build Profiles

If you add a new profile to `eas.json`, `app.config.js` will default to production package name. To customize:

```javascript
// In app.config.js
const profile = process.env.EAS_BUILD_PROFILE;
const packageName = 
  profile === 'development' ? 'com.divin8.divin8.dev' :
  profile === 'staging' ? 'com.divin8.staging' :
  'com.divin8.app'; // default to production
```

## Migration Notes

- ✅ `app.json` is now replaced by `app.config.js`
- ✅ EAS automatically uses `app.config.js` if it exists
- ✅ All existing builds will continue to work
- ✅ No changes needed to your build commands
