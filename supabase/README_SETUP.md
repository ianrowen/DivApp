# Supabase Tier Setup Guide

This guide will help you set up the subscription tier system in your Supabase database.

## Quick Setup

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_add_subscription_tier.sql`
4. Click **Run** to execute the migration

This will:
- Create a `public.users` table that extends `auth.users`
- Add a `subscription_tier` column with default value 'free'
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically create user profiles on signup

### Step 2: Set Your Tier to Expert

1. In the SQL Editor, run this query to find your user ID:
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. Then set your tier to expert:
   ```sql
   UPDATE public.users 
   SET subscription_tier = 'expert'
   WHERE id = 'your-user-id-here';
   ```

   OR set by email:
   ```sql
   UPDATE public.users 
   SET subscription_tier = 'expert'
   WHERE email = 'your-email@example.com';
   ```

### Step 3: Verify

Check that your tier was set correctly:
```sql
SELECT id, email, subscription_tier FROM public.users;
```

## Available Tiers

- **free**: 3 follow-up questions per reading
- **premium**: 3 follow-up questions per reading
- **pro**: 10 follow-up questions per reading
- **expert**: Unlimited follow-up questions

## Manual Setup (Alternative)

If you prefer to set up manually:

1. Go to **Table Editor** in Supabase
2. Create a new table called `users` with:
   - `id` (UUID, Primary Key, References `auth.users(id)`)
   - `email` (Text)
   - `subscription_tier` (Text, Default: 'free')
   - `created_at` (Timestamptz, Default: now())
   - `updated_at` (Timestamptz, Default: now())

3. Add a check constraint on `subscription_tier`:
   ```sql
   ALTER TABLE public.users 
   ADD CONSTRAINT subscription_tier_check 
   CHECK (subscription_tier IN ('free', 'premium', 'pro', 'expert'));
   ```

4. Enable RLS and add policies (see migration file)

## Troubleshooting

### "relation public.users does not exist"
- Make sure you ran migration 001 first
- Check that you're in the correct database

### "permission denied"
- Make sure RLS policies are set up correctly
- Check that the trigger function has SECURITY DEFINER

### Tier not updating
- Make sure you're updating the correct user ID
- Check that the subscription_tier value matches exactly: 'free', 'premium', 'pro', or 'expert'

## For Development

To set all users to expert tier for testing:
```sql
UPDATE public.users 
SET subscription_tier = 'expert';
```













