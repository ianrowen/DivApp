// src/systems/tarot/models/TarotReading.ts
/**
 * Tarot Reading Implementation
 * 
 * Extends the base Reading class with Tarot-specific logic:
 * - Card drawing (shuffle, draw, reversals)
 * - Spread layouts
 * - Card interpretation prompts
 */

import Reading, { ReadingMetadata, ElementDrawn } from '../../../core/models/Reading';
import { supabase } from '../../../core/api/supabase';

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
  reversed: boolean;
  metadata: {
    cardTitle: string;
    cardCode: string;
    positionLabel: string;
  };
}

export class TarotReading extends Reading {
  private spread?: TarotSpread;
  private deck: TarotCard[] = [];
  private drawnCards: (TarotCard & { reversed: boolean })[] = [];

  constructor(metadata: TarotMetadata) {
    super(metadata);
  }

  /**
   * Validate Tarot-specific requirements
   */
  protected async validate(): Promise<void> {
    await super.validate();

    const meta = this.metadata as TarotMetadata;
    
    if (!meta.spreadId) {
      throw new Error('Spread ID is required for Tarot reading');
    }

    // Load spread definition
    const { data: spreadData, error: spreadError } = await supabase
      .from('tarot_spreads')
      .select('*')
      .eq('id', meta.spreadId)
      .single();

    if (spreadError || !spreadData) {
      throw new Error('Invalid spread ID');
    }

    this.spread = spreadData as TarotSpread;
  }

  /**
   * Load the deck and shuffle
   */
  protected async loadUserContext(): Promise<void> {
    const meta = this.metadata as TarotMetadata;
    const deckId = meta.deckId || 'default-rws'; // Default to Rider-Waite-Smith

    // Load all cards from the deck
    const { data: cardsData, error: cardsError } = await supabase
      .from('tarot_deck_cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('code');

    if (cardsError || !cardsData || cardsData.length !== 78) {
      throw new Error('Failed to load deck or incomplete deck');
    }

    this.deck = cardsData as TarotCard[];
    console.log(`Loaded ${this.deck.length} cards from deck ${deckId}`);
  }

  /**
   * Draw cards for the reading
   */
  protected async draw(): Promise<void> {
    if (!this.spread) {
      throw new Error('Spread not loaded');
    }

    const meta = this.metadata as TarotMetadata;
    const cardCount = this.spread.card_count;
    const allowReversals = meta.allowReversals !== false; // Default true

    // Handle different drawing modes
    if (meta.customData?.drawingMode === 'manual' && meta.customData.selectedCards) {
      // Manual selection mode
      await this.drawManual(meta.customData.selectedCards, allowReversals);
    } else {
      // Automatic draw (default)
      await this.drawAutomatic(cardCount, allowReversals);
    }

    // Convert drawn cards to ElementDrawn format
    this.elementsDrawn = this.drawnCards.map((card, index) => ({
      elementId: card.id,
      position: this.spread!.positions[index]?.label[this.metadata.language || 'en'] || `Position ${index + 1}`,
      metadata: {
        cardTitle: card.title,
        cardCode: card.code,
        positionLabel: this.spread!.positions[index]?.label[this.metadata.language || 'en'] || '',
        reversed: card.reversed,
      },
    })) as TarotElementDrawn[];
  }

  /**
   * Automatic card drawing (shuffle and draw)
   */
  private async drawAutomatic(count: number, allowReversals: boolean): Promise<void> {
    // Fisher-Yates shuffle
    const shuffled = [...this.deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Draw cards
    for (let i = 0; i < count; i++) {
      const card = shuffled[i];
      const reversed = allowReversals ? Math.random() < 0.3 : false; // 30% chance of reversal
      this.drawnCards.push({ ...card, reversed });
    }
  }

  /**
   * Manual card selection
   */
  private async drawManual(cardCodes: string[], allowReversals: boolean): Promise<void> {
    for (const code of cardCodes) {
      const card = this.deck.find(c => c.code === code);
      if (!card) {
        throw new Error(`Card with code ${code} not found in deck`);
      }
      const reversed = allowReversals ? Math.random() < 0.3 : false;
      this.drawnCards.push({ ...card, reversed });
    }
  }

  /**
   * Generate AI interpretation
   */
  protected async interpret(): Promise<void> {
    const language = this.metadata.language || 'en';
    const systemPrompt = this.buildSystemPrompt(language);
    const prompt = this.buildPrompt(language);

    this.interpretation = await this.callAI(prompt, systemPrompt);
  }

  /**
   * Build system prompt for AI
   */
  private buildSystemPrompt(language: string): string {
    const systemPrompts = {
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

    // Add question if provided
    if (question) {
      prompt += language === 'zh-TW'
        ? `問題：${question}\n\n`
        : `Question: ${question}\n\n`;
    }

    // Add spread name
    prompt += language === 'zh-TW'
      ? `牌陣：${this.spread!.name[language]}\n\n`
      : `Spread: ${this.spread!.name[language] || this.spread!.name.en}\n\n`;

    // Add each card with position
    prompt += language === 'zh-TW' ? `抽到的牌：\n` : `Cards Drawn:\n`;
    
    this.drawnCards.forEach((card, index) => {
      const position = this.spread!.positions[index];
      const positionLabel = position.label[language] || position.label.en;
      const reversed = card.reversed ? (language === 'zh-TW' ? '（逆位）' : '(Reversed)') : '';
      
      prompt += `${index + 1}. ${positionLabel}: ${card.title}${reversed}\n`;
      
      // Add keywords
      const meaning = card.reversed 
        ? card.reversed_meaning[language] || card.reversed_meaning.en
        : card.upright_meaning[language] || card.upright_meaning.en;
      
      prompt += `   ${language === 'zh-TW' ? '關鍵字' : 'Keywords'}: ${card.keywords.join(', ')}\n`;
      prompt += `   ${language === 'zh-TW' ? '基本含義' : 'Basic Meaning'}: ${meaning}\n\n`;
    });

    // Add reflection if provided
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
