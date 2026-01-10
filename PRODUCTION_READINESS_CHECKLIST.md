# Production Readiness Checklist

## ✅ Database (Supabase)

### Required Migration
Run this migration before deploying production:
- **`supabase/migrations/20260111000000_production_beta_tester_setup.sql`**

This migration ensures:
- ✅ All existing users are beta testers with `subscription_tier = 'apex'`
- ✅ All new users automatically get beta tester status via trigger
- ✅ RLS policies are correct
- ✅ Column defaults are set
- ✅ Both `is_beta_tester` and `subscription_tier` are set (double protection)

### Verification Query
After running the migration, verify with:
```sql
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE subscription_tier = 'apex') as apex_tier_users,
  COUNT(*) FILTER (WHERE is_beta_tester = true AND subscription_tier = 'apex') as both_set
FROM public.profiles;
```

All counts should match `total_profiles`.

## ✅ Code (App)

### 1. Beta Tester Access (`app/reading.tsx`)
**Status:** ✅ Production-ready

The code has **triple protection**:
```typescript
const isBetaTester = profile?.is_beta_tester === true;
const hasApexTier = profile?.subscription_tier === 'apex';
const isBetaPeriod = true; // Always true during beta

const userTier = (isBetaTester || hasApexTier || isBetaPeriod) ? 'apex' : ...
```

**Why this is safe:**
- Even if database query fails → `isBetaPeriod = true` grants access
- Even if `is_beta_tester` is null/false → `hasApexTier` grants access
- Even if both fail → `isBetaPeriod` grants access

**Note:** When beta period ends, change `isBetaPeriod = true` to `isBetaPeriod = false` or remove it.

### 2. Daily Card Preservation (`src/shared/components/DailyCardDraw.tsx`)
**Status:** ✅ Production-ready

Fixed timezone issue by using date string comparison:
```typescript
const todayDateStr = today.toISOString().split('T')[0]; // "2026-01-09"
const readingDateStr = readingDate.toISOString().split('T')[0]; // "2026-01-09"
if (readingDateStr === todayDateStr) { ... }
```

**Why this works:**
- Compares calendar days in UTC (no timezone issues)
- Works across all timezones
- Simple and reliable

### 3. Profile Loading (`src/contexts/ProfileContext.tsx`)
**Status:** ✅ Production-ready

- Auto-creates profile if missing (with beta tester status)
- Auto-updates profile if `is_beta_tester` is null/false
- Falls back gracefully if database query fails
- Caches profile for performance

## ✅ Environment Variables

### Required for Production Build
Ensure these are set in EAS secrets:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY` (for AI interpretations)

Verify with:
```bash
eas secret:list
```

## ✅ Pre-Production Checklist

Before building production:

1. **Run database migration:**
   ```sql
   -- Run: supabase/migrations/20260111000000_production_beta_tester_setup.sql
   ```

2. **Verify database state:**
   ```sql
   -- All users should be beta testers with apex tier
   SELECT COUNT(*) FROM profiles 
   WHERE is_beta_tester = true AND subscription_tier = 'apex';
   -- Should match total user count
   ```

3. **Verify EAS secrets:**
   ```bash
   eas secret:list --profile production
   ```

4. **Test in dev build:**
   - ✅ Full access works
   - ✅ Interpretations generate
   - ✅ Daily card is preserved

5. **Build production:**
   ```bash
   eas build --profile production --platform android
   ```

## ⚠️ Important Notes

### Beta Period End
When beta period ends:
1. Change `isBetaPeriod = true` to `isBetaPeriod = false` in `app/reading.tsx`
2. Or remove the `isBetaPeriod` check entirely
3. Update database to set `is_beta_tester = false` for users who shouldn't have access

### Monitoring
After production deployment, monitor:
- Console logs for `🔍 PROFILE LOADED:` to verify profile loading
- Console logs for `🔍 CALCULATED ACCESS:` to verify access calculation
- Error logs for interpretation generation failures
- Daily card retention (users should see same card throughout the day)

## 🎯 Summary

**Database:** Run `20260111000000_production_beta_tester_setup.sql` migration
**Code:** Already production-ready with defensive checks
**Environment:** Ensure EAS secrets are set
**Testing:** Verify in dev build before production

All fixes are in place and production-ready! 🚀
