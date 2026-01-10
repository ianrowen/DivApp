# EAS Build: Local Codebase vs Git

## How EAS Build Works

**By default, EAS Build uses GIT:**
- Clones your repository from GitHub
- Uses the **committed code** from your git remote
- **Uncommitted changes are NOT included**

## Your Current Situation

You have **uncommitted debug changes** that need to be in the production build:
- ✅ Beta tester access fixes (`app/reading.tsx`)
- ✅ Daily card preservation fix (`src/shared/components/DailyCardDraw.tsx`)
- ✅ Profile loading improvements (`src/contexts/ProfileContext.tsx`)
- ✅ Instrumentation logs (can keep or remove)

## Options

### Option 1: Commit and Push (Recommended for Production)

**Best practice** - commit your changes before building:

```powershell
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix: Beta tester access, daily card preservation, and profile loading"

# Push to GitHub
git push

# Then build (will use committed code)
eas build --profile production --platform android
```

**Pros:**
- ✅ Version control history
- ✅ Can rollback if needed
- ✅ Standard workflow
- ✅ Other team members can see changes

**Cons:**
- ⚠️ Includes debug instrumentation (can remove later)

### Option 2: Build from Local Codebase (Quick Testing)

Use `--local` flag to upload your local codebase:

```powershell
eas build --profile production --platform android --local
```

**Pros:**
- ✅ Includes uncommitted changes
- ✅ Fast for testing
- ✅ No need to commit first

**Cons:**
- ⚠️ No version control record
- ⚠️ Can't rollback easily
- ⚠️ Not recommended for production releases

### Option 3: Commit Debug Changes Separately

1. **Commit production fixes:**
   ```powershell
   git add app/reading.tsx src/shared/components/DailyCardDraw.tsx src/contexts/ProfileContext.tsx
   git commit -m "Fix: Beta tester access and daily card preservation"
   git push
   ```

2. **Keep instrumentation uncommitted** (or commit separately):
   ```powershell
   git add src/core/api/gemini.ts src/core/api/supabase.ts
   git commit -m "Add: Debug instrumentation for production troubleshooting"
   git push
   ```

## Recommendation

**For Production Build:**
1. **Commit your fixes** (they're production-ready)
2. **Optionally commit instrumentation** (useful for debugging production issues)
3. **Push to GitHub**
4. **Build normally** (without `--local`)

**Why:**
- Your fixes are production-ready
- Having them in git provides version control
- You can remove instrumentation later if needed
- Standard workflow is safer

## Quick Commands

**Commit and build:**
```powershell
# Commit all changes
git add .
git commit -m "Production fixes: Beta tester access, daily card preservation, profile loading"
git push

# Build (uses git)
eas build --profile production --platform android
```

**Or build locally (testing only):**
```powershell
# Build from local codebase (includes uncommitted changes)
eas build --profile production --platform android --local
```

## Important Notes

- **`--local` flag**: Uploads your local codebase instead of cloning from git
- **Default behavior**: EAS clones from your git remote (GitHub)
- **Uncommitted changes**: Only included with `--local` flag
- **Production best practice**: Always commit before building production
