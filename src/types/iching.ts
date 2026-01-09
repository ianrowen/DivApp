// src/types/iching.ts
/**
 * TypeScript types for I Ching system
 * Pattern matches: src/types/reading.ts, src/types/spreads.ts
 */

import type { LocalHexagram } from '@/systems/iching/data/localHexagramData';

/**
 * Result of yarrow stalk or coin toss divination
 */
export interface IChingDivinationResult {
  hexagramNumber: number;
  lines: number[]; // 6 values: 6=yin, 7=yang, 8=yin changing, 9=yang changing
  changingLines: number[]; // Positions 1-6 of changing lines
  resultingHexagramNumber?: number; // If lines change
}

/**
 * Complete I Ching reading with AI interpretation
 */
export interface IChingReading {
  id: string;
  userId: string;
  question: string;
  timestamp: Date;
  method: 'yarrow' | 'coins';
  
  // Original hexagram
  hexagram: LocalHexagram;
  changingLinePositions: number[];
  
  // Resulting hexagram (if lines change)
  resultingHexagram?: LocalHexagram;
  
  // AI-generated interpretation
  interpretation?: string;
  
  // Optional user notes
  notes?: string;
}

/**
 * Supported languages
 */
export type IChingLanguage = 'en' | 'zh';

/**
 * Line value types
 */
export type LineValue = 6 | 7 | 8 | 9;

/**
 * Line position (bottom to top)
 */
export type LinePosition = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Hexagram number
 */
export type HexagramNumber = number; // 1-64
