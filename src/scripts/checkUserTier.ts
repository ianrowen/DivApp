#!/usr/bin/env node
/**
 * Quick script to check and update user tier
 * Run: npm run check-tier
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env files if they exist (check multiple common locations)
const envFiles = ['.env.local', '.env', '.env.development'];
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) { // Don't override existing env vars
            process.env[key] = value;
          }
        }
      }
    });
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

async function checkUserTier() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials');
    console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Not authenticated. Please sign in first.');
    return;
  }

  console.log(`\n👤 Checking tier for user: ${user.email || user.id}\n`);

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, is_beta_tester, beta_access_expires_at, user_id')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  console.log('📊 Current Profile Data:');
  console.log(`   subscription_tier: ${profile?.subscription_tier || 'null'}`);
  console.log(`   is_beta_tester: ${profile?.is_beta_tester || false}`);
  console.log(`   beta_access_expires_at: ${profile?.beta_access_expires_at || 'null'}`);

  // Check beta tester status
  if (profile?.is_beta_tester) {
    const betaExpired = profile.beta_access_expires_at && new Date(profile.beta_access_expires_at) < new Date();
    if (!betaExpired) {
      console.log('\n✅ Beta tester detected - you should have APEX access!');
    } else {
      console.log('\n⚠️  Beta tester access has expired');
    }
  } else {
    console.log('\n⚠️  Not marked as beta tester');
  }

  // Determine effective tier
  let effectiveTier = profile?.subscription_tier || 'free';
  if (profile?.is_beta_tester) {
    const betaExpired = profile.beta_access_expires_at && new Date(profile.beta_access_expires_at) < new Date();
    if (!betaExpired) {
      effectiveTier = 'apex';
    }
  }

  console.log(`\n🎯 Effective Tier: ${effectiveTier.toUpperCase()}`);
  
  if (effectiveTier === 'apprentice') {
    console.log('\n💡 Note: Database has "apprentice" but UI uses "adept"');
    console.log('   They are equivalent - this is just a naming difference.');
  }

  console.log('\n📝 To update your tier, run this SQL in Supabase Dashboard:');
  console.log(`   UPDATE profiles SET subscription_tier = 'apex' WHERE user_id = '${user.id}';`);
  console.log(`   UPDATE profiles SET is_beta_tester = true, beta_access_expires_at = NULL WHERE user_id = '${user.id}';`);
  console.log('');
}

checkUserTier().catch(console.error);

