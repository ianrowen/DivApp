#!/usr/bin/env ts-node
/**
 * Translation Check Script
 * 
 * Scans the codebase for potential hardcoded strings that should use translations.
 * 
 * Usage:
 *   npm run check-translations
 * 
 * This script helps ensure all user-facing text uses the translation system.
 */

import fs from 'fs';
import path from 'path';

// Patterns to detect hardcoded strings that might need translation
const HARDCODED_PATTERNS = [
  // Common UI strings
  /title:\s*['"](Statistics|History|Profile|Library|Reading|Home|Settings|About|Back|Next|Save|Cancel|Delete|Edit|OK|Error|Success|Loading|Sign In|Sign Out|Sign Up)[^'"]*['"]/gi,
  // Alert/Modal strings
  /Alert\.alert\([^,]+,\s*['"]([^'"]+)['"]/gi,
  // Button/link text
  /(title|label|text|placeholder|headerTitle|headerBackTitle):\s*['"]([A-Z][^'"]{3,})['"]/gi,
  // Screen options
  /options:\s*\{[^}]*title:\s*['"]([^'"]+)['"]/gi,
];

// Files/directories to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/scripts/**',
  '**/DivApp/**',
  '**/android/**',
  '**/ios/**',
  '**/*.backup',
  '**/translations/**',
];

// Known exceptions (legitimate hardcoded strings)
const EXCEPTIONS = [
  'Divin8', // Brand name
  'Rider-Waite-Smith', // Proper noun
  'I Ching', // Proper noun
  'Tarot', // Can be kept as-is
  'iOS', 'Android', // Platform names
  'Google', 'Apple', // Brand names
  'Expo', // Framework name
];

interface Issue {
  file: string;
  line: number;
  column: number;
  text: string;
  suggestion: string;
}

function checkFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    // Check for hardcoded strings in common patterns
    HARDCODED_PATTERNS.forEach((pattern) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach((match) => {
        const text = match[1] || match[0];
        
        // Skip if it's an exception
        if (EXCEPTIONS.some(exception => text.includes(exception))) {
          return;
        }

        // Skip if it's already using t() function
        if (line.includes('t(') || line.includes('useTranslation')) {
          return;
        }

        // Skip if it's a translation key path
        if (text.includes('.') && !text.includes(' ')) {
          return;
        }

        // Skip very short strings (likely variables or technical terms)
        if (text.length < 4) {
          return;
        }

        issues.push({
          file: filePath,
          line: index + 1,
          column: (match.index || 0) + 1,
          text: text.substring(0, 50),
          suggestion: `Consider using t('...') instead of hardcoded string`,
        });
      });
    });
  });

  return issues;
}

function findFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip ignored directories
      const shouldIgnore = IGNORE_PATTERNS.some((pattern) => {
        const relativePath = path.relative(process.cwd(), filePath);
        return pattern.includes(relativePath) || 
               relativePath.includes('node_modules') ||
               relativePath.includes('build') ||
               relativePath.includes('dist') ||
               relativePath.includes('DivApp') ||
               relativePath.includes('android') ||
               relativePath.includes('ios');
      });

      if (!shouldIgnore) {
        findFiles(filePath, fileList);
      }
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx') && !file.endsWith('.spec.ts') && !file.endsWith('.spec.tsx') && !file.includes('.backup')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

async function main() {
  console.log('🔍 Checking for hardcoded strings that should use translations...\n');

  // Find all TypeScript/TSX files
  const files = findFiles(process.cwd());

  console.log(`📁 Scanning ${files.length} files...\n`);

  const allIssues: Issue[] = [];

  files.forEach((file) => {
    try {
      const issues = checkFile(file);
      allIssues.push(...issues);
    } catch (error) {
      console.error(`Error checking ${file}:`, error);
    }
  });

  if (allIssues.length === 0) {
    console.log('✅ No hardcoded strings found! All text appears to use translations.\n');
    return;
  }

  console.log(`⚠️  Found ${allIssues.length} potential hardcoded string(s):\n`);

  // Group by file
  const issuesByFile = new Map<string, Issue[]>();
  allIssues.forEach((issue) => {
    const relativePath = path.relative(process.cwd(), issue.file);
    if (!issuesByFile.has(relativePath)) {
      issuesByFile.set(relativePath, []);
    }
    issuesByFile.get(relativePath)!.push(issue);
  });

  // Print issues grouped by file
  issuesByFile.forEach((issues, file) => {
    console.log(`📄 ${file}:`);
    issues.forEach((issue) => {
      console.log(`   Line ${issue.line}:${issue.column} - "${issue.text}"`);
      console.log(`   💡 ${issue.suggestion}\n`);
    });
  });

  console.log(`\n💡 Tips:`);
  console.log(`   - Use t('translation.key') instead of hardcoded strings`);
  console.log(`   - Add new keys to src/i18n/translations/en.ts`);
  console.log(`   - Run 'npm run sync-translations' to auto-translate to Chinese`);
  console.log(`   - See TRANSLATION_GUIDE.md for best practices\n`);

  process.exit(allIssues.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

