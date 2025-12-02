/**
 * Translation Sync Script
 * 
 * Automatically translates missing Traditional Chinese keys using Gemini AI.
 * 
 * Usage:
 *   npm run sync-translations           # Translate and update zh-TW.ts
 *   npm run sync-translations:dry       # Show what would be translated
 *   npm run sync-translations:verbose   # Show detailed progress
 * 
 * Configuration:
 *   Update GEMINI_API_KEY below with your actual API key
 */

import fs from 'fs';
import path from 'path';

// Use require for CommonJS compatibility
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = 'AIzaSyDi7F_D4SNoICZtLaJ6wwxT_2vJTLAQ8Fk'; // TODO: Replace with actual key
const GEMINI_MODEL = 'gemini-2.5-flash';

// ============================================================================
// TYPES
// ============================================================================

type TranslationObject = {
  [key: string]: string | TranslationObject;
};

interface MissingKey {
  path: string;
  englishText: string;
}

// ============================================================================
// GEMINI API
// ============================================================================

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function translateWithGemini(
  keyPath: string,
  englishText: string,
  verbose: boolean = false
): Promise<string> {
  try {
    if (verbose) {
      console.log(`  Translating: ${keyPath}`);
    }
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const prompt = `Translate this English text to Traditional Chinese (繁體中文) as used in Taiwan.
Context: This is for a spiritual divination mobile app (Tarot, I Ching, astrology).
Translation key path: ${keyPath}
English text: "${englishText}"
Requirements:
- Use Traditional Chinese characters (not Simplified)
- Use terminology appropriate for Taiwan market
- Maintain respectful, mystical tone for spiritual content
- Keep similar length and style to English
- If the text is a brand name like "Divin8", keep it in English
- If the text contains placeholders like {{count}}, preserve them exactly
- Return ONLY the translated text, no explanations or quotes

Traditional Chinese translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text().trim();
    
    if (verbose) {
      console.log(`    EN: "${englishText}"`);
      console.log(`    ZH: "${translation}"`);
    }
    
    return translation;
  } catch (error) {
    console.error(`  ✗ Failed to translate "${englishText}":`, error);
    throw error;
  }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

function readTranslationFile(filePath: string): TranslationObject {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract the exported object using regex
    // Handles: export default { ... }
    const match = content.match(/export default\s+({[\s\S]+});?\s*$/);
    if (!match) {
      throw new Error(`Could not parse translation file: ${filePath}`);
    }
    
    // Use eval to parse (safe since it's our own code)
    const translations = eval(`(${match[1]})`);
    return translations;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}

function writeTranslationFile(
  translations: TranslationObject,
  filePath: string,
  dryRun: boolean = false
): void {
  if (dryRun) {
    console.log(`\n[DRY RUN] Would write to: ${filePath}`);
    return;
  }
  
  try {
    // Create backup
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`\n✓ Backup created: ${backupPath}`);
    
    // Format as TypeScript with proper indentation
    const content = `// Auto-generated translations - ${new Date().toISOString()}\nexport default ${JSON.stringify(translations, null, 2)};\n`;
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// ============================================================================
// TRANSLATION COMPARISON
// ============================================================================

function findMissingKeys(
  enObj: TranslationObject,
  zhObj: TranslationObject,
  currentPath: string = ''
): MissingKey[] {
  const missing: MissingKey[] = [];
  
  for (const key in enObj) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const enValue = enObj[key];
    const zhValue = zhObj[key];
    
    if (typeof enValue === 'string') {
      // Leaf node - check if translation exists
      if (!zhValue || typeof zhValue !== 'string') {
        missing.push({
          path: fullPath,
          englishText: enValue
        });
      }
    } else if (typeof enValue === 'object') {
      // Nested object - recurse
      const zhSubObj = (typeof zhValue === 'object' ? zhValue : {}) as TranslationObject;
      missing.push(...findMissingKeys(enValue as TranslationObject, zhSubObj, fullPath));
    }
  }
  
  return missing;
}

function setNestedValue(
  obj: TranslationObject,
  path: string,
  value: string
): void {
  const keys = path.split('.');
  let current: any = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function syncTranslations(options: {
  dryRun: boolean;
  verbose: boolean;
}): Promise<void> {
  console.log('🌏 Divin8 Translation Sync\n');
  console.log('Reading translation files...');
  
  // Paths
  const enPath = path.join(__dirname, '../i18n/translations/en.ts');
  const zhPath = path.join(__dirname, '../i18n/translations/zh-TW.ts');
  
  // Read files
  const enTranslations = readTranslationFile(enPath);
  const zhTranslations = readTranslationFile(zhPath);
  
  console.log('✓ Loaded en.ts');
  console.log('✓ Loaded zh-TW.ts\n');
  
  // Find missing keys
  console.log('Scanning for missing translations...');
  const missingKeys = findMissingKeys(enTranslations, zhTranslations);
  
  if (missingKeys.length === 0) {
    console.log('✓ No missing translations found. All keys are translated!\n');
    return;
  }
  
  console.log(`Found ${missingKeys.length} missing key(s) in zh-TW.ts:\n`);
  
  if (options.dryRun) {
    console.log('[DRY RUN MODE - No files will be modified]\n');
    missingKeys.forEach(({ path, englishText }) => {
      console.log(`  • ${path}`);
      console.log(`    EN: "${englishText}"\n`);
    });
    console.log(`\nRun without --dry-run to translate these keys.`);
    return;
  }
  
  // Translate missing keys
  console.log('Translating with Gemini API...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { path: keyPath, englishText } of missingKeys) {
    try {
      const translation = await translateWithGemini(keyPath, englishText, options.verbose);
      setNestedValue(zhTranslations, keyPath, translation);
      
      console.log(`  ✓ ${keyPath}`);
      if (!options.verbose) {
        console.log(`    "${englishText}" → "${translation}"`);
      }
      
      successCount++;
    } catch (error) {
      console.log(`  ✗ ${keyPath} - FAILED`);
      failCount++;
    }
  }
  
  // Write updated translations
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary:`);
  console.log(`  Translated: ${successCount} key(s)`);
  console.log(`  Failed: ${failCount} key(s)`);
  console.log(`  Total API calls: ${missingKeys.length}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (successCount > 0) {
    writeTranslationFile(zhTranslations, zhPath, false);
    console.log(`\n✓ Translation sync complete!\n`);
  } else {
    console.log(`\n✗ No translations were successful.\n`);
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

syncTranslations(options).catch(error => {
  console.error('\n✗ Script failed:', error);
  process.exit(1);
});
