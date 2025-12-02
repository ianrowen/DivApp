// src/core/analytics/questionAnalytics.ts
import { supabase } from '../api/supabase';

/**
 * Simple hash function for React Native (replaces Node crypto)
 * Creates a deterministic hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string, pad to 16 chars
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
}

/**
 * Hash question for privacy-preserving analytics
 * Same question always produces same hash, but hash is not reversible
 */
function hashQuestion(question: string): string {
  if (!question || question.trim().length === 0) {
    return '0000000000000000'; // Special hash for empty questions
  }
  
  // Normalize: lowercase, trim, remove punctuation for better matching
  const normalized = question
    .toLowerCase()
    .trim()
    .replace(/[?？!！。，,\.]/g, '');
  
  // Use simple hash function (React Native compatible)
  return simpleHash(normalized);
}

/**
 * Log question pattern (privacy-preserving)
 * Fire-and-forget - never blocks UI
 */
export async function logQuestionAnalytics(
  question: string | null,
  tier: 'traditional' | 'esoteric' | 'jungian',
  locale: 'en' | 'zh-TW',
  userTier: 'free' | 'premium' | 'expert' = 'free'
): Promise<void> {
  // Fire-and-forget wrapper
  (async () => {
    try {
      const q = question || '';
      
      const analytics = {
        question_hash: hashQuestion(q),
        question_length: q.length,
        question_word_count: q.trim() ? q.trim().split(/\s+/).length : 0,
        tier,
        locale,
        user_tier: userTier,
      };
      
      console.log('📊 Logging analytics:', {
        hash: analytics.question_hash,
        length: analytics.question_length,
        words: analytics.question_word_count,
        tier: analytics.tier,
      });
      
      const { error } = await supabase
        .from('question_analytics')
        .insert(analytics);
      
      if (error) {
        console.log('Analytics insert failed (non-critical):', error.message);
      } else {
        console.log('✅ Analytics logged');
      }
    } catch (error) {
      // Never throw - analytics failures should not affect user experience
      console.log('Analytics error (non-critical):', error);
    }
  })();
}

/**
 * Update analytics with user rating (optional, when user gives feedback)
 * Called from ReflectionPrompt or rating UI
 */
export async function updateQuestionRating(
  question: string,
  rating: number,
  readingCreatedAt: string
): Promise<void> {
  (async () => {
    try {
      if (!question || rating < 1 || rating > 5) {
        console.log('Invalid rating data, skipping');
        return;
      }
      
      const questionHash = hashQuestion(question);
      const createdAtDate = new Date(readingCreatedAt);
      
      // Find the most recent analytics entry for this question hash
      // within 5 minutes of reading creation (to avoid updating wrong entry)
      const fiveMinutesAgo = new Date(createdAtDate.getTime() - 5 * 60 * 1000);
      const fiveMinutesLater = new Date(createdAtDate.getTime() + 5 * 60 * 1000);
      
      const { error } = await supabase
        .from('question_analytics')
        .update({ user_rating: rating })
        .eq('question_hash', questionHash)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .lte('created_at', fiveMinutesLater.toISOString())
        .is('user_rating', null) // Only update if not already rated
        .limit(1);
      
      if (error) {
        console.log('Rating update failed (non-critical):', error.message);
      } else {
        console.log('✅ Question rating updated:', rating);
      }
    } catch (error) {
      console.log('Rating update error (non-critical):', error);
    }
  })();
}

/**
 * Get question pattern category (for internal use)
 */
export function getQuestionPattern(questionLength: number): string {
  if (questionLength === 0) return 'no_question';
  if (questionLength < 5) return 'very_short';
  if (questionLength < 15) return 'short';
  if (questionLength < 50) return 'medium';
  return 'long';
}