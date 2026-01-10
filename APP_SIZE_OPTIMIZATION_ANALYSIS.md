# App Size Optimization Analysis

## Current Status Summary

### ✅ Already Optimized
- **Images**: All tarot cards are in WebP format (78 cards)
- **Asset Bundle Patterns**: Well configured to exclude unnecessary files
- **Build Configuration**: Cache enabled, auto-increment configured
- **Hermes**: Enabled (reduces JS bundle size)
- **Fonts**: Only specific weights loaded (Cinzel 400/500/600, Lato 400)

### 🔍 Areas for Optimization

## 1. Card Image Loading Strategy

**Current**: All 78 tarot card images are loaded upfront via `require()` statements in `cardImageLoader.ts`

**Impact**: All card images are bundled into the app even if not immediately visible

**Optimization Options**:
- **Option A**: Keep as-is (recommended for tarot app)
  - All cards are needed for readings
  - Pre-loading ensures smooth UX
  - WebP format already minimizes size
  
- **Option B**: Lazy load card images
  - Only load cards when needed
  - Reduces initial bundle size
  - May cause loading delays during readings
  - **Estimated savings**: ~2-5 MB (if cards average 50-100KB each)

**Recommendation**: Keep current approach. The UX benefit outweighs the size cost for a tarot app.

## 2. Dependencies Analysis

### Potentially Heavy Dependencies

#### `astronomy-engine` (^2.1.19)
- **Size**: ~500KB+ (estimated)
- **Usage**: Likely used for astrological calculations
- **Optimization**: 
  - Check if entire library is needed or only specific functions
  - Consider tree-shaking if not already enabled
  - **Potential savings**: 100-300KB if partially unused

#### `react-dom` (19.1.0) & `react-native-web` (^0.21.0)
- **Size**: ~200KB+ combined
- **Usage**: Only needed for web builds
- **Optimization**: 
  - These should be excluded from mobile builds automatically by Metro
  - Verify they're not being bundled in production builds
  - **Potential savings**: 200KB+ if incorrectly bundled

#### `axios` (^1.13.2)
- **Size**: ~50KB
- **Usage**: HTTP requests
- **Optimization**: 
  - Consider using native `fetch` API (already available in React Native)
  - **Potential savings**: ~50KB
  - **Trade-off**: Need to refactor API calls

#### `date-fns` (^4.1.0) & `date-fns-tz` (^3.2.0)
- **Size**: ~100KB+ combined
- **Usage**: Date formatting and timezone handling
- **Optimization**: 
  - Use tree-shaking to import only needed functions
  - Verify imports are specific (e.g., `import { format } from 'date-fns'` not `import * from 'date-fns'`)
  - **Potential savings**: 20-50KB if not tree-shaking properly

### Dependencies to Verify

1. **`react-native-sse`** - Check if Server-Sent Events are actually used
2. **`react-native-worklets`** - Verify if worklets are needed (used by reanimated?)
3. **`i18n-js`** - Check if entire library is needed or can be optimized

## 3. Code Optimization

### Dynamic Imports
**Current**: Heavy components may be imported statically

**Optimization**: Use dynamic imports for:
- Heavy screens/components not immediately needed
- Large libraries used conditionally
- **Potential savings**: 100-500KB depending on usage

### Unused Code
- Check for unused imports
- Remove dead code paths
- **Potential savings**: Variable, but typically 50-200KB

## 4. Build Configuration Optimizations

### Android-Specific

Add to `eas.json` production profile:
```json
"android": {
  "buildType": "app-bundle",
  "autoIncrement": true,
  "gradleCommand": ":app:bundleRelease",
  "buildProperties": {
    "android.enableR8.fullMode": true,
    "android.enableProguardInReleaseBuilds": true,
    "android.enableShrinkResourcesInReleaseBuilds": true
  }
}
```

**Note**: These may already be configured in `android/app/build.gradle`, but explicit configuration ensures they're enabled.

### iOS-Specific

Add to `eas.json` production profile:
```json
"ios": {
  "autoIncrement": true,
  "buildConfiguration": "Release",
  "buildProperties": {
    "ios.deploymentTarget": "15.1"
  }
}
```

## 5. Asset Optimization

### Missing Card Images
**Issue**: Some card images referenced in code but missing from assets:
- Wands: W01-W14 (all referenced)
- Swords: S01-S03, S11-S14 (referenced but may be missing)

**Action**: Verify all card images exist, or remove references to missing cards

### App Icons
- `icon.png` - Should be optimized PNG (1024x1024 max)
- `adaptive-icon.png` - Should be optimized PNG
- `splash.png` - Should be optimized PNG
- `favicon.png` - Only needed for web

**Optimization**: Ensure icons are properly compressed PNGs, not oversized

## 6. Recommended Actions (Priority Order)

### High Priority (Easy Wins)
1. ✅ **Verify tree-shaking** for `date-fns` and `date-fns-tz`
   - Check imports are specific, not `import *`
   - **Estimated savings**: 20-50KB

2. ✅ **Check if `react-dom` and `react-native-web` are bundled**
   - Should be excluded automatically, but verify
   - **Estimated savings**: 200KB+ if incorrectly included

3. ✅ **Verify card images exist**
   - Fix missing card references
   - Prevents runtime errors

### Medium Priority (Moderate Effort)
4. ⚠️ **Consider replacing `axios` with `fetch`**
   - Refactor API calls
   - **Estimated savings**: ~50KB
   - **Effort**: Medium (need to refactor API layer)

5. ⚠️ **Audit `astronomy-engine` usage**
   - Check if entire library is needed
   - **Estimated savings**: 100-300KB if partially unused
   - **Effort**: Low-Medium (check usage patterns)

### Low Priority (Higher Effort)
6. ⚠️ **Implement dynamic imports for heavy screens**
   - Lazy load screens not immediately needed
   - **Estimated savings**: 100-500KB
   - **Effort**: High (requires refactoring)

7. ⚠️ **Consider lazy loading card images**
   - Only load cards when needed
   - **Estimated savings**: 2-5MB
   - **Effort**: High (may impact UX)

## 7. Expected Total Savings

### Conservative Estimate (Easy Wins Only)
- Tree-shaking fixes: 20-50KB
- Verify web dependencies excluded: 200KB
- **Total**: ~220-250KB reduction

### Moderate Estimate (Include Medium Priority)
- Above + axios replacement: +50KB
- Astronomy-engine optimization: +100-300KB
- **Total**: ~370-600KB reduction

### Aggressive Estimate (Include All Optimizations)
- Above + dynamic imports: +100-500KB
- Lazy card loading: +2-5MB
- **Total**: ~2.5-6MB reduction

## 8. Verification Steps

After optimizations:
1. Build production APK/AAB
2. Check size in EAS dashboard
3. Compare with previous build
4. Test app functionality to ensure nothing broke

## 9. Quick Commands

```bash
# Check bundle size (after build)
eas build:list --platform android --limit 1 --non-interactive

# Analyze bundle (requires setup)
npx react-native-bundle-visualizer

# Check for unused dependencies
npx depcheck
```

## 10. Notes

- **Current build size**: Check EAS dashboard for actual size
- **Target size**: Aim for <50MB APK, <30MB AAB (Google Play limit is 150MB)
- **WebP images**: Already optimized, no further action needed
- **Fonts**: Already optimized (only specific weights)

---

**Next Steps**: Start with High Priority items, then reassess based on actual build size.
