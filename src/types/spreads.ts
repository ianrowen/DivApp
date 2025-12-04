// src/types/spreads.ts
/**
 * Spread type definitions matching database schema
 */

export interface SpreadPosition {
  position: number;
  label: {
    en: string;
    zh: string;
  };
}

export interface TarotSpread {
  id: string;
  spread_key: string;
  name: {
    en: string;
    zh: string;
  };
  description?: {
    en: string;
    zh: string;
  };
  positions: SpreadPosition[];
  card_count: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  categories: string[];
  is_premium: boolean;
  image_url?: string;
}

export type SpreadKey =
  | 'single_card'
  | 'two_card_past_present'
  | 'two_card_situation_advice'
  | 'two_card_challenge_outcome'
  | 'three_card_past_present_future'
  | 'three_card_mind_body_spirit'
  | 'celtic_cross';
