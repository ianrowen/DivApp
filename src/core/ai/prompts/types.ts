// src/core/ai/prompts/types.ts
/**
 * Type definitions for AI prompt system
 * Supports multiple languages and divination systems
 */

import type { LocalTarotCard } from '../../../systems/tarot/data/localCardData';

/**
 * Supported languages in the app
 * Extend this as you add more languages
 */
export type SupportedLocale = 'en' | 'zh-TW' | 'ja' | 'es' | 'ru' | 'pt';

/**
 * Card data structured for AI consumption
 */
export interface CardContext {
  title: string;
  position: string;
  reversed: boolean;
  keywords: string[];
  element: string;
  astro: string;
  meaning: string; // Filtered by tier and language
}

/**
 * User's birth chart data (optional)
 */
export interface UserBirthContext {
  sunSign: string | null;
  moonSign: string | null;
  risingSign: string | null;
}

/**
 * User profile from database
 */
export interface UserProfile {
  birth_date: string | null;
  birth_time: string | null;
  birth_location: any | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  use_birth_data_for_readings: boolean;
}

/**
 * Interpretation tiers
 */
export type InterpretationTier = 'traditional' | 'esoteric' | 'jungian';

/**
 * User subscription tiers
 * Unified naming: matches database and UI
 * Display names: free→"Apprentice", adept→"Adept", apex→"Apex"
 */
export type UserTier = 'free' | 'adept' | 'apex';

/**
 * Drawn card with position and orientation
 */
export interface DrawnCardData {
  card: LocalTarotCard;
  position: string;
  reversed: boolean;
}

/**
 * Past reflection from user's reading history
 */
export interface PastReflection {
  question: string | null;
  reflection: string;
  created_at: string;
}

/**
 * Configuration for initial reading prompt
 */
export interface ReadingPromptConfig {
  question: string | null;
  spreadName: string;
  cards: DrawnCardData[];
  tier: InterpretationTier;
  locale: SupportedLocale;
  userProfile: UserProfile | null;
  userId?: string; // For loading reflections
  userTier?: UserTier; // For smart reflection count
}

/**
 * Configuration for Tarot reading prompt (used by tarotPrompts.ts)
 */
export interface TarotPromptConfig {
  question: string | null;
  drawnCards: DrawnCardData[];
  tier: InterpretationTier;
  locale: SupportedLocale;
  userProfile: UserProfile | null;
  userId?: string;
  userTier?: UserTier;
  isBetaTester?: boolean; // Beta testers get full history like expert tier
}

/**
 * Configuration for follow-up prompt
 */
export interface FollowUpPromptConfig {
  question: string;  // ← CHANGED: was followUpQuestion
  originalReading: {  // ← CHANGED: was individual fields
    question: string | null;
    drawnCards: DrawnCardData[];
    tier: InterpretationTier;
  };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  locale: SupportedLocale;
  userProfile: UserProfile | null;
}

/**
 * Prompt configuration returned to caller
 */
export interface PromptConfig {
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Context for recurring theme detection
 */
export interface RecurringThemeContext {
  questionHash: string;
  pastReadingCount: number;
  timeframeSummary: string;
}