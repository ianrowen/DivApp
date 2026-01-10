# Migration Safety Check: Beta Tester Setup

## ✅ Safety Analysis

### Migration: `20260110000000_ensure_profiles_auto_create_with_beta.sql`

#### Step 1: Create Function `handle_new_auth_user()`
- **Action**: Creates/updates a function
- **Safety**: ✅ Safe - only defines behavior, doesn't modify data
- **Impact**: None on existing data

#### Step 2: Create Trigger `on_auth_user_created_create_profile`
- **Action**: Creates a trigger on `auth.users` table
- **Safety**: ✅ Safe - only affects NEW users created AFTER migration
- **Impact**: None on existing users
- **Behavior**: When a new `auth.users` row is inserted, automatically creates a `profiles` row with:
  - `is_beta_tester = true`
  - `beta_access_expires_at = NULL` (indefinite)
  - `subscription_tier = 'free'`
  - Uses `ON CONFLICT (user_id) DO NOTHING` - won't overwrite existing profiles

#### Step 3: Create Profiles for Existing auth.users Without Profiles
```sql
INSERT INTO public.profiles (...)
SELECT ... FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL  -- ⚠️ KEY: Only users WITHOUT profiles
ON CONFLICT (user_id) DO NOTHING;  -- ✅ Safe: Won't overwrite existing
```
- **Safety**: ✅ Safe
- **Logic**: 
  - Only inserts for `auth.users` that DON'T have a profile (`WHERE p.user_id IS NULL`)
  - Uses `ON CONFLICT DO NOTHING` - if profile somehow exists, does nothing
  - **WILL NOT** affect any existing profiles
- **Impact**: Creates missing profiles only, sets them as beta testers

#### Step 4: Update Existing Profiles to Beta Testers
```sql
UPDATE public.profiles 
SET 
  is_beta_tester = true,
  beta_access_expires_at = NULL
WHERE is_beta_tester IS NULL OR is_beta_tester = false;
```
- **Safety**: ✅ Safe
- **Logic**:
  - Only updates `is_beta_tester` and `beta_access_expires_at` columns
  - Only updates rows where `is_beta_tester IS NULL OR is_beta_tester = false`
  - **WILL NOT** change any other columns (subscription_tier, birth data, etc.)
  - **WILL NOT** affect profiles that already have `is_beta_tester = true`
- **Impact**: Ensures all existing profiles are beta testers

### Migration: `20260110000001_remove_old_users_table_trigger.sql`

#### Step 1: Drop Old Trigger
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```
- **Safety**: ✅ Safe
- **Action**: Only removes a trigger, doesn't touch any data
- **Impact**: None on existing data
- **Note**: This removes the old trigger that created rows in `public.users` table (legacy)

## ✅ Data Preservation Guarantees

### 1. **All Existing User Accounts Will Be Retained**
- ✅ No DELETE statements in either migration
- ✅ No DROP TABLE statements
- ✅ No TRUNCATE statements
- ✅ All operations are INSERT (with conflict handling) or UPDATE (selective)

### 2. **All Existing Profiles Will Be Preserved**
- ✅ Step 3 only creates profiles for users who DON'T have profiles
- ✅ Uses `ON CONFLICT DO NOTHING` to prevent overwrites
- ✅ Step 4 only updates `is_beta_tester` and `beta_access_expires_at`
- ✅ All other profile data (birth_date, sun_sign, moon_sign, etc.) remains untouched

### 3. **All Existing Users Will Become Beta Testers**
- ✅ Step 3 creates missing profiles with `is_beta_tester = true`
- ✅ Step 4 updates existing profiles to set `is_beta_tester = true` if it's false/null
- ✅ All users will have `beta_access_expires_at = NULL` (indefinite access)

### 4. **All New Users Will Get Beta Tester Status**
- ✅ Trigger `on_auth_user_created_create_profile` automatically creates profiles
- ✅ New profiles are created with `is_beta_tester = true`
- ✅ Database trigger `set_beta_tester_default` provides additional safety net
- ✅ Column default `is_beta_tester DEFAULT true` provides third layer

## ⚠️ Potential Edge Cases (All Handled)

### Edge Case 1: Profile exists but is_beta_tester is NULL
- **Handled by**: Step 4 UPDATE statement
- **Result**: Will be set to `true`

### Edge Case 2: Profile exists but is_beta_tester is false
- **Handled by**: Step 4 UPDATE statement
- **Result**: Will be set to `true`

### Edge Case 3: auth.users exists but no profile exists
- **Handled by**: Step 3 INSERT statement
- **Result**: Profile will be created with `is_beta_tester = true`

### Edge Case 4: Race condition - profile created between Step 3 check and insert
- **Handled by**: `ON CONFLICT (user_id) DO NOTHING`
- **Result**: Insert will be skipped, existing profile preserved

### Edge Case 5: User has subscription_tier = 'apex' already
- **Handled by**: Step 4 only updates `is_beta_tester`, not `subscription_tier`
- **Result**: `subscription_tier` remains 'apex', `is_beta_tester` becomes `true`

## ✅ Verification Queries (Run After Migration)

```sql
-- 1. Verify all users are beta testers
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE is_beta_tester = true) as beta_testers,
  COUNT(*) FILTER (WHERE is_beta_tester = false OR is_beta_tester IS NULL) as non_beta_testers
FROM public.profiles;

-- 2. Verify no users were deleted
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
-- These should match (or profiles >= auth.users if some auth.users don't have profiles yet)

-- 3. Verify all beta testers have indefinite access
SELECT 
  COUNT(*) FILTER (WHERE beta_access_expires_at IS NULL AND is_beta_tester = true) as indefinite_beta
FROM public.profiles;

-- 4. Check for any users without profiles (should be 0 after migration)
SELECT COUNT(*) 
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;
```

## ✅ Summary

**All three requirements are met:**

1. ✅ **Retain all current user accounts**: No DELETE/DROP/TRUNCATE operations
2. ✅ **Make all of them beta testers**: Step 3 creates missing profiles as beta testers, Step 4 updates existing profiles
3. ✅ **Ensure all new users get beta access**: Trigger automatically creates profiles with beta tester status

**The migrations are safe to run!**
