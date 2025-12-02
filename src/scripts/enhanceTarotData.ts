/**
 * Enhance Tarot Data Script
 * Fetches professional card meanings from TarotAPI.dev and merges with our existing data
 */

import fs from 'fs';
import path from 'path';

interface TarotAPICard {
  name: string;
  name_short: string;
  value: string;
  value_int: number;
  meaning_up: string;
  meaning_rev: string;
  desc: string;
  type: string;
  suit?: string;
}

interface LocalCard {
  code: string;
  title: string;
  arcana: 'Major' | 'Minor' | 'Court';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  filename: string;
  keywords: string[];
  astro: string;
  element: string;
}

interface EnhancedCard extends LocalCard {
  upright_meaning: { en: string; zh: string };
  reversed_meaning: { en: string; zh: string };
  description: { en: string; zh: string };
}

// Manually define our card list (extracted from localCardData.ts)
const LOCAL_CARDS: LocalCard[] = [
  // MAJOR ARCANA
  { code: "00", title: "The Fool", arcana: "Major", filename: "00_Fool.jpg", keywords: ["Innocence", "Beginnings", "Spontaneity"], astro: "Uranus", element: "Air" },
  { code: "01", title: "The Magician", arcana: "Major", filename: "01_Magician.jpg", keywords: ["Power", "Skill", "Concentration"], astro: "Mercury", element: "Air" },
  { code: "02", title: "The High Priestess", arcana: "Major", filename: "02_High_Priestess.jpg", keywords: ["Intuition", "Mystery", "Subconscious"], astro: "Moon", element: "Water" },
  { code: "03", title: "The Empress", arcana: "Major", filename: "03_Empress.jpg", keywords: ["Fertility", "Nurturing", "Abundance"], astro: "Venus", element: "Earth" },
  { code: "04", title: "The Emperor", arcana: "Major", filename: "04_Emperor.jpg", keywords: ["Authority", "Structure", "Control"], astro: "Aries", element: "Fire" },
  { code: "05", title: "The Hierophant", arcana: "Major", filename: "05_Hierophant.jpg", keywords: ["Tradition", "Guidance", "Education"], astro: "Taurus", element: "Earth" },
  { code: "06", title: "The Lovers", arcana: "Major", filename: "06_Lovers.jpg", keywords: ["Union", "Choices", "Partnership"], astro: "Gemini", element: "Air" },
  { code: "07", title: "The Chariot", arcana: "Major", filename: "07_Chariot.jpg", keywords: ["Victory", "Willpower", "Direction"], astro: "Cancer", element: "Water" },
  { code: "08", title: "Strength", arcana: "Major", filename: "08_Strength.jpg", keywords: ["Courage", "Patience", "Compassion"], astro: "Leo", element: "Fire" },
  { code: "09", title: "The Hermit", arcana: "Major", filename: "09_Hermit.jpg", keywords: ["Introspection", "Solitude", "Guidance"], astro: "Virgo", element: "Earth" },
  { code: "10", title: "Wheel of Fortune", arcana: "Major", filename: "10_Wheel_of_Fortune.jpg", keywords: ["Change", "Cycles", "Destiny"], astro: "Jupiter", element: "Fire" },
  { code: "11", title: "Justice", arcana: "Major", filename: "11_Justice.jpg", keywords: ["Fairness", "Law", "Truth"], astro: "Libra", element: "Air" },
  { code: "12", title: "The Hanged Man", arcana: "Major", filename: "12_Hanged_Man.jpg", keywords: ["Sacrifice", "New perspective", "Release"], astro: "Neptune", element: "Water" },
  { code: "13", title: "Death", arcana: "Major", filename: "13_Death.jpg", keywords: ["Endings", "Transformation", "Transition"], astro: "Scorpio", element: "Water" },
  { code: "14", title: "Temperance", arcana: "Major", filename: "14_Temperance.jpg", keywords: ["Balance", "Moderation", "Purpose"], astro: "Sagittarius", element: "Fire" },
  { code: "15", title: "The Devil", arcana: "Major", filename: "15_Devil.jpg", keywords: ["Bondage", "Addiction", "Materialism"], astro: "Capricorn", element: "Earth" },
  { code: "16", title: "The Tower", arcana: "Major", filename: "16_Tower.jpg", keywords: ["Upheaval", "Sudden change", "Revelation"], astro: "Mars", element: "Fire" },
  { code: "17", title: "The Star", arcana: "Major", filename: "17_Star.jpg", keywords: ["Hope", "Faith", "Renewal"], astro: "Aquarius", element: "Air" },
  { code: "18", title: "The Moon", arcana: "Major", filename: "18_Moon.jpg", keywords: ["Illusion", "Fear", "Subconscious"], astro: "Pisces", element: "Water" },
  { code: "19", title: "The Sun", arcana: "Major", filename: "19_Sun.jpg", keywords: ["Joy", "Success", "Vitality"], astro: "Sun", element: "Fire" },
  { code: "20", title: "Judgement", arcana: "Major", filename: "20_Judgement.jpg", keywords: ["Rebirth", "Reckoning", "Awakening"], astro: "Pluto", element: "Fire" },
  { code: "21", title: "The World", arcana: "Major", filename: "21_World.jpg", keywords: ["Completion", "Achievement", "Fulfillment"], astro: "Saturn", element: "Earth" },
  
  // WANDS
  { code: "W01", title: "Ace of Wands", arcana: "Minor", suit: "Wands", filename: "W01_Ace_of_Wands.jpg", keywords: ["Creation", "Inspiration", "New venture"], astro: "Root of Fire", element: "Fire" },
  { code: "W02", title: "Two of Wands", arcana: "Minor", suit: "Wands", filename: "W02_Two_of_Wands.jpg", keywords: ["Planning", "Decisions", "Discovery"], astro: "Mars in Aries", element: "Fire" },
  { code: "W03", title: "Three of Wands", arcana: "Minor", suit: "Wands", filename: "W03_Three_of_Wands.jpg", keywords: ["Expansion", "Foresight", "Enterprise"], astro: "Sun in Aries", element: "Fire" },
  { code: "W04", title: "Four of Wands", arcana: "Minor", suit: "Wands", filename: "W04_Four_of_Wands.jpg", keywords: ["Celebration", "Harmony", "Home"], astro: "Venus in Aries", element: "Fire" },
  { code: "W05", title: "Five of Wands", arcana: "Minor", suit: "Wands", filename: "W05_Five_of_Wands.jpg", keywords: ["Competition", "Conflict", "Struggle"], astro: "Saturn in Leo", element: "Fire" },
  { code: "W06", title: "Six of Wands", arcana: "Minor", suit: "Wands", filename: "W06_Six_of_Wands.jpg", keywords: ["Victory", "Recognition", "Pride"], astro: "Jupiter in Leo", element: "Fire" },
  { code: "W07", title: "Seven of Wands", arcana: "Minor", suit: "Wands", filename: "W07_Seven_of_Wands.jpg", keywords: ["Defense", "Perseverance", "Challenge"], astro: "Mars in Leo", element: "Fire" },
  { code: "W08", title: "Eight of Wands", arcana: "Minor", suit: "Wands", filename: "W08_Eight_of_Wands.jpg", keywords: ["Speed", "Action", "Movement"], astro: "Mercury in Sagittarius", element: "Fire" },
  { code: "W09", title: "Nine of Wands", arcana: "Minor", suit: "Wands", filename: "W09_Nine_of_Wands.jpg", keywords: ["Resilience", "Persistence", "Last stand"], astro: "Moon in Sagittarius", element: "Fire" },
  { code: "W10", title: "Ten of Wands", arcana: "Minor", suit: "Wands", filename: "W10_Ten_of_Wands.jpg", keywords: ["Burden", "Responsibility", "Overwhelm"], astro: "Saturn in Sagittarius", element: "Fire" },
  { code: "W11", title: "Page of Wands", arcana: "Court", suit: "Wands", filename: "W11_Page_of_Wands.jpg", keywords: ["Enthusiasm", "Exploration", "Adventure"], astro: "Earth of Fire", element: "Fire" },
  { code: "W12", title: "Knight of Wands", arcana: "Court", suit: "Wands", filename: "W12_Knight_of_Wands.jpg", keywords: ["Action", "Impulsiveness", "Energy"], astro: "Fire of Fire", element: "Fire" },
  { code: "W13", title: "Queen of Wands", arcana: "Court", suit: "Wands", filename: "W13_Queen_of_Wands.jpg", keywords: ["Confidence", "Independence", "Determination"], astro: "Water of Fire", element: "Fire" },
  { code: "W14", title: "King of Wands", arcana: "Court", suit: "Wands", filename: "W14_King_of_Wands.jpg", keywords: ["Leadership", "Vision", "Honor"], astro: "Air of Fire", element: "Fire" },
  
  // CUPS
  { code: "C01", title: "Ace of Cups", arcana: "Minor", suit: "Cups", filename: "C01_Ace_of_Cups.jpg", keywords: ["Love", "Intuition", "Intimacy"], astro: "Root of Water", element: "Water" },
  { code: "C02", title: "Two of Cups", arcana: "Minor", suit: "Cups", filename: "C02_Two_of_Cups.jpg", keywords: ["Partnership", "Unity", "Connection"], astro: "Venus in Cancer", element: "Water" },
  { code: "C03", title: "Three of Cups", arcana: "Minor", suit: "Cups", filename: "C03_Three_of_Cups.jpg", keywords: ["Celebration", "Friendship", "Community"], astro: "Mercury in Cancer", element: "Water" },
  { code: "C04", title: "Four of Cups", arcana: "Minor", suit: "Cups", filename: "C04_Four_of_Cups.jpg", keywords: ["Apathy", "Contemplation", "Reevaluation"], astro: "Moon in Cancer", element: "Water" },
  { code: "C05", title: "Five of Cups", arcana: "Minor", suit: "Cups", filename: "C05_Five_of_Cups.jpg", keywords: ["Loss", "Regret", "Disappointment"], astro: "Mars in Scorpio", element: "Water" },
  { code: "C06", title: "Six of Cups", arcana: "Minor", suit: "Cups", filename: "C06_Six_of_Cups.jpg", keywords: ["Nostalgia", "Innocence", "Reunion"], astro: "Sun in Scorpio", element: "Water" },
  { code: "C07", title: "Seven of Cups", arcana: "Minor", suit: "Cups", filename: "C07_Seven_of_Cups.jpg", keywords: ["Choices", "Fantasy", "Illusion"], astro: "Venus in Scorpio", element: "Water" },
  { code: "C08", title: "Eight of Cups", arcana: "Minor", suit: "Cups", filename: "C08_Eight_of_Cups.jpg", keywords: ["Withdrawal", "Abandonment", "Journey"], astro: "Saturn in Pisces", element: "Water" },
  { code: "C09", title: "Nine of Cups", arcana: "Minor", suit: "Cups", filename: "C09_Nine_of_Cups.jpg", keywords: ["Contentment", "Satisfaction", "Wish fulfilled"], astro: "Jupiter in Pisces", element: "Water" },
  { code: "C10", title: "Ten of Cups", arcana: "Minor", suit: "Cups", filename: "C10_Ten_of_Cups.jpg", keywords: ["Harmony", "Family", "Happiness"], astro: "Mars in Pisces", element: "Water" },
  { code: "C11", title: "Page of Cups", arcana: "Court", suit: "Cups", filename: "C11_Page_of_Cups.jpg", keywords: ["Creativity", "Intuition", "Curiosity"], astro: "Earth of Water", element: "Water" },
  { code: "C12", title: "Knight of Cups", arcana: "Court", suit: "Cups", filename: "C12_Knight_of_Cups.jpg", keywords: ["Romance", "Charm", "Idealism"], astro: "Fire of Water", element: "Water" },
  { code: "C13", title: "Queen of Cups", arcana: "Court", suit: "Cups", filename: "C13_Queen_of_Cups.jpg", keywords: ["Compassion", "Emotional security", "Intuition"], astro: "Water of Water", element: "Water" },
  { code: "C14", title: "King of Cups", arcana: "Court", suit: "Cups", filename: "C14_King_of_Cups.jpg", keywords: ["Emotional balance", "Diplomacy", "Wisdom"], astro: "Air of Water", element: "Water" },
  
  // SWORDS
  { code: "S01", title: "Ace of Swords", arcana: "Minor", suit: "Swords", filename: "S01_Ace_of_Swords.jpg", keywords: ["Breakthrough", "Clarity", "Truth"], astro: "Root of Air", element: "Air" },
  { code: "S02", title: "Two of Swords", arcana: "Minor", suit: "Swords", filename: "S02_Two_of_Swords.jpg", keywords: ["Stalemate", "Indecision", "Avoidance"], astro: "Moon in Libra", element: "Air" },
  { code: "S03", title: "Three of Swords", arcana: "Minor", suit: "Swords", filename: "S03_Three_of_Swords.jpg", keywords: ["Heartbreak", "Sorrow", "Grief"], astro: "Saturn in Libra", element: "Air" },
  { code: "S04", title: "Four of Swords", arcana: "Minor", suit: "Swords", filename: "S04_Four_of_Swords.jpg", keywords: ["Rest", "Recovery", "Meditation"], astro: "Jupiter in Libra", element: "Air" },
  { code: "S05", title: "Five of Swords", arcana: "Minor", suit: "Swords", filename: "S05_Five_of_Swords.jpg", keywords: ["Conflict", "Defeat", "Dishonor"], astro: "Venus in Aquarius", element: "Air" },
  { code: "S06", title: "Six of Swords", arcana: "Minor", suit: "Swords", filename: "S06_Six_of_Swords.jpg", keywords: ["Transition", "Moving on", "Recovery"], astro: "Mercury in Aquarius", element: "Air" },
  { code: "S07", title: "Seven of Swords", arcana: "Minor", suit: "Swords", filename: "S07_Seven_of_Swords.jpg", keywords: ["Deception", "Strategy", "Betrayal"], astro: "Moon in Aquarius", element: "Air" },
  { code: "S08", title: "Eight of Swords", arcana: "Minor", suit: "Swords", filename: "S08_Eight_of_Swords.jpg", keywords: ["Restriction", "Trapped", "Self-imposed"], astro: "Jupiter in Gemini", element: "Air" },
  { code: "S09", title: "Nine of Swords", arcana: "Minor", suit: "Swords", filename: "S09_Nine_of_Swords.jpg", keywords: ["Anxiety", "Fear", "Nightmares"], astro: "Mars in Gemini", element: "Air" },
  { code: "S10", title: "Ten of Swords", arcana: "Minor", suit: "Swords", filename: "S10_Ten_of_Swords.jpg", keywords: ["Ruin", "Painful ending", "Hitting bottom"], astro: "Sun in Gemini", element: "Air" },
  { code: "S11", title: "Page of Swords", arcana: "Court", suit: "Swords", filename: "S11_Page_of_Swords.jpg", keywords: ["Vigilance", "Curiosity", "Truth-seeker"], astro: "Earth of Air", element: "Air" },
  { code: "S12", title: "Knight of Swords", arcana: "Court", suit: "Swords", filename: "S12_Knight_of_Swords.jpg", keywords: ["Direct", "Rushed", "Ambitious"], astro: "Air of Air", element: "Air" },
  { code: "S13", title: "Queen of Swords", arcana: "Court", suit: "Swords", filename: "S13_Queen_of_Swords.jpg", keywords: ["Sharp wit", "Honesty", "Independent"], astro: "Water of Air", element: "Air" },
  { code: "S14", title: "King of Swords", arcana: "Court", suit: "Swords", filename: "S14_King_of_Swords.jpg", keywords: ["Intellect", "Authority", "Fair judgment"], astro: "Fire of Air", element: "Air" },
  
  // PENTACLES
  { code: "P01", title: "Ace of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P01_Ace_of_Pentacles.jpg", keywords: ["New opportunity", "Prosperity", "Security"], astro: "Root of Earth", element: "Earth" },
  { code: "P02", title: "Two of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P02_Two_of_Pentacles.jpg", keywords: ["Balance", "Juggling", "Flexibility"], astro: "Jupiter in Capricorn", element: "Earth" },
  { code: "P03", title: "Three of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P03_Three_of_Pentacles.jpg", keywords: ["Teamwork", "Collaboration", "Skill"], astro: "Mars in Capricorn", element: "Earth" },
  { code: "P04", title: "Four of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P04_Four_of_Pentacles.jpg", keywords: ["Security", "Possessiveness", "Control"], astro: "Sun in Capricorn", element: "Earth" },
  { code: "P05", title: "Five of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P05_Five_of_Pentacles.jpg", keywords: ["Worry", "Poverty", "Isolation"], astro: "Mercury in Taurus", element: "Earth" },
  { code: "P06", title: "Six of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P06_Six_of_Pentacles.jpg", keywords: ["Giving", "Receiving", "Charity"], astro: "Moon in Taurus", element: "Earth" },
  { code: "P07", title: "Seven of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P07_Seven_of_Pentacles.jpg", keywords: ["Patience", "Assessment", "Waiting"], astro: "Saturn in Taurus", element: "Earth" },
  { code: "P08", title: "Eight of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P08_Eight_of_Pentacles.jpg", keywords: ["Apprenticeship", "Dedication", "Craftsmanship"], astro: "Sun in Virgo", element: "Earth" },
  { code: "P09", title: "Nine of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P09_Nine_of_Pentacles.jpg", keywords: ["Luxury", "Self-reliance", "Financial independence"], astro: "Venus in Virgo", element: "Earth" },
  { code: "P10", title: "Ten of Pentacles", arcana: "Minor", suit: "Pentacles", filename: "P10_Ten_of_Pentacles.jpg", keywords: ["Wealth", "Family", "Inheritance"], astro: "Mercury in Virgo", element: "Earth" },
  { code: "P11", title: "Page of Pentacles", arcana: "Court", suit: "Pentacles", filename: "P11_Page_of_Pentacles.jpg", keywords: ["New career path", "Opportunity", "Study"], astro: "Earth of Earth", element: "Earth" },
  { code: "P12", title: "Knight of Pentacles", arcana: "Court", suit: "Pentacles", filename: "P12_Knight_of_Pentacles.jpg", keywords: ["Hard work", "Reliable", "Routine"], astro: "Air of Earth", element: "Earth" },
  { code: "P13", title: "Queen of Pentacles", arcana: "Court", suit: "Pentacles", filename: "P13_Queen_of_Pentacles.jpg", keywords: ["Nurturing", "Practical", "Generous"], astro: "Water of Earth", element: "Earth" },
  { code: "P14", title: "King of Pentacles", arcana: "Court", suit: "Pentacles", filename: "P14_King_of_Pentacles.jpg", keywords: ["Success", "Security", "Reliability"], astro: "Fire of Earth", element: "Earth" }
];

