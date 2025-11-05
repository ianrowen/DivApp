// src/core/models/Reading.ts
/**
 * Base Reading Class (Template Method Pattern)
 * 
 * All divination systems extend this class.
 * Defines the universal reading generation flow.
 * 
 * Example: TarotReading, IChingReading, AstrologyReading all extend this.
 */

import { supabase } from '../api/supabase';
import AIProvider from '../api/aiProvider';

export interface ReadingMetadata {
  // Common fields for ALL readings
  userId: string;
  systemId: string; // 'tarot', 'iching', 'astrology', 'bazi'
  
  // Optional context
  question?: string;
  birthData?: {
    date: string; // ISO format
    time?: string; // HH:mm format
    location?: {
      latitude: number;
      longitude: number;
      timezone: string;
    };
  };
  
  // Language preference
  language?: 'en' | 'zh-TW' | 'ja' | 'es' | 'ru';
  
  // Custom metadata (system-specific, stored as JSONB)
  customData?: Record<string, any>;
}

export interface ElementDrawn {
  // This is what goes into readings.elements_drawn JSONB field
  // Structure varies by system, but all have these base fields:
  elementId: string; // FK to system_elements.id
  position?: string; // e.g., "Past" for 3-card spread
  metadata?: Record<string, any>; // e.g., { reversed: true } for Tarot
}

export abstract class Reading {
  protected metadata: ReadingMetadata;
  protected elementsDrawn: ElementDrawn[] = [];
  protected interpretation: string = '';
  protected readingId?: string;

  constructor(metadata: ReadingMetadata) {
    this.metadata = metadata;
  }

  /**
   * Template Method - defines the reading generation algorithm
   * Subclasses MUST NOT override this - override the hook methods instead
   */
  async generate(): Promise<string> {
    try {
      // Step 1: Validate input
      await this.validate();
      
      // Step 2: Load user context (birth data, past readings, etc.)
      await this.loadUserContext();
      
      // Step 3: Draw elements (cards, hexagrams, chart, etc.)
      await this.draw();
      
      // Step 4: Generate AI interpretation
      await this.interpret();
      
      // Step 5: Save to database
      await this.save();
      
      return this.interpretation;
    } catch (error) {
      console.error('Reading generation failed:', error);
      throw error;
    }
  }

  // HOOK METHODS - Subclasses override these

  /**
   * Validate that all required data is present
   * Example: Astrology reading requires birth date/time/location
   */
  protected async validate(): Promise<void> {
    if (!this.metadata.userId) {
      throw new Error('User ID is required');
    }
    if (!this.metadata.systemId) {
      throw new Error('System ID is required');
    }
    // Subclasses add their own validation
  }

  /**
   * Load user context (birth data, preferences, past readings)
   * Optional - default implementation does nothing
   */
  protected async loadUserContext(): Promise<void> {
    // Subclasses can override to load birth data, etc.
  }

  /**
   * Draw elements (MUST be implemented by subclass)
   * Example: TarotReading shuffles deck and draws cards
   */
  protected abstract draw(): Promise<void>;

  /**
   * Generate AI interpretation (MUST be implemented by subclass)
   * Example: TarotReading builds prompt with card meanings
   */
  protected abstract interpret(): Promise<void>;

  /**
   * Save reading to database
   * Default implementation works for all systems (thanks to JSONB!)
   */
  protected async save(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('readings')
        .insert({
          user_id: this.metadata.userId,
          divination_system_id: this.metadata.systemId,
          question: this.metadata.question,
          elements_drawn: this.elementsDrawn, // JSONB - works for any system!
          interpretation: this.interpretation,
          birth_data: this.metadata.birthData, // JSONB
          custom_metadata: this.metadata.customData, // JSONB
          language: this.metadata.language || 'en',
        })
        .select('id')
        .single();

      if (error) throw error;
      this.readingId = data.id;
      
      console.log(`Reading saved: ${this.readingId}`);
    } catch (error) {
      console.error('Failed to save reading:', error);
      throw error;
    }
  }

  // UTILITY METHODS

  /**
   * Get the generated interpretation
   */
  getInterpretation(): string {
    return this.interpretation;
  }

  /**
   * Get the reading ID (after saving)
   */
  getReadingId(): string | undefined {
    return this.readingId;
  }

  /**
   * Get the drawn elements
   */
  getElements(): ElementDrawn[] {
    return this.elementsDrawn;
  }

  /**
   * Helper: Call AI with proper error handling
   */
  protected async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2048,
        language: this.metadata.language,
      });

      // Log token usage for cost tracking
      console.log(`AI tokens used: ${result.tokensUsed.input + result.tokensUsed.output}`);
      
      return result.text;
    } catch (error) {
      console.error('AI call failed:', error);
      throw new Error('Failed to generate interpretation. Please try again.');
    }
  }
}

export default Reading;
