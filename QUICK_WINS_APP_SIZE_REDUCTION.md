# Quick Wins: App Size Reduction

## 🎯 Immediate Actions (High Impact, Low Effort)

### 1. Remove Unused Dependencies ⚠️ **HIGH PRIORITY**

#### `astronomy-engine` (^2.1.19) - **NOT USED**
- **Status**: Listed in package.json but never imported or used
- **Size**: ~500KB+ (estimated)
- **Action**: Remove from dependencies
- **Savings**: ~500KB+

```bash
npm uninstall astronomy-engine
```

#### `date-fns` (^4.1.0) & `date-fns-tz` (^3.2.0) - **NOT USED**
- **Status**: Listed in package.json but never imported
- **Size**: ~100KB+ combined (estimated)
- **Action**: Remove from dependencies
- **Savings**: ~100KB+

```bash
npm uninstall date-fns date-fns-tz
```

**Note**: All date formatting in the codebase uses native JavaScript `Date` methods, so these libraries are unnecessary.

### 2. Replace `axios` with Native `fetch` ⚠️ **MEDIUM PRIORITY**

#### Current Usage
- **File**: `src/services/astrologyService.ts`
- **Usage**: Single API call to RapidAPI
- **Size**: ~50KB

#### Action: Replace with native `fetch`
- **Savings**: ~50KB
- **Effort**: Low (single file, one function)

**Code Change Needed**:
```typescript
// Current (line 178):
const response = await axios.post(
  `https://${RAPIDAPI_HOST}/api/v3/charts/natal`,
  requestData,
  {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  }
);

// Replace with:
const response = await fetch(
  `https://${RAPIDAPI_HOST}/api/v3/charts/natal`,
  {
    method: 'POST',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(10000)
  }
);

if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}

const data = await response.json();
```

Then remove axios import and uninstall:
```bash
npm uninstall axios
```

## 📊 Expected Total Savings

### Conservative Estimate (Remove unused dependencies only)
- `astronomy-engine`: ~500KB
- `date-fns` + `date-fns-tz`: ~100KB
- **Total**: ~600KB reduction

### With axios replacement
- Above + `axios`: ~50KB
- **Total**: ~650KB reduction

## ✅ Verification Steps

After making changes:

1. **Remove dependencies**:
   ```bash
   npm uninstall astronomy-engine date-fns date-fns-tz axios
   ```

2. **Update code** (if replacing axios):
   - Edit `src/services/astrologyService.ts`
   - Replace axios.post with fetch
   - Remove axios import

3. **Test the app**:
   ```bash
   npm start
   ```
   - Verify astrology service still works
   - Check all date formatting still works
   - Test all features

4. **Rebuild**:
   ```bash
   npm run build:android:production
   ```

5. **Check size**:
   - Compare new build size with previous build in EAS dashboard
   - Expected reduction: ~600-650KB

## 🚨 Important Notes

- **`astronomy-engine`**: Comment in `ProfileScreen.tsx` mentions it, but it's never actually imported or used. Safe to remove.

- **`date-fns`**: All date formatting uses native JavaScript:
  - `ProfileScreen.tsx`: Custom `formatDate()` function
  - `HistoryScreen.tsx`: Custom `formatDate()` function  
  - `AnalysisScreen.tsx`: Custom `formatDate()` function
  - `reading.tsx`: Custom `formatReadingDate()` function

- **`axios`**: Only used in one place (`astrologyService.ts`). Easy to replace with native `fetch`.

## 📝 Additional Optimizations (Lower Priority)

These are already covered in `APP_SIZE_OPTIMIZATION_ANALYSIS.md`:
- Verify `react-dom` and `react-native-web` aren't bundled in mobile builds
- Check for other unused dependencies
- Consider dynamic imports for heavy screens

---

**Next Step**: Execute the dependency removals and axios replacement, then rebuild to verify size reduction.
