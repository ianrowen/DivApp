// src/types/reading.ts
import type { TarotSpread } from './spreads';

export interface DrawnCard {
  cardCode: string; // "00", "01", etc. from LOCAL_RWS_CARDS
  position?: string; // "Past", "Present", "Future", etc.
  reversed: boolean;
}

export interface ReadingParams {
  type: 'daily' | 'spread';
  question?: string;
  spreadKey?: string;
  // For daily card, card is pre-drawn
  dailyCard?: DrawnCard;
}

export interface InterpretationStyle {
  key: 'traditional' | 'esoteric' | 'jungian';
  label: { en: string; zh: string };
  requiredTier: 'free' | 'adept' | 'apex';
}

export interface ReadingState {
  cards: DrawnCard[];
  spread?: TarotSpread;
  interpretations: {
    traditional?: string;
    esoteric?: string;
    jungian?: string;
  };
  selectedStyle: 'traditional' | 'esoteric' | 'jungian';
  chatHistory: ChatMessage[];
  reflection?: string;
  saved: boolean;
  readingId?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}