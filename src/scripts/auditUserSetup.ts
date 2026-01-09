#!/usr/bin/env node
/**
 * Comprehensive User Setup Audit Script
 * 
 * Audits user-related setup including:
 * - Codebase references (auth handlers, user creation logic)
 * - Database triggers and functions
 * - RLS policies
 * - Foreign key relationships
 * - Data integrity checks
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface CodebaseFinding {
  filePath: string;
  lineNumber: number;
  context: string;
  type: 'auth_handler' | 'user_insert' | 'trigger_reference' | 'function_reference';
}

interface DatabaseFinding {
  name: string;
  type: 'trigger' | 'function' | 'policy' | 'foreign_key';
  details: Record<string, any>;
}

// ============================================================================
// PART 1: CODEBASE SEARCH
// ============================================================================

const SEARCH_DIRS = ['src', 'app', 'supabase'];
const IGNORE_DIRS = ['node_modules', '.expo', 'dist', 'build', 'android', 'ios'];
const SEARCH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql'];

function shouldIgnoreDir(dirName: string): boolean {
  return IGNORE_DIRS.some(ignore => dirName.includes(ignore));
}

function shouldProcessFile(filePath: string): boolean {
  return SEARCH_EXTENSIONS.includes(path.extname(filePath));
}

function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return fileList;
  
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const dirName = path.basename(filePath);
      if (!shouldIgnoreDir(dirName)) {
        getAllFiles(filePath, fileList);
      }
    } else if (stat.isFile() && shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function searchCodebase(allFiles: string[]): {
  authHandlers: CodebaseFinding[];
  userInserts: CodebaseFinding[];
  triggerReferences: CodebaseFinding[];
  functionReferences: CodebaseFinding[];
} {
  const authHandlers: CodebaseFinding[] = [];
  const userInserts: CodebaseFinding[] = [];
  const triggerReferences: CodebaseFinding[] = [];
  const functionReferences: CodebaseFinding[] = [];

  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Auth handlers
        if (/onAuthStateChange|signInWithOAuth|signInWithPassword|signUp|getSession|getUser/.test(line)) {
          authHandlers.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'auth_handler',
          });
        }
        
        // User inserts
        if (/\.insert\(.*['"]users['"]|\.insert\(.*['"]user_profiles['"]/.test(line)) {
          userInserts.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'user_insert',
          });
        }
        
        // Trigger references
        if (/trigger|on_auth_user_created|handle_new_user/i.test(line)) {
          triggerReferences.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'trigger_reference',
          });
        }
        
        // Function references
        if (/function.*user|handle_new_user|delete_user_account/i.test(line)) {
          functionReferences.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'function_reference',
          });
        }
      });
    } catch (error) {
      // Ignore errors
    }
  });

  return { authHandlers, userInserts, triggerReferences, functionReferences };
}

// ============================================================================
// PART 2: DATABASE AUDIT
// ============================================================================

function parseMigrationFiles(): {
  triggers: DatabaseFinding[];
  functions: DatabaseFinding[];
  policies: DatabaseFinding[];
  foreignKeys: DatabaseFinding[];
} {
  const triggers: DatabaseFinding[] = [];
  const functions: DatabaseFinding[] = [];
  const policies: DatabaseFinding[] = [];
  const foreignKeys: DatabaseFinding[] = [];
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return { triggers, functions, policies, foreignKeys };
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract triggers - match CREATE TRIGGER name ... ON schema.table (multiline)
    const triggerMatches = content.matchAll(/CREATE\s+TRIGGER\s+(\w+)[\s\S]*?ON\s+(?:(auth|public)\.)?(\w+)/gi);
    for (const match of triggerMatches) {
      const triggerName = match[1];
      // Skip false positives
      if (!['to', 'from', 'as', 'is'].includes(triggerName.toLowerCase())) {
        triggers.push({
          name: triggerName,
          type: 'trigger',
          details: { 
            table: match[3], 
            schema: match[2] || 'public',
            file 
          },
        });
      }
    }
    
    // Extract functions - match CREATE [OR REPLACE] FUNCTION [schema.]name(
    const functionMatches = content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:\w+\.)?(\w+)\s*\(/gi);
    for (const match of functionMatches) {
      const funcName = match[1];
      // Skip common PostgreSQL keywords that might match
      if (!['to', 'from', 'as', 'is', 'begin', 'end'].includes(funcName.toLowerCase())) {
        functions.push({
          name: funcName,
          type: 'function',
          details: { file },
        });
      }
    }
    
    // Extract policies - match CREATE POLICY "name" ... ON [schema.]table (multiline)
    const policyMatches = content.matchAll(/CREATE\s+POLICY\s+["']([^"']+)["'][\s\S]*?ON\s+(?:public\.)?(\w+)/gi);
    for (const match of policyMatches) {
      policies.push({
        name: match[1],
        type: 'policy',
        details: { table: match[2], file },
      });
    }
    
    // Extract foreign keys - match REFERENCES table(column) [ON DELETE rule]
    const fkMatches = content.matchAll(/REFERENCES\s+(?:\w+\.)?(\w+)\((\w+)\)(?:\s+ON\s+DELETE\s+(\w+))?/gi);
    for (const match of fkMatches) {
      foreignKeys.push({
        name: `${match[1]}.${match[2]}`,
        type: 'foreign_key',
        details: { 
          references_table: match[1],
          references_column: match[2],
          delete_rule: match[3] || 'NO ACTION',
          file,
        },
      });
    }
  });
  
  return { triggers, functions, policies, foreignKeys };
}

async function auditDatabase(): Promise<{
  triggers: DatabaseFinding[];
  functions: DatabaseFinding[];
  policies: DatabaseFinding[];
  foreignKeys: DatabaseFinding[];
  dataIntegrity: {
    usersWithoutProfiles: any[];
    profilesWithoutUsers: any[];
    tierMismatches: any[];
  };
}> {
  // Parse migration files first to get expected structure
  const migrationFindings = parseMigrationFiles();
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️  Supabase credentials not found. Using migration file analysis only.');
    return {
      triggers: migrationFindings.triggers,
      functions: migrationFindings.functions,
      policies: migrationFindings.policies,
      foreignKeys: migrationFindings.foreignKeys,
      dataIntegrity: {
        usersWithoutProfiles: [],
        profilesWithoutUsers: [],
        tierMismatches: [],
      },
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Start with migration findings, then try to query actual database
  const triggers = [...migrationFindings.triggers];
  const functions = [...migrationFindings.functions];
  const policies = [...migrationFindings.policies];
  const foreignKeys = [...migrationFindings.foreignKeys];

  // 5. Data Integrity Checks
  const dataIntegrity = {
    usersWithoutProfiles: [] as any[],
    profilesWithoutUsers: [] as any[],
    tierMismatches: [] as any[],
  };

  try {
    // Users without profiles
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(100);
    
    if (usersData) {
      for (const user of usersData) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        if (!profile) {
          dataIntegrity.usersWithoutProfiles.push(user);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not check users without profiles');
  }

  try {
    // Profiles without users
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('user_id, created_at')
      .limit(100);
    
    if (profilesData) {
      for (const profile of profilesData) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('id', profile.user_id)
          .single();
        
        if (!user) {
          dataIntegrity.profilesWithoutUsers.push(profile);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not check profiles without users');
  }

  try {
    // Tier mismatches
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, subscription_tier')
      .limit(100);
    
    if (usersData) {
      for (const user of usersData) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .single();
        
        if (profile && user.subscription_tier !== profile.subscription_tier) {
          dataIntegrity.tierMismatches.push({
            id: user.id,
            email: user.email,
            users_tier: user.subscription_tier,
            profiles_tier: profile.subscription_tier,
          });
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not check tier mismatches');
  }

  return { triggers, functions, policies, foreignKeys, dataIntegrity };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function printReport(
  codebaseFindings: ReturnType<typeof searchCodebase>,
  dbFindings: Awaited<ReturnType<typeof auditDatabase>>
) {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE USER SETUP AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  // PART 1: CODEBASE FINDINGS
  console.log('PART 1: CODEBASE AUDIT');
  console.log('-'.repeat(80));
  
  console.log('\n📋 Auth Handlers:');
  if (codebaseFindings.authHandlers.length === 0) {
    console.log('  No auth handlers found');
  } else {
    const byFile = codebaseFindings.authHandlers.reduce((acc, finding) => {
      if (!acc[finding.filePath]) acc[finding.filePath] = [];
      acc[finding.filePath].push(finding);
      return acc;
    }, {} as Record<string, CodebaseFinding[]>);
    
    Object.entries(byFile).forEach(([filePath, findings]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`  ${relativePath}:`);
      findings.forEach(f => {
        console.log(`    Line ${f.lineNumber}: ${f.context.substring(0, 80)}`);
      });
    });
  }

  console.log('\n📋 User Insert Operations:');
  if (codebaseFindings.userInserts.length === 0) {
    console.log('  ✅ No direct user inserts found (likely handled by triggers)');
  } else {
    codebaseFindings.userInserts.forEach(f => {
      const relativePath = path.relative(process.cwd(), f.filePath);
      console.log(`  - ${relativePath}:${f.lineNumber}`);
      console.log(`    ${f.context}`);
    });
  }

  console.log('\n📋 Trigger References:');
  if (codebaseFindings.triggerReferences.length === 0) {
    console.log('  No trigger references found');
  } else {
    const byFile = codebaseFindings.triggerReferences.reduce((acc, finding) => {
      if (!acc[finding.filePath]) acc[finding.filePath] = [];
      acc[finding.filePath].push(finding);
      return acc;
    }, {} as Record<string, CodebaseFinding[]>);
    
    Object.entries(byFile).forEach(([filePath, findings]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`  ${relativePath}:`);
      findings.forEach(f => {
        console.log(`    Line ${f.lineNumber}: ${f.context.substring(0, 80)}`);
      });
    });
  }

  console.log('\n📋 Function References:');
  if (codebaseFindings.functionReferences.length === 0) {
    console.log('  No function references found');
  } else {
    const byFile = codebaseFindings.functionReferences.reduce((acc, finding) => {
      if (!acc[finding.filePath]) acc[finding.filePath] = [];
      acc[finding.filePath].push(finding);
      return acc;
    }, {} as Record<string, CodebaseFinding[]>);
    
    Object.entries(byFile).forEach(([filePath, findings]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`  ${relativePath}:`);
      findings.forEach(f => {
        console.log(`    Line ${f.lineNumber}: ${f.context.substring(0, 80)}`);
      });
    });
  }

  // PART 2: DATABASE FINDINGS
  console.log('\n\nPART 2: DATABASE AUDIT');
  console.log('-'.repeat(80));

  console.log('\n🔧 Triggers:');
  if (dbFindings.triggers.length === 0) {
    console.log('  ⚠️  No triggers found (may require admin access to query)');
    console.log('  Check migration files:');
    console.log('    - supabase/migrations/001_add_subscription_tier.sql');
    console.log('    - supabase/migrations/003_set_beta_tester_default.sql');
  } else {
    dbFindings.triggers.forEach(t => {
      console.log(`  - ${t.name}`);
      console.log(`    Table: ${t.details.schema || 'public'}.${t.details.table}`);
      console.log(`    File: ${t.details.file}`);
    });
  }

  console.log('\n🔧 Functions:');
  if (dbFindings.functions.length === 0) {
    console.log('  ⚠️  No functions found (may require admin access to query)');
    console.log('  Expected functions from migrations:');
    console.log('    - handle_new_user()');
    console.log('    - handle_new_user_profile()');
    console.log('    - delete_user_account()');
  } else {
    dbFindings.functions.forEach(f => {
      console.log(`  - ${f.name}`);
      if (f.details.routine_definition) {
        const def = f.details.routine_definition.substring(0, 200);
        console.log(`    ${def}...`);
      }
    });
  }

  console.log('\n🔒 RLS Policies:');
  if (dbFindings.policies.length === 0) {
    console.log('  ⚠️  No policies found in migration files');
    console.log('  Expected policies from migrations:');
    console.log('    - "Users can view own profile"');
    console.log('    - "Users can update own profile"');
    console.log('  Note: Run queries in supabase/AUDIT_QUERIES.sql to verify actual policies');
  } else {
    dbFindings.policies.forEach(p => {
      console.log(`  - ${p.name}`);
      console.log(`    Table: ${p.details.table}`);
      console.log(`    File: ${p.details.file}`);
    });
  }

  console.log('\n🔗 Foreign Keys:');
  if (dbFindings.foreignKeys.length === 0) {
    console.log('  ⚠️  No foreign keys found in migration files');
    console.log('  Expected:');
    console.log('    - users.id -> auth.users.id (ON DELETE CASCADE)');
    console.log('    - user_profiles.user_id -> users.id (or auth.users.id)');
    console.log('  Note: Run queries in supabase/AUDIT_QUERIES.sql to verify actual foreign keys');
  } else {
    dbFindings.foreignKeys.forEach(fk => {
      console.log(`  - ${fk.name}`);
      console.log(`    References: ${fk.details.references_table}.${fk.details.references_column}`);
      console.log(`    Delete Rule: ${fk.details.delete_rule}`);
      console.log(`    File: ${fk.details.file}`);
    });
  }

  // PART 3: DATA INTEGRITY
  console.log('\n\nPART 3: DATA INTEGRITY CHECK');
  console.log('-'.repeat(80));

  console.log('\n👤 Users without Profiles:');
  if (dbFindings.dataIntegrity.usersWithoutProfiles.length === 0) {
    console.log('  ✅ All users have profiles');
  } else {
    console.log(`  ⚠️  Found ${dbFindings.dataIntegrity.usersWithoutProfiles.length} users without profiles:`);
    dbFindings.dataIntegrity.usersWithoutProfiles.slice(0, 10).forEach(u => {
      console.log(`    - ${u.email || u.id} (created: ${u.created_at})`);
    });
    if (dbFindings.dataIntegrity.usersWithoutProfiles.length > 10) {
      console.log(`    ... and ${dbFindings.dataIntegrity.usersWithoutProfiles.length - 10} more`);
    }
  }

  console.log('\n👤 Profiles without Users:');
  if (dbFindings.dataIntegrity.profilesWithoutUsers.length === 0) {
    console.log('  ✅ All profiles have users');
  } else {
    console.log(`  ⚠️  Found ${dbFindings.dataIntegrity.profilesWithoutUsers.length} orphaned profiles:`);
    dbFindings.dataIntegrity.profilesWithoutUsers.slice(0, 10).forEach(p => {
      console.log(`    - user_id: ${p.user_id}`);
    });
    if (dbFindings.dataIntegrity.profilesWithoutUsers.length > 10) {
      console.log(`    ... and ${dbFindings.dataIntegrity.profilesWithoutUsers.length - 10} more`);
    }
  }

  console.log('\n🎯 Subscription Tier Mismatches:');
  if (dbFindings.dataIntegrity.tierMismatches.length === 0) {
    console.log('  ✅ No tier mismatches found');
  } else {
    console.log(`  ⚠️  Found ${dbFindings.dataIntegrity.tierMismatches.length} tier mismatches:`);
    dbFindings.dataIntegrity.tierMismatches.forEach(m => {
      console.log(`    - ${m.email || m.id}:`);
      console.log(`      users.subscription_tier: ${m.users_tier}`);
      console.log(`      user_profiles.subscription_tier: ${m.profiles_tier}`);
    });
  }

  // SUMMARY
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Auth handlers found: ${codebaseFindings.authHandlers.length}`);
  console.log(`User insert operations: ${codebaseFindings.userInserts.length}`);
  console.log(`Trigger references: ${codebaseFindings.triggerReferences.length}`);
  console.log(`Function references: ${codebaseFindings.functionReferences.length}`);
  console.log(`Database triggers: ${dbFindings.triggers.length}`);
  console.log(`Database functions: ${dbFindings.functions.length}`);
  console.log(`RLS policies: ${dbFindings.policies.length}`);
  console.log(`Foreign keys: ${dbFindings.foreignKeys.length}`);
  console.log(`Data integrity issues: ${dbFindings.dataIntegrity.usersWithoutProfiles.length + dbFindings.dataIntegrity.profilesWithoutUsers.length + dbFindings.dataIntegrity.tierMismatches.length}`);
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔍 Starting comprehensive user setup audit...\n');

  // Get all files
  const allFiles: string[] = [];
  SEARCH_DIRS.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const files = getAllFiles(dirPath);
    allFiles.push(...files);
  });

  console.log(`📁 Scanned ${allFiles.length} files\n`);

  // Search codebase
  console.log('📋 Searching codebase...');
  const codebaseFindings = searchCodebase(allFiles);

  // Audit database
  console.log('🗄️  Auditing database...');
  const dbFindings = await auditDatabase();

  // Print report
  printReport(codebaseFindings, dbFindings);
}

main().catch(console.error);

