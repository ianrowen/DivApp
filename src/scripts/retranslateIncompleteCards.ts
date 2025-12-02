/**
 * Re-translate Incomplete Tarot Cards
 * Identifies cards with missing or incomplete Chinese translations and re-translates them
 */

import fs from 'fs';
import path from 'path';

// Use require for CommonJS compatibility
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyDi7F_D4SNoICZtLaJ6wwxT_2vJTLAQ8Fk';
const GEMINI_MODEL = 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface LocalTarotCard {
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
}

interface IncompleteCard {
  card: LocalTarotCard;
  missingFields: string[];
}

async function translateWithGemini(text: string, context: string, cardTitle: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const prompt = `Translate this Tarot card ${context} to Traditional Chinese (繁體中文) as used in Taiwan.

Context: This is for a spiritual divination mobile app. The text describes Tarot card meanings.
Card: ${cardTitle}

English text: "${text}"

Requirements:
- Use Traditional Chinese characters (not Simplified)
- Use terminology appropriate for Taiwan's Tarot and spiritual divination community
- Maintain respectful, mystical tone
- Preserve the meaning and depth of the original
- Return ONLY the translated text, no explanations
- If the text is empty, return an empty string

Traditional Chinese translation:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text().trim();
    
    // Validate translation is not just whitespace or error message
    if (translation.length === 0 || translation.toLowerCase().includes('error') || translation.toLowerCase().includes('抱歉')) {
      return '';
    }
    
    return translation;
  } catch (error) {
    console.error(`  ✗ Translation failed:`, error);
    throw error;
  }
}

function findIncompleteCards(cards: LocalTarotCard[]): IncompleteCard[] {
  const incomplete: IncompleteCard[] = [];
  
  cards.forEach((card) => {
    const missingFields: string[] = [];
    
    // Check title (handle both string and object formats)
    if (typeof card.title === 'string') {
      // If title is a string, it needs to be converted to object format
      missingFields.push('title');
    } else if (!card.title.zh || card.title.zh.trim() === '') {
      missingFields.push('title');
    }
    
    // Check upright meaning
    if (!card.upright_meaning.zh || card.upright_meaning.zh.trim() === '') {
      missingFields.push('upright_meaning');
    }
    
    // Check reversed meaning
    if (!card.reversed_meaning.zh || card.reversed_meaning.zh.trim() === '') {
      missingFields.push('reversed_meaning');
    }
    
    // Check description (optional field)
    if (card.description && (!card.description.zh || card.description.zh.trim() === '')) {
      missingFields.push('description');
    }
    
    if (missingFields.length > 0) {
      incomplete.push({ card, missingFields });
    }
  });
  
  return incomplete;
}

async function retranslateIncompleteCards() {
  console.log('🔄 Re-translate Incomplete Tarot Cards Script\n');
  console.log('='.repeat(60));
  console.log('Scanning for incomplete translations...\n');
  
  try {
    // Read card data
    const dataPath = path.join(__dirname, '../systems/tarot/data/localCardData.ts');
    const dataContent = fs.readFileSync(dataPath, 'utf-8');
    
    // Extract cards array using regex
    const cardsMatch = dataContent.match(/export const LOCAL_RWS_CARDS[^[]*(\[[\s\S]*?\]);/);
    if (!cardsMatch) {
      throw new Error('Could not find LOCAL_RWS_CARDS');
    }
    
    // Parse cards (using eval is safe here - it's our own code)
    const cards: LocalTarotCard[] = eval(cardsMatch[1]);
    console.log(`✓ Loaded ${cards.length} cards\n`);
    
    // Find incomplete cards
    const incompleteCards = findIncompleteCards(cards);
    
    if (incompleteCards.length === 0) {
      console.log('✓ All cards are fully translated! No incomplete translations found.\n');
      return;
    }
    
    console.log(`Found ${incompleteCards.length} card(s) with incomplete translations:\n`);
    
    incompleteCards.forEach(({ card, missingFields }) => {
      const cardTitleEn = typeof card.title === 'string' 
        ? card.title 
        : (card.title && typeof card.title === 'object' && card.title.en) 
          ? card.title.en 
          : card.code || 'Unknown';
      console.log(`  • ${cardTitleEn} (${card.code})`);
      console.log(`    Missing: ${missingFields.join(', ')}\n`);
    });
    
    console.log('='.repeat(60));
    console.log('Re-translating incomplete cards...\n');
    
    let translatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const { card, missingFields } of incompleteCards) {
      try {
        // Get card title for display (handle both string and object formats)
        const cardTitleEn = typeof card.title === 'string' ? card.title : (card.title?.en || 'Unknown');
        console.log(`Translating: ${cardTitleEn} (${card.code})`);
        let updated = false;
        
        // Translate title if missing
        if (missingFields.includes('title')) {
          // Get English title (handle both string and object formats)
          const titleEn = typeof card.title === 'string' ? card.title : (card.title?.en || '');
          
          if (!titleEn) {
            console.log(`  ⚠ Skipping title (English title is missing)`);
            skippedCount++;
          } else {
            // Use canonical name lookup (same as translateTarotData.ts)
            const canonicalNames: Record<string, string> = {
              'The Fool': '愚者', 'The Magician': '魔術師', 'The High Priestess': '女祭司',
              'The Empress': '皇后', 'The Emperor': '皇帝', 'The Hierophant': '教皇',
              'The Lovers': '戀人', 'The Chariot': '戰車', 'Strength': '力量',
              'The Hermit': '隱者', 'Wheel of Fortune': '命運之輪', 'Justice': '正義',
              'The Hanged Man': '倒吊人', 'Death': '死神', 'Temperance': '節制',
              'The Devil': '惡魔', 'The Tower': '高塔', 'The Star': '星星',
              'The Moon': '月亮', 'The Sun': '太陽', 'Judgement': '審判', 'The World': '世界',
              'Wands': '權杖', 'Cups': '聖杯', 'Swords': '寶劍', 'Pentacles': '錢幣',
              'Ace': '王牌', 'Page': '侍者', 'Knight': '騎士', 'Queen': '皇后', 'King': '國王',
              'Two': '二', 'Three': '三', 'Four': '四', 'Five': '五', 'Six': '六',
              'Seven': '七', 'Eight': '八', 'Nine': '九', 'Ten': '十'
            };
            
            let titleZh = canonicalNames[titleEn];
            if (!titleZh) {
              const parts = titleEn.split(' of ');
              if (parts.length === 2) {
                const rankZh = canonicalNames[parts[0]] || parts[0];
                const suitZh = canonicalNames[parts[1]] || parts[1];
                titleZh = `${suitZh}${rankZh}`;
              } else {
                titleZh = titleEn;
              }
            }
            
            // Update title (handle both formats)
            if (typeof card.title === 'string') {
              card.title = { en: titleEn, zh: titleZh };
            } else {
              card.title.zh = titleZh;
            }
            console.log(`  ✓ Title: "${titleEn}" → "${titleZh}"`);
            updated = true;
          }
        }
        
        // Translate upright meaning if missing
        if (missingFields.includes('upright_meaning')) {
          if (card.upright_meaning.en && card.upright_meaning.en.trim() !== '') {
            const translation = await translateWithGemini(
              card.upright_meaning.en,
              'upright meaning',
              cardTitleEn
            );
            if (translation) {
              card.upright_meaning.zh = translation;
              console.log(`  ✓ Upright meaning translated`);
              updated = true;
            } else {
              console.log(`  ⚠ Upright meaning translation returned empty`);
            }
          } else {
            console.log(`  ⚠ Skipping upright meaning (English text is empty)`);
            skippedCount++;
          }
        }
        
        // Translate reversed meaning if missing
        if (missingFields.includes('reversed_meaning')) {
          if (card.reversed_meaning.en && card.reversed_meaning.en.trim() !== '') {
            const translation = await translateWithGemini(
              card.reversed_meaning.en,
              'reversed meaning',
              cardTitleEn
            );
            if (translation) {
              card.reversed_meaning.zh = translation;
              console.log(`  ✓ Reversed meaning translated`);
              updated = true;
            } else {
              console.log(`  ⚠ Reversed meaning translation returned empty`);
            }
          } else {
            console.log(`  ⚠ Skipping reversed meaning (English text is empty)`);
            skippedCount++;
          }
        }
        
        // Translate description if missing
        if (missingFields.includes('description')) {
          if (card.description && card.description.en && card.description.en.trim() !== '') {
            const translation = await translateWithGemini(
              card.description.en,
              'description',
              cardTitleEn
            );
            if (translation) {
              if (!card.description) {
                card.description = { en: '', zh: '' };
              }
              card.description.zh = translation;
              console.log(`  ✓ Description translated`);
              updated = true;
            } else {
              console.log(`  ⚠ Description translation returned empty`);
            }
          } else {
            console.log(`  ⚠ Skipping description (English text is empty or field doesn't exist)`);
            skippedCount++;
          }
        }
        
        if (updated) {
          translatedCount++;
          console.log(`  ✓ Complete\n`);
        } else {
          failedCount++;
          console.log(`  ✗ No translations were updated\n`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        const cardTitleEn = typeof card.title === 'string' ? card.title : (card.title?.en || 'Unknown');
        console.error(`  ✗ Failed to translate ${cardTitleEn}:`, error);
        failedCount++;
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    console.log(`Summary:`);
    console.log(`  Cards processed: ${incompleteCards.length}`);
    console.log(`  Successfully translated: ${translatedCount}`);
    console.log(`  Failed: ${failedCount}`);
    console.log(`  Skipped (empty source): ${skippedCount}`);
    console.log('='.repeat(60) + '\n');
    
    // Write updated file
    if (translatedCount > 0) {
      const backupPath = dataPath + '.pre-retranslation.backup';
      fs.copyFileSync(dataPath, backupPath);
      console.log(`✓ Backup created: ${backupPath}`);
      
      // Update interface definition
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
      console.log(`✓ Updated file written: ${dataPath}\n`);
      
      console.log('✓ Re-translation complete!');
    } else {
      console.log('⚠ No translations were updated. Check the errors above.\n');
    }
    
  } catch (error) {
    console.error('\n✗ Re-translation failed:', error);
    process.exit(1);
  }
}

retranslateIncompleteCards();

