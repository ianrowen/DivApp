# Development Build Commands

## Quick Reference

**Build development app:**
```powershell
npm run build:android:development
```

**Or use EAS directly:**
```powershell
eas build --platform android --profile development
```

## All Development Build Commands

**Android:**
```powershell
npm run build:android:development
```

**iOS:**
```powershell
npm run build:ios:development
```

**Both platforms:**
```powershell
npm run build:all:development
```

## What Gets Built

- **Package name**: `com.divin8.divin8.dev`
- **App name**: "Divin8 Dev"
- **Distribution**: Internal testing
- **Development client**: Enabled (for hot reload, etc.)

## Comparison: Dev vs Production

| Feature | Development | Production |
|---------|------------|------------|
| Package | `com.divin8.divin8.dev` | `com.divin8.app` |
| Name | "Divin8 Dev" | "Divin8" |
| Auto-submit | ❌ No | ✅ Yes (Google Play) |
| Dev client | ✅ Yes | ❌ No |

## Notes

- Development builds use the **development client** (Expo Go alternative)
- Can be installed alongside production app (different package names)
- Useful for testing without affecting production users
- No auto-submit - you manually install the APK/AAB
