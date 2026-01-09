// src/services/spreadService.ts
import { supabase } from '../core/api/supabase';
import type { TarotSpread } from '../types/spreads';

/**
 * Load all available spreads from database
 */
export async function loadSpreads(): Promise<TarotSpread[]> {
  try {
    const { data, error } = await supabase
      .from('tarot_spreads')
      .select('*')
      .order('card_count', { ascending: true })
      .order('spread_key', { ascending: true });

    if (error) throw error;
    return data as TarotSpread[];
  } catch (error) {
    console.error('Error loading spreads:', error);
    return [];
  }
}

/**
 * Get spreads available to user based on tier
 */
export async function getAvailableSpreads(
  userTier: 'free' | 'adept' | 'apex' = 'free',
  isBetaTester: boolean = false
): Promise<TarotSpread[]> {
  const spreads = await loadSpreads();
  
  // Beta testers get everything
  if (isBetaTester) {
    return spreads;
  }
  
  // Filter by tier
  return spreads.filter(spread => {
    if (!spread.is_premium) return true;
    return userTier !== 'free';
  });
}

/**
 * Get a specific spread by key
 */
export async function getSpreadByKey(spreadKey: string): Promise<TarotSpread | null> {
  try {
    const { data, error } = await supabase
      .from('tarot_spreads')
      .select('*')
      .eq('spread_key', spreadKey)
      .single();

    if (error) throw error;
    return data as TarotSpread;
  } catch (error) {
    console.error('Error loading spread:', error);
    return null;
  }
}