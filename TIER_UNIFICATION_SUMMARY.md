# Tier Name Unification Summary

## ✅ Completed: Unified Tier Names Across Codebase

### **Unified Tier System: `'free' | 'adept' | 'apex'`**

All internal code now uses the same tier names that match:
- ✅ Database schema (`profiles.subscription_tier`)
- ✅ App UI (`supabase.ts`, `reading.tsx`)
- ✅ Marketing display names (i18n translations)

### **Display Names (Marketing)**
- `free` → **"Apprentice"** (displayed to users)
- `adept` → **"Adept"** (displayed to users)
- `apex` → **"Apex"** (displayed to users)

---

## 📋 Changes Made

### 1. **Database Migration**
- Created: `supabase/migrations/20260106000000_unify_tier_names.sql`
- Maps old values: `premium`→`adept`, `pro`→`adept`, `expert`→`apex`
- Updates database constraints to: `'free' | 'adept' | 'apex'`

### 2. **TypeScript Types**
- ✅ `src/core/ai/prompts/types.ts` - Updated `UserTier` type
- ✅ `src/core/models/SystemRegistry.ts` - Updated tier types
- ✅ `src/core/models/DeckRegistry.ts` - Updated tier types

### 3. **Core Services**
- ✅ `src/core/ai/prompts/promptBuilder.ts` - Updated all tier references
- ✅ `src/core/ai/prompts/tarotPrompts.ts` - Updated tier references
- ✅ `src/services/spreadService.ts` - Updated function signatures
- ✅ `src/core/analytics/questionAnalytics.ts` - Updated tier types

### 4. **App Components**
- ✅ `app/reading.tsx` - Removed tier mapping, uses unified names
- ✅ `app/spread-selection.tsx` - Updated tier type

---

## 🚀 Next Steps

### **Required: Run Database Migration**
```sql
-- Run this migration in Supabase Dashboard → SQL Editor
-- File: supabase/migrations/20260106000000_unify_tier_names.sql
```

### **Optional: Update Database Records**
If you have existing users with old tier names (`premium`, `pro`, `expert`), the migration will automatically map them:
- `premium` → `adept`
- `pro` → `adept`  
- `expert` → `apex`

### **Verify After Migration**
```sql
-- Check tier distribution
SELECT subscription_tier, COUNT(*) 
FROM profiles 
GROUP BY subscription_tier;
-- Should only show: free, adept, apex
```

---

## 📊 Benefits

1. **Consistency**: Same tier names everywhere (database, code, UI)
2. **Simplicity**: 3 tiers instead of 4 (`free`, `adept`, `apex`)
3. **Clarity**: Matches marketing display names
4. **Maintainability**: No more mapping logic needed
5. **Type Safety**: TypeScript types match database schema

---

## ⚠️ Breaking Changes

### **If You Have Existing Data:**
- Old tier names (`premium`, `pro`, `expert`) will be automatically mapped
- No data loss - all users will be assigned to new tiers

### **If You Have External Integrations:**
- Update any external systems that reference old tier names
- API responses will now use: `free`, `adept`, `apex`

---

## 🔍 Files That Still Reference Old Names (Legacy/Unused)

These files may still reference old tier names but are either:
- Legacy migrations (safe to leave)
- Documentation (update if needed)
- Unused code paths

- `supabase/migrations/001_add_subscription_tier.sql` (legacy)
- `supabase/QUICK_SETUP.sql` (legacy)
- `supabase/README_SETUP.md` (documentation - update if needed)

---

## ✅ Verification Checklist

- [ ] Run database migration
- [ ] Verify no users have old tier names (`premium`, `pro`, `expert`)
- [ ] Test app with each tier (`free`, `adept`, `apex`)
- [ ] Verify beta testers still get apex-level access
- [ ] Check that full history works for apex tier
- [ ] Update any external documentation if needed

---

## 📝 Notes

- **Beta Testers**: Still get `apex` tier access automatically (via `is_beta_tester` flag)
- **Display Names**: Separated from internal names (in i18n files)
- **Future Tiers**: Easy to add new tiers - just update the type and database constraint

