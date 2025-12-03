/**
 * Automated Test for Translation Sync
 * 
 * This script:
 * 1. Backs up current translation files
 * 2. Adds test keys to en.ts
 * 3. Runs syncTranslations
 * 4. Verifies translations were added to zh-TW.ts
 * 5. Restores original files
 * 
 * Usage: npm run test-translations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_KEYS = {
  _test: {
    greeting: "Hello, mystical traveler",
    farewell: "May the stars guide you",
    cardName: "The Hermit",
    question: "What does my future hold?",
    nested: {
      deep: {
        value: "This is a deeply nested test value"
      }
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const symbols = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠'
  };
  console.log(`${symbols[type]} ${message}`);
}

function readTranslationFile(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/export default\s+({[\s\S]+});?\s*$/);
  if (!match) {
    throw new Error(`Could not parse: ${filePath}`);
  }
  return eval(`(${match[1]})`);
}

function writeTranslationFile(translations: any, filePath: string): void {
  const content = `export default ${JSON.stringify(translations, null, 2)};\n`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

function getValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }
  return current;
}

function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getAllKeys(obj[key], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTest(): Promise<void> {
  const enPath = path.join(__dirname, '../i18n/translations/en.ts');
  const zhPath = path.join(__dirname, '../i18n/translations/zh-TW.ts');
  const enBackup = `${enPath}.test-backup`;
  const zhBackup = `${zhPath}.test-backup`;

  try {
    console.log('\n🧪 Translation Sync Test\n');
    console.log('='.repeat(60));

    // Step 1: Backup original files
    log('Backing up original translation files...', 'info');
    fs.copyFileSync(enPath, enBackup);
    fs.copyFileSync(zhPath, zhBackup);
    log('Backups created', 'success');

    // Step 2: Add test keys to en.ts
    log('\nAdding test keys to en.ts...', 'info');
    const enTranslations = readTranslationFile(enPath);
    Object.assign(enTranslations, TEST_KEYS);
    writeTranslationFile(enTranslations, enPath);
    log(`Added ${getAllKeys(TEST_KEYS).length} test keys`, 'success');

    // Step 3: Run sync script
    log('\nRunning syncTranslations script...', 'info');
    console.log('-'.repeat(60));
    try {
      execSync('npm run sync-translations', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });
    } catch (error) {
      throw new Error('Sync script execution failed');
    }
    console.log('-'.repeat(60));

    // Step 4: Verify translations were added
    log('\nVerifying translations in zh-TW.ts...', 'info');
    const zhTranslations = readTranslationFile(zhPath);
    
    const testKeyPaths = getAllKeys(TEST_KEYS);
    let successCount = 0;
    let failCount = 0;

    for (const keyPath of testKeyPaths) {
      const enValue = getValue(TEST_KEYS, keyPath.replace('_test.', ''));
      const zhValue = getValue(zhTranslations._test, keyPath.replace('_test.', ''));

      if (zhValue && typeof zhValue === 'string' && zhValue !== enValue) {
        log(`  ${keyPath}: "${enValue}" → "${zhValue}"`, 'success');
        successCount++;
      } else {
        log(`  ${keyPath}: MISSING OR UNCHANGED`, 'error');
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    log(`\nTest Results:`, 'info');
    log(`  Translated: ${successCount}/${testKeyPaths.length}`, successCount === testKeyPaths.length ? 'success' : 'warn');
    log(`  Failed: ${failCount}/${testKeyPaths.length}`, failCount === 0 ? 'success' : 'error');

    if (successCount === testKeyPaths.length) {
      log('\n🎉 All tests passed! Translation sync is working correctly.\n', 'success');
    } else {
      log('\n⚠️  Some tests failed. Check the output above.\n', 'warn');
    }

  } catch (error) {
    log(`\nTest failed: ${error}`, 'error');
    throw error;
  } finally {
    // Step 5: Restore original files
    log('\nRestoring original translation files...', 'info');
    if (fs.existsSync(enBackup)) {
      fs.copyFileSync(enBackup, enPath);
      fs.unlinkSync(enBackup);
    }
    if (fs.existsSync(zhBackup)) {
      fs.copyFileSync(zhBackup, zhPath);
      fs.unlinkSync(zhBackup);
    }
    
    // Clean up any .backup files created by sync script
    const syncBackup = `${zhPath}.backup`;
    if (fs.existsSync(syncBackup)) {
      fs.unlinkSync(syncBackup);
    }
    
    log('Cleanup complete', 'success');
    console.log('='.repeat(60) + '\n');
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

runTest().catch(error => {
  console.error('\n✗ Test suite failed:', error);
  process.exit(1);
});








