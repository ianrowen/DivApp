// src/systems/tarot/models/TarotReading.ts
/**
 * Tarot Reading Implementation
 * * Extends the base Reading class with Tarot-specific logic:
 * - Card drawing (shuffle, draw, reversals)
 * - Spread layouts
 * - Card interpretation prompts
 */

import { Reading, ReadingMetadata, ElementDrawn } from '../../../core/models/Reading'; // Corrected import
import { supabase } from '../../../core/api/supabase';

// --- INTERFACE DEFINITIONS ---
// You provided these earlier, maintaining them here for context

export interface TarotCard {
  id: string;
  deck_id: string;
  code: string; // "00", "01", etc.
  title: string; // "The Fool"
  arcana: 'Major' | 'Minor';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  keywords: string[];
  element?: string;
  astrology?: string;
  upright_meaning: Record<string, string>; // JSONB: {en: "...", zh_tw: "..."}
  reversed_meaning: Record<string, string>; // JSONB
  image_url: string;
}

export interface TarotSpread {
  id: string;
  name: Record<string, string>; // JSONB: {en: "Past Present Future", zh_tw: "過去現在未來"}
  positions: SpreadPosition[];
  card_count: number;
}

export interface SpreadPosition {
  position: number;
  label: Record<string, string>; // JSONB: {en: "Past", zh_tw: "過去"}
  description?: Record<string, string>;
}

export interface TarotMetadata extends ReadingMetadata {
  spreadId: string;
  deckId?: string; // Optional - defaults to RWS
  allowReversals?: boolean;
  customData?: {
    drawingMode?: 'auto' | 'manual' | 'sequential';
    selectedCards?: string[]; // For manual mode
    reflection?: string; // User's reflection after reading
  };
}

export interface TarotElementDrawn extends ElementDrawn {
  cardId: string;
  position: string; // "Past", "Present", "Future", etc.
  metadata: {
    cardTitle: string;
    cardCode: string;
    positionLabel: string;
    reversed: boolean;
  };
}

// --- CLASS IMPLEMENTATION ---

export class TarotReading extends Reading {
  private spread?: TarotSpread;
  private deck: TarotCard[] = [];
  private drawnCards: (TarotCard & { reversed: boolean })[] = [];

  constructor(metadata: TarotMetadata) {
    super(metadata as ReadingMetadata); // Pass to base class
  }

  /**
   * HOOK: Validate Tarot-specific requirements
   */
  protected async validate(): Promise<void> {
    await super.validate();

    const meta = this.metadata as TarotMetadata;
    
    if (!meta.spreadId) {
      throw new Error('Spread ID is required for Tarot reading');
    }

    // Load spread definition
    const { data: spreadData, error: spreadError } = await supabase
      .from('tarot_spreads') // Assumes a 'tarot_spreads' table exists
      .select('*')
      .eq('id', meta.spreadId)
      .single();

    if (spreadError || !spreadData) {
      throw new Error('Invalid spread ID');
    }

    this.spread = spreadData as TarotSpread;
  }

  /**
   * HOOK: Load the deck (context)
   */
  protected async loadUserContext(): Promise<void> {
    const meta = this.metadata as TarotMetadata;
    const deckId = meta.deckId || 'default-rws';

    // Load all cards for the specified deck
    const { data: cardsData, error: cardsError } = await supabase
      .from('tarot_deck_cards') // Assumes a 'tarot_deck_cards' table exists
      .select('*')
      .eq('deck_id', deckId)
      .order('card_number');

    if (cardsError || !cardsData || cardsData.length !== 78) {
      console.warn(`Deck load failed: ${cardsError?.message}`);
      throw new Error('Failed to load deck or incomplete deck');
    }

    this.deck = cardsData as TarotCard[];
  }

  /**
   * HOOK: Draw cards for the reading
   */
  protected async draw(): Promise<void> {
    if (!this.spread) {
      throw new Error('Spread not loaded');
    }

    const meta = this.metadata as TarotMetadata;
    const cardCount = this.spread.card_count;
    const allowReversals = meta.allowReversals !== false; // Default true

    // Only implementing automatic draw for MVP
    await this.drawAutomatic(cardCount, allowReversals);

    // Convert drawn cards to ElementDrawn format
    this.elementsDrawn = this.drawnCards.map((card, index) => {
      const position = this.spread!.positions[index];
      const language = this.metadata.language || 'en';
      
      return {
        elementId: card.id,
        position: position?.label[language] || `Position ${index + 1}`,
        metadata: {
          cardTitle: card.title,
          cardCode: card.code,
          positionLabel: position?.label[language] || '',
          reversed: card.reversed,
        },
      } as TarotElementDrawn;
    });
  }

