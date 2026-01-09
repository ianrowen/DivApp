#!/usr/bin/env node
/**
 * Quick check for 'users' and 'user_profiles' table usage
 */

import * as fs from 'fs';
import * as path from 'path';

const TABLES = ['users', 'user_profiles'];
const SEARCH_DIRS = ['src', 'app'];
const IGNORE_DIRS = ['node_modules', '.expo', 'dist', 'build', 'android', 'ios'];
const SEARCH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface Reference {
  filePath: string;
  lineNumber: number;
  context: string;
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

function searchTableInFile(filePath: string, tableName: string): Reference[] {
  const references: Reference[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Pattern: .from('table_name') or .from("table_name")
      const fromPattern = new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'i');
      if (fromPattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
        });
      }
      
      // Pattern: Database['public']['Tables']['table_name']
      const typePattern = new RegExp(
        `(?:Database|Tables)\\s*\\[\\s*['"]public['"]\\s*\\]\\s*\\[\\s*['"]Tables['"]\\s*\\]\\s*\\[\\s*['"]${tableName}['"]\\s*\\]`,
        'i'
      );
      if (typePattern.test(line)) {
        references.push({
          filePath,
          lineNumber,
          context: trimmedLine,
        });
      }
    });
  } catch (error) {
    // Ignore errors
  }
  
  return references;
}

function main() {
  console.log('='.repeat(80));
  console.log('USERS AND USER_PROFILES TABLE USAGE REPORT');
  console.log('='.repeat(80));
  console.log('');
  
  // Get all files
  const allFiles: string[] = [];
  SEARCH_DIRS.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    const files = getAllFiles(dirPath);
    allFiles.push(...files);
  });
  
  // Search each table
  TABLES.forEach(tableName => {
    const references: Reference[] = [];
    
    allFiles.forEach(filePath => {
      const fileRefs = searchTableInFile(filePath, tableName);
      references.push(...fileRefs);
    });
    
    console.log(`TABLE: ${tableName}`);
    console.log(`  References: ${references.length}`);
    
    if (references.length === 0) {
      console.log('  ⚠️  No references found\n');
      return;
    }
    
    references.forEach(ref => {
      const relativePath = path.relative(process.cwd(), ref.filePath);
      console.log(`  - ${relativePath}:${ref.lineNumber} [FROM]`);
      console.log(`    ${ref.context}`);
    });
    
    console.log('');
  });
  
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('users: Used for subscription tier lookup and account deletion');
  console.log('user_profiles: Primary table for user profile management');
  console.log('');
}

main();

