// src/core/models/DeckRegistry.ts
/**
 * Deck Registry: Manages available decks (Tarot, etc.) from the database.
 * Enables the architecture principle: Decks as Data, not Code.
 */

import { supabase } from '../api/supabase';

// Maps to the structure of the tarot_decks table (01-DATABASE-SCHEMA.sql)
export interface DeckDefinition {
  id: string;
  deck_key: string; // e.g., 'rws'
  deck_name: Record<string, string>;
  tradition: string; // 'rws', 'thoth', 'marseille'
  availability: {
    is_default: boolean;
    min_tier: 'free' | 'premium' | 'pro' | 'expert';
    is_enabled: boolean;
    is_premium_deck: boolean;
  };
}

type UserTier = 'free' | 'premium' | 'pro' | 'expert';
const TIER_ORDER: Record<UserTier, number> = {
  'free': 0,
  'premium': 1,
  'pro': 2,
  'expert': 3,
};

export class DeckRegistry {
  private static decks: DeckDefinition[] = [];
  private static isInitialized = false;

  /**
   * Loads all deck definitions from Supabase.
   */
  public static async initialize(): Promise<void> {
    if (DeckRegistry.isInitialized) return;

    try {
      const { data, error } = await supabase
        .from('tarot_decks')
        .select('*')
        .order('deck_key');

      if (error) throw error;

      DeckRegistry.decks = data as DeckDefinition[];
      DeckRegistry.isInitialized = true;
      console.log(`✅ DeckRegistry initialized with ${data.length} decks.`);
    } catch (error) {
      console.error('Failed to initialize DeckRegistry:', error);
    }
  }

  /**
   * Checks if the user's tier meets the minimum requirement of the deck.
   */
  private static canAccess(deckTier: UserTier, userTier: UserTier): boolean {
    return TIER_ORDER[userTier] >= TIER_ORDER[deckTier];
  }

  /**
   * Returns a list of decks the current user can access.
   */
  public static getAvailableDecks(userTier: UserTier): DeckDefinition[] {
    if (!DeckRegistry.isInitialized) {
      console.warn('DeckRegistry not initialized. Returning empty list.');
      return [];
    }

    return DeckRegistry.decks.filter(deck => 
      deck.availability.is_enabled && 
      DeckRegistry.canAccess(deck.availability.min_tier, userTier)
    );
  }

  /**
   * Gets the default deck for new users.
   */
  public static getDefaultDeck(): DeckDefinition | undefined {
    return DeckRegistry.decks.find(deck => deck.availability.is_default);
  }
}

export default DeckRegistry;