async function enhanceTarotData() {
  console.log('🎴 Tarot Data Enhancement Script\n');
  console.log('='.repeat(60));
  console.log('Fetching professional meanings from TarotAPI.dev...\n');
  
  try {
    // Fetch all cards from TarotAPI
    const response = await fetch('https://tarotapi.dev/api/v1/cards');
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const apiCards: TarotAPICard[] = data.cards;
    
    console.log(`✓ Fetched ${apiCards.length} cards from TarotAPI.dev\n`);
    console.log('Matching and enhancing cards...\n');
    
    // Create name mapping for matching
    const createMatcher = (title: string): string => {
      return title.toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/\s+of\s+/g, '_of_')
        .replace(/\s+/g, '_');
    };
    
    // Build API lookup
    const apiLookup = new Map<string, TarotAPICard>();
    apiCards.forEach(card => {
      const key = createMatcher(card.name);
      apiLookup.set(key, card);
    });
    
    // Enhance each card
    let enhancedCount = 0;
    let notFoundCount = 0;
    
    const enhancedCards: EnhancedCard[] = LOCAL_CARDS.map((localCard) => {
      const matchKey = createMatcher(localCard.title);
      const apiCard = apiLookup.get(matchKey);
      
      if (!apiCard) {
        console.warn(`  ⚠ No API match: ${localCard.title} (key: ${matchKey})`);
        notFoundCount++;
        // Keep with placeholder
        return {
          ...localCard,
          upright_meaning: { en: `${localCard.title} represents ${localCard.keywords.join(', ')}.`, zh: "" },
          reversed_meaning: { en: `When reversed, ${localCard.title} indicates challenges.`, zh: "" },
          description: { en: "", zh: "" }
        };
      }
      
      console.log(`  ✓ ${localCard.title}`);
      enhancedCount++;
      
      return {
        ...localCard,
        upright_meaning: {
          en: apiCard.meaning_up,
          zh: ""
        },
        reversed_meaning: {
          en: apiCard.meaning_rev,
          zh: ""
        },
        description: {
          en: apiCard.desc,
          zh: ""
        }
      };
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Summary:`);
    console.log(`  Enhanced: ${enhancedCount} cards`);
    console.log(`  Not found: ${notFoundCount} cards`);
    console.log('='.repeat(60) + '\n');
    
    // Generate enhanced TypeScript file
    const outputPath = path.join(__dirname, '../systems/tarot/data/localCardData.ts');
    const backupPath = outputPath + '.backup';
    
    // Backup original
    fs.copyFileSync(outputPath, backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
    
    const fileContent = `// src/systems/tarot/data/localCardData.ts
/**
 * Enhanced Tarot card data for Divin8
 * 
 * Meanings: TarotAPI.dev (based on A.E. Waite's Pictorial Key to the Tarot)
 * Structure & Correspondences: Divin8 custom data
 * 
 * Enhanced: ${new Date().toISOString().split('T')[0]}
 * Chinese translations: To be added via translate-tarot-data script
 */

export interface LocalTarotCard {
  code: string;
  title: string;
  arcana: 'Major' | 'Minor' | 'Court';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  filename: string;
  keywords: string[];
  astro: string;
  element: string;
  upright_meaning: { en: string; zh: string };
  reversed_meaning: { en: string; zh: string };
  description: { en: string; zh: string };
}

export const LOCAL_RWS_CARDS: LocalTarotCard[] = ${JSON.stringify(enhancedCards, null, 2)};

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
    
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✓ Enhanced file written: ${outputPath}\n`);
    
    console.log('✓ Enhancement complete!');
    console.log('\nNext steps:');
    console.log('1. Review the enhanced localCardData.ts');
    console.log('2. Run: npm run translate-tarot-data');
    console.log('3. Test in app\n');
    
  } catch (error) {
    console.error('\n✗ Enhancement failed:', error);
    process.exit(1);
  }
}

enhanceTarotData();
