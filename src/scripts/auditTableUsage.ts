#!/usr/bin/env node
/**
 * Supabase Table Usage Audit Script
 * 
 * Searches the codebase for references to Supabase tables and views,
 * generating a comprehensive usage report.
 */

import * as fs from 'fs';
import * as path from 'path';

// Tables and views to audit
const TABLES_TO_AUDIT = [
  'tarot_decks',
  'tarot_deck_cards',
  'personalization_rules',
  'divination_systems',
  'system_elements',
  'cross_references',
  'system_compatibility',
  'user_subscription_status', // view
  'user_recent_readings', // view
];

// Directories to search
const SEARCH_DIRS = ['src', 'app', 'supabase'];

// Directories to ignore
const IGNORE_DIRS = ['node_modules', '.expo', 'dist', 'build', 'android', 'ios'];

// File extensions to search
const SEARCH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql'];

interface TableReference {
  filePath: string;
  lineNumber: number;
  context: string;
  matchType: 'from_call' | 'type_definition' | 'sql_reference' | 'string_match';
}

interface TableAuditResult {
  tableName: string;
  references: TableReference[];
  totalCount: number;
}

/**
 * Check if a directory should be ignored
 */
function shouldIgnoreDir(dirName: string): boolean {
  return IGNORE_DIRS.some(ignore => dirName.includes(ignore));
}

/**
 * Check if a file should be processed
 */
function shouldProcessFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return SEARCH_EXTENSIONS.includes(ext);
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
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

/**
 * Search for table references in a file
 */
function searchTableInFile(
  filePath: string,
  tableName: string
): TableReference[] {
  const references: TableReference[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Pattern 1: .from('table_name') or .from("table_name")
      const fromPattern = new RegExp(
        `\\.from\\(['"]${tableName}['"]\\)`,
        'i'
      );
      if (fromPattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
          matchType: 'from_call',
        });
        return;
      }

      // Pattern 2: Type definitions like Database['public']['Tables']['table_name']
      const typePattern = new RegExp(
        `(?:Database|Tables|Views)\\s*\\[\\s*['"]public['"]\\s*\\]\\s*\\[\\s*['"]Tables['"]\\s*\\]\\s*\\[\\s*['"]${tableName}['"]\\s*\\]`,
        'i'
      );
      if (typePattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
          matchType: 'type_definition',
        });
        return;
      }

      // Pattern 3: SQL references (CREATE TABLE, SELECT FROM, etc.)
      if (filePath.endsWith('.sql')) {
        const sqlPattern = new RegExp(
          `(?:FROM|INTO|UPDATE|TABLE|VIEW)\\s+${tableName}\\b`,
          'i'
        );
        if (sqlPattern.test(line)) {
          references.push({
            filePath,
            lineNumber,
            context: trimmedLine,
            matchType: 'sql_reference',
          });
          return;
        }
      }

      // Pattern 4: String matches (comments, variable names, etc.)
      // Only if no other pattern matched
      if (references.length === 0 || references[references.length - 1].lineNumber !== lineNumber) {
        const stringPattern = new RegExp(`['"]${tableName}['"]`, 'i');
        if (stringPattern.test(line)) {
          // Check if it's not already captured by from_call pattern
          if (!fromPattern.test(line)) {
            references.push({
              filePath,
              lineNumber,
              context: trimmedLine,
              matchType: 'string_match',
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return references;
}

/**
 * Audit a single table
 */
function auditTable(tableName: string, allFiles: string[], excludeScript: boolean = true): TableAuditResult {
  const references: TableReference[] = [];
  const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'auditTableUsage.ts');

  allFiles.forEach(filePath => {
    // Exclude the audit script itself from results
    if (excludeScript && filePath === scriptPath) {
      return;
    }
    
    const fileReferences = searchTableInFile(filePath, tableName);
    references.push(...fileReferences);
  });

  return {
    tableName,
    references,
    totalCount: references.length,
  };
}

/**
 * Format and print audit results
 */
function printResults(results: TableAuditResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('SUPABASE TABLE USAGE AUDIT REPORT');
  console.log('='.repeat(80) + '\n');

  results.forEach(result => {
    console.log(`TABLE: ${result.tableName}`);
    console.log(`  References: ${result.totalCount}`);

    if (result.totalCount === 0) {
      console.log('  ⚠️  ORPHANED - No references found\n');
      return;
    }

    // Group references by file
    const byFile = result.references.reduce((acc, ref) => {
      if (!acc[ref.filePath]) {
        acc[ref.filePath] = [];
      }
      acc[ref.filePath].push(ref);
      return acc;
    }, {} as Record<string, TableReference[]>);

    // Print references grouped by file
    Object.entries(byFile).forEach(([filePath, refs]) => {
      const relativePath = path.relative(process.cwd(), filePath);
      refs.forEach(ref => {
        const matchTypeLabel = {
          from_call: '[FROM]',
          type_definition: '[TYPE]',
          sql_reference: '[SQL]',
          string_match: '[STRING]',
        }[ref.matchType];

        console.log(`  - ${relativePath}:${ref.lineNumber} ${matchTypeLabel}`);
        console.log(`    ${ref.context}`);
      });
    });

    console.log('');
  });

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const totalReferences = results.reduce((sum, r) => sum + r.totalCount, 0);
  const orphanedTables = results.filter(r => r.totalCount === 0).map(r => r.tableName);
  
  console.log(`Total tables audited: ${results.length}`);
  console.log(`Total references found: ${totalReferences}`);
  console.log(`Orphaned tables (0 references): ${orphanedTables.length}`);
  
  if (orphanedTables.length > 0) {
    console.log(`\n⚠️  Orphaned tables:`);
    orphanedTables.forEach(table => console.log(`  - ${table}`));
  }
  
  console.log('');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Starting Supabase table usage audit...\n');

  // Get all files to search
  const allFiles: string[] = [];
  
  SEARCH_DIRS.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Scanning directory: ${dir}`);
      const files = getAllFiles(dirPath);
      allFiles.push(...files);
      console.log(`   Found ${files.length} files`);
    } else {
      console.log(`⚠️  Directory not found: ${dir}`);
    }
  });

  console.log(`\n📊 Total files to search: ${allFiles.length}\n`);

  // Audit each table
  const results: TableAuditResult[] = [];
  
  TABLES_TO_AUDIT.forEach(tableName => {
    console.log(`🔎 Auditing: ${tableName}`);
    const result = auditTable(tableName, allFiles, true); // Exclude script itself
    results.push(result);
  });

  // Print results
  printResults(results);
}

// Run the script
main();

