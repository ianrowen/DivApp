#!/usr/bin/env node
/**
 * Migration Impact Analysis: user_profiles → profiles
 * 
 * Comprehensive analysis of all references to user_profiles table
 * before renaming to profiles.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const OLD_TABLE_NAME = 'user_profiles';
const NEW_TABLE_NAME = 'profiles';

const SEARCH_DIRS = ['src', 'app', 'supabase'];
const IGNORE_DIRS = ['node_modules', '.expo', 'dist', 'build', 'android', 'ios', '.git'];
const SEARCH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.md'];

interface CodeReference {
  filePath: string;
  lineNumber: number;
  context: string;
  type: 'query' | 'type_definition' | 'comment' | 'string' | 'migration';
}

interface DatabaseDependency {
  type: 'foreign_key' | 'trigger' | 'policy' | 'view' | 'function';
  name: string;
  details: Record<string, any>;
}

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

function searchTableReferences(filePath: string, tableName: string): CodeReference[] {
  const references: CodeReference[] = [];
  
  // Skip the analysis script itself
  if (filePath.includes('analyzeMigrationImpact.ts')) {
    return references;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      const lowerLine = line.toLowerCase();
      
      // Skip if line doesn't contain table name
      if (!lowerLine.includes(tableName.toLowerCase())) {
        return;
      }
      
      // Pattern 1: Direct queries .from('user_profiles')
      const fromPattern = new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'i');
      if (fromPattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
          type: 'query',
        });
        return;
      }
      
      // Pattern 2: Type definitions Database['public']['Tables']['user_profiles']
      const typePattern = new RegExp(
        `(?:Database|Tables|Views)\\s*\\[\\s*['"]public['"]\\s*\\]\\s*\\[\\s*['"]Tables['"]\\s*\\]\\s*\\[\\s*['"]${tableName}['"]\\s*\\]`,
        'i'
      );
      if (typePattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
          type: 'type_definition',
        });
        return;
      }
      
      // Pattern 3: SQL references (CREATE TABLE, ALTER TABLE, etc.)
      if (filePath.endsWith('.sql')) {
        const sqlPatterns = [
          new RegExp(`CREATE\\s+TABLE.*${tableName}`, 'i'),
          new RegExp(`ALTER\\s+TABLE.*${tableName}`, 'i'),
          new RegExp(`FROM\\s+${tableName}\\b`, 'i'),
          new RegExp(`INTO\\s+${tableName}\\b`, 'i'),
          new RegExp(`UPDATE\\s+${tableName}\\b`, 'i'),
          new RegExp(`DELETE\\s+FROM\\s+${tableName}\\b`, 'i'),
          new RegExp(`JOIN\\s+${tableName}\\b`, 'i'),
          new RegExp(`ON\\s+${tableName}\\b`, 'i'),
          new RegExp(`REFERENCES\\s+${tableName}`, 'i'),
          new RegExp(`TRIGGER.*ON\\s+${tableName}`, 'i'),
          new RegExp(`POLICY.*ON\\s+${tableName}`, 'i'),
        ];
        
        if (sqlPatterns.some(pattern => pattern.test(line))) {
          references.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'migration',
          });
          return;
        }
      }
      
      // Pattern 4: Comments
      if (trimmedLine.startsWith('--') || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
          type: 'comment',
        });
        return;
      }
      
      // Pattern 5: String matches (variable names, etc.)
      const stringPattern = new RegExp(`['"]${tableName}['"]`, 'i');
      if (stringPattern.test(line)) {
        // Skip if already captured as query
        if (!fromPattern.test(line)) {
          references.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            type: 'string',
          });
        }
      }
    });
  } catch (error) {
    // Ignore errors
  }
  
  return references;
}

function parseMigrationFiles(): DatabaseDependency[] {
  const dependencies: DatabaseDependency[] = [];
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return dependencies;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract triggers
    const triggerMatches = content.matchAll(/CREATE\s+TRIGGER\s+(\w+)[\s\S]*?ON\s+(?:(auth|public)\.)?(\w+)/gi);
    for (const match of triggerMatches) {
      const triggerName = match[1];
      const tableName = match[3];
      // Skip false positives
      if (!['to', 'from', 'as', 'is'].includes(triggerName.toLowerCase()) && tableName === OLD_TABLE_NAME) {
        dependencies.push({
          type: 'trigger',
          name: triggerName,
          details: { table: tableName, file },
        });
      }
    }
    
    // Extract functions that reference the table
    const functionMatches = content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:\w+\.)?(\w+)\s*\(/gi);
    for (const match of functionMatches) {
      const funcName = match[1];
      // Check if function body references the table
      const funcBodyMatch = content.match(
        new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(?:\\w+\\.)?${funcName}[\\s\\S]*?\\$\\$`, 'i')
      );
      if (funcBodyMatch && funcBodyMatch[0].toLowerCase().includes(OLD_TABLE_NAME.toLowerCase())) {
        dependencies.push({
          type: 'function',
          name: funcName,
          details: { file },
        });
      }
    }
    
    // Extract policies
    const policyMatches = content.matchAll(/CREATE\s+POLICY\s+["']([^"']+)["'][\s\S]*?ON\s+(?:public\.)?(\w+)/gi);
    for (const match of policyMatches) {
      if (match[2] === OLD_TABLE_NAME) {
        dependencies.push({
          type: 'policy',
          name: match[1],
          details: { table: match[2], file },
        });
      }
    }
  });
  
  return dependencies;
}

async function checkDatabaseDependencies(): Promise<DatabaseDependency[]> {
  const dependencies: DatabaseDependency[] = [];
  
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️  Supabase credentials not found. Skipping database dependency check.');
    console.warn('   Run queries manually in supabase/AUDIT_QUERIES.sql');
    return dependencies;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Note: Most queries require admin access
  // We'll document what to check manually
  
  return dependencies;
}

function printReport(
  codeReferences: CodeReference[],
  migrationDependencies: DatabaseDependency[]
) {
  console.log('\n' + '='.repeat(80));
  console.log(`IMPACT ANALYSIS: ${OLD_TABLE_NAME} → ${NEW_TABLE_NAME}`);
  console.log('='.repeat(80) + '\n');
  
  // Group references by type
  const queries = codeReferences.filter(r => r.type === 'query');
  const typeDefs = codeReferences.filter(r => r.type === 'type_definition');
  const migrations = codeReferences.filter(r => r.type === 'migration');
  const comments = codeReferences.filter(r => r.type === 'comment');
  const strings = codeReferences.filter(r => r.type === 'string');
  
  // Group by file
  const byFile = codeReferences.reduce((acc, ref) => {
    if (!acc[ref.filePath]) {
      acc[ref.filePath] = [];
    }
    acc[ref.filePath].push(ref);
    return acc;
  }, {} as Record<string, CodeReference[]>);
  
  // Code References
  console.log('PART 1: CODE REFERENCES');
  console.log('-'.repeat(80));
  console.log(`\n📋 Total References Found: ${codeReferences.length}`);
  console.log(`   - Query references: ${queries.length}`);
  console.log(`   - Type definitions: ${typeDefs.length}`);
  console.log(`   - Migration files: ${migrations.length}`);
  console.log(`   - Comments: ${comments.length}`);
  console.log(`   - String references: ${strings.length}`);
  
  console.log(`\n📁 Files Affected: ${Object.keys(byFile).length}`);
  
  // Query References
  if (queries.length > 0) {
    console.log('\n🔍 Query References (.from() calls):');
    queries.forEach(ref => {
      const relativePath = path.relative(process.cwd(), ref.filePath);
      console.log(`  ${relativePath}:${ref.lineNumber}`);
      console.log(`    ${ref.context.substring(0, 100)}`);
    });
  }
  
  // Type Definitions
  if (typeDefs.length > 0) {
    console.log('\n📝 Type Definitions:');
    typeDefs.forEach(ref => {
      const relativePath = path.relative(process.cwd(), ref.filePath);
      console.log(`  ${relativePath}:${ref.lineNumber}`);
      console.log(`    ${ref.context.substring(0, 100)}`);
    });
  }
  
  // Migration Files
  if (migrations.length > 0) {
    console.log('\n🗄️  Migration File References:');
    const migrationFiles = [...new Set(migrations.map(m => m.filePath))];
    migrationFiles.forEach(filePath => {
      const relativePath = path.relative(process.cwd(), filePath);
      const fileRefs = migrations.filter(m => m.filePath === filePath);
      console.log(`  ${relativePath} (${fileRefs.length} references)`);
      fileRefs.slice(0, 3).forEach(ref => {
        console.log(`    Line ${ref.lineNumber}: ${ref.context.substring(0, 80)}`);
      });
      if (fileRefs.length > 3) {
        console.log(`    ... and ${fileRefs.length - 3} more`);
      }
    });
  }
  
  // All Files Summary
  console.log('\n📋 All Affected Files:');
  Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([filePath, refs]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      const queryCount = refs.filter(r => r.type === 'query').length;
      const otherCount = refs.length - queryCount;
      console.log(`  ${relativePath}: ${refs.length} references (${queryCount} queries, ${otherCount} other)`);
    });
  
  // Database Dependencies
  console.log('\n\nPART 2: DATABASE DEPENDENCIES');
  console.log('-'.repeat(80));
  
  if (migrationDependencies.length === 0) {
    console.log('\n⚠️  No database dependencies found in migration files');
  } else {
    const triggers = migrationDependencies.filter(d => d.type === 'trigger');
    const functions = migrationDependencies.filter(d => d.type === 'function');
    const policies = migrationDependencies.filter(d => d.type === 'policy');
    
    if (triggers.length > 0) {
      console.log('\n🔧 Triggers:');
      triggers.forEach(t => {
        console.log(`  - ${t.name}`);
        console.log(`    File: ${t.details.file}`);
      });
    }
    
    if (functions.length > 0) {
      console.log('\n⚙️  Functions:');
      functions.forEach(f => {
        console.log(`  - ${f.name}`);
        console.log(`    File: ${f.details.file}`);
      });
    }
    
    if (policies.length > 0) {
      console.log('\n🔒 RLS Policies:');
      policies.forEach(p => {
        console.log(`  - ${p.name}`);
        console.log(`    File: ${p.details.file}`);
      });
    }
  }
  
  // Migration Steps
  console.log('\n\nPART 3: MIGRATION STEPS REQUIRED');
  console.log('-'.repeat(80));
  
  console.log('\n1. Database Migration:');
  console.log('   - Rename table: ALTER TABLE user_profiles RENAME TO profiles;');
  console.log('   - Update triggers referencing the table');
  console.log('   - Update functions referencing the table');
  console.log('   - Update RLS policies (drop and recreate with new name)');
  console.log('   - Update foreign keys (if any tables reference user_profiles)');
  console.log('   - Update views (if any views query user_profiles)');
  
  console.log('\n2. Code Updates:');
  console.log(`   - Update ${queries.length} query references (.from() calls)`);
  console.log(`   - Update ${typeDefs.length} type definitions`);
  console.log(`   - Update ${migrations.length} migration file references`);
  console.log(`   - Update comments/documentation (${comments.length} references)`);
  
  console.log('\n3. Type Generation:');
  console.log('   - Regenerate TypeScript types from Supabase schema');
  console.log('   - Update Database type definitions');
  
  console.log('\n4. Testing:');
  console.log('   - Test user signup flow (creates profile)');
  console.log('   - Test profile loading (ProfileContext)');
  console.log('   - Test profile updates (ProfileScreen)');
  console.log('   - Test account deletion');
  console.log('   - Verify RLS policies work correctly');
  console.log('   - Test all queries that reference the table');
  
  // Critical Files
  console.log('\n\nPART 4: CRITICAL FILES TO UPDATE');
  console.log('-'.repeat(80));
  
  const criticalFiles = Object.entries(byFile)
    .filter(([_, refs]) => refs.some(r => r.type === 'query'))
    .sort((a, b) => b[1].length - a[1].length);
  
  if (criticalFiles.length > 0) {
    criticalFiles.forEach(([filePath, refs]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      const queryCount = refs.filter(r => r.type === 'query').length;
      console.log(`\n  ${relativePath} (${queryCount} queries)`);
      refs.filter(r => r.type === 'query').forEach(ref => {
        console.log(`    Line ${ref.lineNumber}: ${ref.context.substring(0, 80)}`);
      });
    });
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total code references: ${codeReferences.length}`);
  console.log(`Files to update: ${Object.keys(byFile).length}`);
  console.log(`Query references: ${queries.length}`);
  console.log(`Database dependencies: ${migrationDependencies.length}`);
  console.log('\n⚠️  IMPORTANT: Run queries in supabase/AUDIT_QUERIES.sql to check:');
  console.log('   - Foreign keys from other tables');
  console.log('   - Views that query user_profiles');
  console.log('   - Actual triggers and functions in production');
  console.log('');
}

async function main() {
  console.log('🔍 Analyzing migration impact: user_profiles → profiles...\n');
  
  // Get all files
  const allFiles: string[] = [];
  SEARCH_DIRS.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const files = getAllFiles(dirPath);
    allFiles.push(...files);
  });
  
  console.log(`📁 Scanned ${allFiles.length} files\n`);
  
  // Search for references
  console.log('🔎 Searching for references...');
  const codeReferences: CodeReference[] = [];
  
  allFiles.forEach(filePath => {
    const refs = searchTableReferences(filePath, OLD_TABLE_NAME);
    codeReferences.push(...refs);
  });
  
  // Parse migration files for database dependencies
  console.log('🗄️  Analyzing database dependencies...');
  const migrationDependencies = parseMigrationFiles();
  
  // Check database (if credentials available)
  const dbDependencies = await checkDatabaseDependencies();
  const allDependencies = [...migrationDependencies, ...dbDependencies];
  
  // Print report
  printReport(codeReferences, allDependencies);
}

main().catch(console.error);

