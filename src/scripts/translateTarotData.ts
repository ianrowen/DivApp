/**
 * Translate Tarot Card Data
 * Uses Gemini AI to translate card meanings, with canonical names from Taiwan Tarot community
 */

import fs from 'fs';
import path from 'path';

// Use require for CommonJS compatibility
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyDi7F_D4SNoICZtLaJ6wwxT_2vJTLAQ8Fk'; // TODO: Replace with actual key
const GEMINI_MODEL = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Canonical Traditional Chinese card names (from Taiwan Tarot community/Wikipedia)
const CANONICAL_NAMES: Record<string, string> = {
  // Major Arcana
  'The Fool': '愚者',
  'The Magician': '魔術師',
  'The High Priestess': '女祭司',
  'The Empress': '皇后',
  'The Emperor': '皇帝',
  'The Hierophant': '教皇',
  'The Lovers': '戀人',
  'The Chariot': '戰車',
  'Strength': '力量',
  'The Hermit': '隱者',
  'Wheel of Fortune': '命運之輪',
  'Justice': '正義',
  'The Hanged Man': '倒吊人',
  'Death': '死神',
  'Temperance': '節制',
  'The Devil': '惡魔',
  'The Tower': '高塔',
  'The Star': '星星',
  'The Moon': '月亮',
  'The Sun': '太陽',
  'Judgement': '審判',
  'The World': '世界',
  
  // Suits
  'Wands': '權杖',
  'Cups': '聖杯',
  'Swords': '寶劍',
  'Pentacles': '錢幣',
  
  // Court titles
  'Ace': '王牌',
  'Page': '侍者',
  'Knight': '騎士',
  'Queen': '皇后',
  'King': '國王',
  
  // Numbers
  'Two': '二',
  'Three': '三',
  'Four': '四',
  'Five': '五',
  'Six': '六',
  'Seven': '七',
  'Eight': '八',
  'Nine': '九',
  'Ten': '十'
};

function getCanonicalChineseName(englishTitle: string): string {
  // Check if it's a Major Arcana
  if (CANONICAL_NAMES[englishTitle]) {
    return CANONICAL_NAMES[englishTitle];
  }
  
  // For Minor Arcana, construct name from parts
  // e.g., "Ace of Cups" → "聖杯王牌"
  const parts = englishTitle.split(' of ');
  if (parts.length === 2) {
    const [rank, suit] = parts;
    const rankZh = CANONICAL_NAMES[rank] || rank;
    const suitZh = CANONICAL_NAMES[suit] || suit;
    return `${suitZh}${rankZh}`;
  }
  
  // For Court cards without "of"
  // e.g., "Page of Swords" is already handled above
  return englishTitle; // Fallback
}