  /**
   * Automatic card drawing logic
   */
  private async drawAutomatic(count: number, allowReversals: boolean): Promise<void> {
    const shuffled = [...this.deck];
    // Simple shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (let i = 0; i < count; i++) {
      const card = shuffled[i];
      const reversed = allowReversals ? Math.random() < 0.3 : false; // 30% chance of reversal
      this.drawnCards.push({ ...card, reversed });
    }
  }
  
  /**
   * HOOK: Generate AI interpretation
   */
  protected async interpret(): Promise<void> {
    const language = this.metadata.language || 'en';
    const systemPrompt = this.buildSystemPrompt(language);
    const prompt = this.buildPrompt(language);

    // Call base class helper, which sets this.interpretation and this.aiResult
    await this.callAI(prompt, systemPrompt);
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(language: string): string {
    const systemPrompts: Record<string, string> = {
      en: `You are an expert Tarot reader with deep knowledge of symbolism, archetypes, and intuitive interpretation. 
Your readings are insightful, compassionate, and empowering. You help people gain clarity and perspective.
Provide a cohesive narrative that weaves the cards together, not just individual card meanings.
Be specific to their question if provided. Use rich imagery and metaphor.`,
      'zh-TW': `你是一位精通塔羅牌的專家，對符號學、原型和直覺解讀有深刻的理解。
你的解讀富有洞察力、同理心和賦權性。你幫助人們獲得清晰和觀點。
提供一個連貫的敘事，將牌面編織在一起，而不僅僅是單獨的牌義。
如果提供了問題，請針對他們的問題進行解讀。使用豐富的意象和隱喻。`,
    };

    return systemPrompts[language] || systemPrompts.en;
  }

  /**
   * Build user prompt with cards and question
   */
  private buildPrompt(language: string): string {
    const meta = this.metadata as TarotMetadata;
    const question = meta.question || '';
    
    let prompt = language === 'zh-TW' 
      ? `請為以下塔羅牌解讀提供詳細的詮釋：\n\n`
      : `Please provide a detailed interpretation for this Tarot reading:\n\n`;

    if (question) {
      prompt += language === 'zh-TW'
        ? `問題：${question}\n\n`
        : `Question: ${question}\n\n`;
    }

    prompt += language === 'zh-TW'
      ? `牌陣：${this.spread!.name[language] || this.spread!.name.en}\n\n`
      : `Spread: ${this.spread!.name[language] || this.spread!.name.en}\n\n`;

    prompt += language === 'zh-TW' ? `抽到的牌：\n` : `Cards Drawn:\n`;
    
    this.drawnCards.forEach((card, index) => {
      const position = this.spread!.positions[index];
      const positionLabel = position.label[language] || position.label.en;
      const reversed = card.reversed ? (language === 'zh-TW' ? '（逆位）' : '(Reversed)') : '';
      
      prompt += `${index + 1}. ${positionLabel}: ${card.title}${reversed}\n`;
      
      const meaning = card.reversed 
        ? card.reversed_meaning[language] || card.reversed_meaning.en
        : card.upright_meaning[language] || card.upright_meaning.en;
      
      prompt += `   ${language === 'zh-TW' ? '關鍵字' : 'Keywords'}: ${card.keywords.join(', ')}\n`;
      prompt += `   ${language === 'zh-TW' ? '基本含義' : 'Basic Meaning'}: ${meaning}\n\n`;
    });

    if (meta.customData?.reflection) {
      prompt += language === 'zh-TW'
        ? `\n提問者的思考：${meta.customData.reflection}\n`
        : `\nQuerent's Reflection: ${meta.customData.reflection}\n`;
    }

    prompt += language === 'zh-TW'
      ? `\n請提供一個連貫的解讀，將這些牌面編織成一個有意義的故事。`
      : `\nPlease provide a cohesive interpretation that weaves these cards into a meaningful narrative.`;

    return prompt;
  }
}

export default TarotReading;