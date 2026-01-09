-- ============================================================================
-- MANUAL DATABASE AUDIT QUERIES
-- Run these in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. ALL TRIGGERS ON users/user_profiles
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'user_profiles')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2. ALL FUNCTIONS RELATED TO USER CREATION
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%user%' OR routine_name LIKE '%auth%')
ORDER BY routine_name;

-- 3. RLS POLICIES ON BOTH TABLES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('users', 'user_profiles')
ORDER BY tablename, policyname;

-- 4. FOREIGN KEY RELATIONSHIPS
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name IN ('users', 'user_profiles')
       OR ccu.table_name IN ('users', 'user_profiles'))
ORDER BY tc.table_name;

-- 5. DATA INTEGRITY: Users in 'users' but not in 'user_profiles'
SELECT u.id, u.email, u.created_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ORDER BY u.created_at DESC;

-- 6. DATA INTEGRITY: Users in 'user_profiles' but not in 'users'
SELECT up.user_id, up.created_at
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- 7. DATA INTEGRITY: Check for subscription_tier mismatches
SELECT 
  u.id,
  u.email,
  u.subscription_tier as users_tier,
  up.subscription_tier as profiles_tier
FROM users u
INNER JOIN user_profiles up ON u.id = up.user_id
WHERE u.subscription_tier IS DISTINCT FROM up.subscription_tier;

-- 8. TABLE STRUCTURES
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'user_profiles')
ORDER BY table_name, ordinal_position;