async function translateWithGemini(text: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const prompt = `Translate this Tarot card ${context} to Traditional Chinese (繁體中文) as used in Taiwan.

Context: This is for a spiritual divination mobile app. The text describes Tarot card meanings.

English text: "${text}"

Requirements:
- Use Traditional Chinese characters (not Simplified)
- Use terminology appropriate for Taiwan's Tarot and spiritual divination community
- Maintain respectful, mystical tone
- Preserve the meaning and depth of the original
- Return ONLY the translated text, no explanations

Traditional Chinese translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`  ✗ Translation failed:`, error);
    throw error;
  }
}

async function translateTarotData() {
  console.log('🎴 Tarot Data Translation Script\n');
  console.log('='.repeat(60));
  console.log('Translating card data to Traditional Chinese...\n');
  
  try {
    // Read enhanced card data
    const dataPath = path.join(__dirname, '../systems/tarot/data/localCardData.ts');
    const dataContent = fs.readFileSync(dataPath, 'utf-8');
    
    // Extract cards array
    const cardsMatch = dataContent.match(/export const LOCAL_RWS_CARDS[^[]*(\[[\s\S]*?\]);/);
    if (!cardsMatch) {
      throw new Error('Could not find LOCAL_RWS_CARDS');
    }
    
    const cards = eval(cardsMatch[1]);
    console.log(`✓ Loaded ${cards.length} cards\n`);
    
    console.log('Translating with Gemini AI...\n');
    
    let translatedCount = 0;
    let failedCount = 0;
    
    for (const card of cards) {
      try {
        console.log(`Translating: ${card.title}`);
        
        // Get original title (handle both string and object formats)
        const originalTitle = typeof card.title === 'string' ? card.title : card.title.en || card.title;
        
        // Use canonical name
        const titleZh = getCanonicalChineseName(originalTitle);
        console.log(`  ✓ Title: "${originalTitle}" → "${titleZh}"`);
        
        // Translate upright meaning
        const uprightZh = await translateWithGemini(
          card.upright_meaning.en,
          'upright meaning'
        );
        console.log(`  ✓ Upright meaning translated`);
        
        // Translate reversed meaning
        const reversedZh = await translateWithGemini(
          card.reversed_meaning.en,
          'reversed meaning'
        );
        console.log(`  ✓ Reversed meaning translated`);
        
        // Translate description (if exists and not empty)
        let descZh = "";
        if (card.description && card.description.en) {
          descZh = await translateWithGemini(
            card.description.en,
            'description'
          );
          console.log(`  ✓ Description translated`);
        }
        
        // Update card object
        card.title = { en: originalTitle, zh: titleZh };
        card.upright_meaning.zh = uprightZh;
        card.reversed_meaning.zh = reversedZh;
        if (card.description) {
          card.description.zh = descZh;
        }
        
        translatedCount++;
        console.log(`  ✓ Complete (${translatedCount}/${cards.length})\n`);
        
      } catch (error) {
        console.error(`  ✗ Failed to translate ${card.title}\n`);
        failedCount++;
      }
    }
    
    console.log('='.repeat(60));
    console.log(`Summary:`);
    console.log(`  Translated: ${translatedCount} cards`);
    console.log(`  Failed: ${failedCount} cards`);
    console.log('='.repeat(60) + '\n');
    
    // Write updated file
    const backupPath = dataPath + '.pre-translation.backup';
    fs.copyFileSync(dataPath, backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
    
    // Update interface to support bilingual titles
    const updatedInterface = `export interface LocalTarotCard {
  code: string;
  title: { en: string; zh: string };
  arcana: 'Major' | 'Minor' | 'Court';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  filename: string;
  keywords: string[];
  astro: string;
  element: string;
  upright_meaning: { en: string; zh: string };
  reversed_meaning: { en: string; zh: string };
  description?: { en: string; zh: string };
}`;
    
    const fileContent = `// src/systems/tarot/data/localCardData.ts
/**
 * Bilingual Tarot card data for Divin8
 * 
 * English: TarotAPI.dev (A.E. Waite's Pictorial Key to the Tarot)
 * Chinese: AI-translated with canonical names from Taiwan Tarot community
 * 
 * Last updated: ${new Date().toISOString().split('T')[0]}
 */

${updatedInterface}

export const LOCAL_RWS_CARDS: LocalTarotCard[] = ${JSON.stringify(cards, null, 2)};

// Spread definitions for MVP
export const LOCAL_SPREADS = {
  'single-card': {
    id: 'single-card',
    name: { en: 'Single Card Draw', zh: '單張牌' },
    positions: [
      { position: 1, label: { en: 'The Heart of the Matter', zh: '問題核心' } }
    ],
    card_count: 1
  },
  'three-card': {
    id: 'three-card',
    name: { en: 'Past, Present, Future', zh: '過去、現在、未來' },
    positions: [
      { position: 1, label: { en: 'Past', zh: '過去' } },
      { position: 2, label: { en: 'Present', zh: '現在' } },
      { position: 3, label: { en: 'Future', zh: '未來' } }
    ],
    card_count: 3
  }
};
`;
    
    fs.writeFileSync(dataPath, fileContent, 'utf-8');
    console.log(`✓ Bilingual file written: ${dataPath}\n`);
    
    console.log('✓ Translation complete!');
    console.log('\nNext step: Update your code to use card.title.en and card.title.zh\n');
    
  } catch (error) {
    console.error('\n✗ Translation failed:', error);
    process.exit(1);
  }
}

translateTarotData();






