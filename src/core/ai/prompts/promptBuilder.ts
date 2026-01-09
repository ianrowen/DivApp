// src/core/ai/prompts/promptBuilder.ts
// FINAL VERSION: Full history + conversation highlights
//
// TIER SYSTEM NOTES:
// - Unified naming: 'free' | 'adept' | 'apex' (matches database and UI)
// - Display names: free→"Apprentice", adept→"Adept", apex→"Apex" (in i18n)
// - Beta testers get full history access (same as apex tier)
//
// TOKEN & PERFORMANCE:
// - Full history adds ~1250-2000 input tokens (~5000-8000 chars)
// - Gemini handles up to 1M tokens efficiently, we use <10K
// - Cost increase: ~$0.0001-0.0002 per reading (negligible)
// - Performance: No noticeable slowdown (Gemini processes in parallel)
// - Recommendation: Keep expert tier for production, consider renaming to 'apex' for consistency

import type { LocalTarotCard } from '../../../systems/tarot/data/localCardData';
import { supabase } from '../../api/supabase';
import { getLocaleLabels } from './systemPrompts';
import type {
  CardContext,
  UserBirthContext,
  UserProfile,
  InterpretationTier,
  DrawnCardData,
  SupportedLocale,
  UserTier,
} from './types';

export class PromptBuilder {
  /**
   * Extract clean card context for AI
   */
  static extractCardContext(
    drawnCard: DrawnCardData,
    tier: InterpretationTier,
    locale: SupportedLocale
  ): CardContext {
    const { card, position, reversed } = drawnCard;
    const lang = locale === 'zh-TW' ? 'zh' : locale === 'ja' ? 'ja' : 'en';

    const meaningObj = reversed ? card.reversed_meaning : card.upright_meaning;
    // Handle case where lang might be 'ja' but meaningObj only has 'en' and 'zh'
    let meaning = (lang === 'ja' ? meaningObj.en : meaningObj[lang as 'en' | 'zh']) || meaningObj.en || '';

    if (tier === 'traditional') {
      const clauses = meaning.split(/[,;]/);
      meaning = clauses.slice(0, 2).join(', ');
    }

    // Handle title: if it's an object, use lang (fallback to en for ja), otherwise use string
    const titleLang = lang === 'ja' ? 'en' : lang as 'en' | 'zh';
    const title = typeof card.title === 'string' ? card.title : (card.title[titleLang] || card.title.en);

    return {
      title,
      position,
      reversed,
      keywords: card.keywords.slice(0, 3),
      element: card.element,
      astro: card.astro,
      meaning,
    };
  }

  /**
   * Build user birth context (only if opted in)
   */
  static buildUserContext(userProfile: UserProfile | null): UserBirthContext | null {
    if (!userProfile || !userProfile.use_birth_data_for_readings) {
      return null;
    }

    if (!userProfile.sun_sign) {
      return null;
    }

    return {
      sunSign: userProfile.sun_sign,
      moonSign: userProfile.moon_sign,
      risingSign: userProfile.rising_sign,
    };
  }

  /**
   * Get smart history count based on user tier and question type
   * Apex tier and beta testers get ALL readings for truly full context
   * 
   * Note: Higher counts don't significantly impact performance:
   * - Gemini handles up to 1M tokens efficiently
   * - We're using <10K tokens even with full history
   * - Cost increase is negligible (~$0.0001-0.0002 per reading)
   * - Apex tier: Returns 1000 to effectively mean "all readings" (loadRecentReadingHistory caps at totalReadings - 1)
   */
  static getSmartHistoryCount(
    userTier: UserTier = 'free',
    isRecurring: boolean = false,
    isBetaTester: boolean = false
  ): number {
    // Beta testers get apex-level access
    const effectiveTier = isBetaTester ? 'apex' : userTier;
    
    if (isRecurring) {
      switch (effectiveTier) {
        case 'free': return 5;
        case 'adept': return 8;
        case 'apex': return 1000; // Apex/Beta: ALL readings for recurring themes (effectively unlimited)
        default: return 5;
      }
    }

    switch (effectiveTier) {
      case 'free': return 3;
      case 'adept': return 5;
      case 'apex': return 1000; // Apex/Beta: ALL readings (effectively unlimited - capped by totalReadings - 1)
      default: return 3;
    }
  }

  /**
   * Extract meaningful conversation highlights
   * Focuses on user revelations, breakthroughs, and context - NOT AI explanations
   * 
   * @param conversation - Array of conversation messages
   * @param maxHighlights - Maximum number of highlights to extract
   * @param fullContext - If true (expert tier), include more context and less truncation
   */
  private static extractConversationHighlights(
    conversation: any[] | undefined,
    maxHighlights: number = 2,
    fullContext: boolean = false
  ): string {
    if (!conversation || conversation.length === 0) return '';

    // Get user messages only (skip AI responses)
    const userMessages = conversation
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);

    if (userMessages.length === 0) return '';

    // Prioritize messages with revelation patterns
    const insights = userMessages
      .filter(msg => {
        const lowerMsg = msg.toLowerCase();
        
        // Look for revelation indicators
        const hasRevelation = 
          lowerMsg.includes('realize') ||
          lowerMsg.includes('pattern') ||
          lowerMsg.includes('always') ||
          lowerMsg.includes('never') ||
          lowerMsg.includes('remind') ||
          lowerMsg.includes('just like') ||
          lowerMsg.includes('same as') ||
          lowerMsg.includes('this is the') ||
          lowerMsg.includes('every time') ||
          lowerMsg.includes('keeps happening') ||
          msg.length > 50; // Longer messages often more meaningful
        
        // Skip shallow questions
        const isShallow = 
          lowerMsg.startsWith('what does') ||
          lowerMsg.startsWith('can you explain') ||
          lowerMsg.startsWith('what about the') ||
          lowerMsg.length < 15;
        
        return hasRevelation && !isShallow;
      })
      .slice(0, maxHighlights) // Top N insights
      .map(msg => {
        // Expert tier: Allow longer messages (up to 300 chars), others: 100 chars
        const maxLength = fullContext ? 300 : 100;
        
        if (msg.length <= maxLength) return msg;
        
        // Find last complete sentence within maxLength chars
        const truncated = msg.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclaim = truncated.lastIndexOf('!');
        const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);
        
        if (lastSentence > 30) {
          return msg.substring(0, lastSentence + 1);
        }
        
        return truncated + '...';
      });

    if (insights.length === 0) return '';

    return insights.join(' • ');
  }

  /**
   * Load recent reading history with conversation highlights
   * 
   * Includes: question + cards + interpretation summary + conversation insights + reflection
   * 
   * This captures the REAL breakthroughs that often happen in follow-up conversations,
   * not just the initial reading.
   * 
   * TOKEN OPTIMIZATION & PERFORMANCE:
   * - Free/Premium/Pro: Truncated content, limited history length (~2000-3500 chars)
   * - Expert/Apex/Beta: Full history with no truncation limits (~5000-8000 chars)
   * - Token cost: ~1 token per 4 chars, so full history adds ~1250-2000 input tokens
   * - Performance: Minimal impact - Gemini handles up to 1M tokens, we're using <10K
   * - Cost: Negligible increase (~$0.0001-0.0002 per reading for full history)
   * 
   * Each reading entry:
   * - Free/Premium/Pro: ~200-250 chars (truncated)
   * - Expert/Apex/Beta: ~400-600 chars (full context)
   */
  static async loadRecentReadingHistory(
    userId: string | undefined,
    locale: SupportedLocale,
    count: number = 5,
    includeConversations: boolean = true, // Can disable for free tier
    excludeDailyCards: boolean = false, // If true, exclude daily cards from history
    userTier: UserTier = 'free', // Used to determine if full history should be included
    isBetaTester: boolean = false // Beta testers get full history like expert tier
  ): Promise<string> {
    if (!userId) return '';

    // Beta testers and apex tier get full history
    const hasFullHistory = userTier === 'apex' || isBetaTester;

    try {
      // OPTIMIZATION: Quick count check to avoid unnecessary queries
      const { count: totalReadings, error: countError } = await supabase
        .from('readings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Skip if user has 0-1 readings (nothing to compare to)
      if (countError || !totalReadings || totalReadings <= 1) {
        if (totalReadings === 0) {
          console.log('⚡ User has 0 readings, skipping history context');
        } else if (totalReadings === 1) {
          console.log('⚡ User has 1 reading, skipping history context (need at least 2 for comparison)');
        }
        return '';
      }

      // Adjust count to not exceed available readings
      // -1 to exclude current reading
      const effectiveCount = Math.min(count, totalReadings - 1);

      if (effectiveCount === 0) {
        console.log('⚡ No past readings to load (only 1 reading exists)');
        return '';
      }

      console.log(`📊 Loading ${effectiveCount} past readings (user has ${totalReadings} total)`);

      const { data, error } = await supabase
        .from('readings')
        .select('question, interpretations, conversation, reflection, created_at, elements_drawn, reading_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(effectiveCount * 2); // Get more to filter out daily cards

      if (error) {
        console.warn('Failed to load reading history:', error);
        return '';
      }

      if (!data || data.length === 0) {
        return '';
      }

      // Filter out daily cards - only include one per day, and exclude if excludeDailyCards is true
      // Group daily cards by date and only keep the most recent one per day
      type ReadingData = {
        question: string | null;
        interpretations: any;
        conversation: any;
        reflection: string | null;
        created_at: string;
        elements_drawn: any;
        reading_type: string | null;
      };
      
      const dailyCardsByDate = new Map<string, ReadingData>();
      const spreadReadings: ReadingData[] = [];
      
      (data as ReadingData[]).forEach((reading) => {
        if (reading.reading_type === 'daily_card') {
          if (excludeDailyCards) {
            // Skip all daily cards if excludeDailyCards is true
            return;
          }
          const dateKey = new Date(reading.created_at).toDateString();
          // Only keep the most recent daily card per day
          if (!dailyCardsByDate.has(dateKey)) {
            dailyCardsByDate.set(dateKey, reading);
          }
        } else {
          spreadReadings.push(reading);
        }
      });
      
      // Combine spread readings with deduplicated daily cards, prioritizing spread readings
      const filteredData = [...spreadReadings, ...Array.from(dailyCardsByDate.values())]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, effectiveCount);

      const labels = getLocaleLabels(locale);
      
      // Detect salient patterns before formatting
      const patterns = this.detectSalientPatterns(filteredData, locale);
      
      const headerText = locale === 'zh-TW'
        ? '\n**近期解讀：**\n'
        : locale === 'ja'
        ? '\n**最近のリーディング：**\n'
        : '\n**Recent Readings:**\n';

      let historyText = headerText;
      
      // Add pattern summary if patterns detected (helps AI focus on what matters)
      if (patterns && patterns.length > 0) {
        const patternHeader = locale === 'zh-TW'
          ? '\n**顯著模式：**\n'
          : locale === 'ja'
          ? '\n**注目すべきパターン：**\n'
          : '\n**Salient Patterns:**\n';
        historyText += patternHeader + patterns + '\n';
      }

      // Get today's date for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredData.forEach((reading) => {
        const readingDate = new Date(reading.created_at);
        readingDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference
        const daysDiff = Math.floor((today.getTime() - readingDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Format date as relative term
        let dateLabel: string;
        if (daysDiff === 0) {
          dateLabel = locale === 'zh-TW' ? '今天' : locale === 'ja' ? '今日' : 'today';
        } else if (daysDiff === 1) {
          dateLabel = locale === 'zh-TW' ? '昨天' : locale === 'ja' ? '昨日' : 'yesterday';
        } else if (daysDiff === 2) {
          dateLabel = locale === 'zh-TW' ? '前天' : locale === 'ja' ? '一昨日' : '2 days ago';
        } else if (daysDiff < 7) {
          dateLabel = locale === 'zh-TW' 
            ? `${daysDiff}天前` 
            : locale === 'ja' 
            ? `${daysDiff}日前` 
            : `${daysDiff} days ago`;
        } else if (daysDiff < 30) {
          const weeks = Math.floor(daysDiff / 7);
          dateLabel = locale === 'zh-TW' 
            ? `${weeks}週前` 
            : locale === 'ja' 
            ? `${weeks}週前` 
            : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
          const months = Math.floor(daysDiff / 30);
          dateLabel = locale === 'zh-TW' 
            ? `${months}個月前` 
            : locale === 'ja' 
            ? `${months}ヶ月前` 
            : `${months} month${months > 1 ? 's' : ''} ago`;
        }
        
        let question = reading.question || labels.generalGuidance;
        
        // Truncate long questions to save tokens (keep first 80 chars) - skip for expert/beta tier
        if (!hasFullHistory && question.length > 80) {
          question = question.substring(0, 77) + '...';
        }

        // Format: Date - Question
        historyText += `• ${dateLabel}: "${question}"\n`;

        // Add key cards drawn (max 3 for brevity, all cards for expert/beta tier)
        if (reading.elements_drawn && reading.elements_drawn.length > 0) {
          const maxCards = hasFullHistory ? reading.elements_drawn.length : 3;
          const cardNames = reading.elements_drawn
            .slice(0, maxCards)
            .map((el: any) => el.metadata?.cardTitle)
            .filter(Boolean)
            .join(', ');
          
          if (cardNames) {
            const cardsLabel = locale === 'zh-TW' ? '牌' : locale === 'ja' ? 'カード' : 'Cards';
            historyText += `  ${cardsLabel}: ${cardNames}\n`;
          }
        }

        // Add interpretation summary
        const interp = reading.interpretations?.traditional?.content 
                    || reading.interpretations?.esoteric?.content 
                    || reading.interpretations?.jungian?.content;
        
        if (interp) {
          let summary: string;
          if (hasFullHistory) {
            // Expert/Beta tier: Include full interpretation (truncate only if extremely long)
            summary = interp.length > 500 
              ? interp.substring(0, 497) + '...'
              : interp;
          } else {
            // Other tiers: First sentence only, max 120 chars
            const firstSentence = interp.split(/[.!?]/)[0] + '.';
            summary = firstSentence.length > 120 
              ? firstSentence.substring(0, 120) + '...'
              : firstSentence;
          }
          
          const keyLabel = locale === 'zh-TW' ? '要點' : locale === 'ja' ? 'ポイント' : 'Key point';
          historyText += `  ${keyLabel}: ${summary}\n`;
        }

        // ⭐ NEW: Add conversation highlights (where the real gold often is)
        if (includeConversations && reading.conversation && reading.conversation.length > 0) {
          // Expert/Beta tier: More conversation highlights, less truncation
          const maxHighlights = hasFullHistory ? 5 : 2;
          const highlights = this.extractConversationHighlights(
            reading.conversation,
            maxHighlights,
            hasFullHistory // Full context for expert/beta tier
          );
          
          if (highlights) {
            const insightLabel = locale === 'zh-TW' ? '洞察' 
                              : locale === 'ja' ? 'インサイト' 
                              : 'Insights';
            historyText += `  ${insightLabel}: ${highlights}\n`;
          }
        }

        // Add reflection if present
        if (reading.reflection) {
          const reflectionLabel = locale === 'zh-TW' ? '反思' : locale === 'ja' ? '振り返り' : 'Reflection';
          let reflection = reading.reflection;
          
          // Truncate only for non-expert/beta tiers
          if (!hasFullHistory && reflection.length > 100) {
            reflection = reflection.substring(0, 97) + '...';
          }
          
          historyText += `  ${reflectionLabel}: ${reflection}\n`;
        }

        historyText += '\n';
      });

      // Final token optimization: Limit total history text length based on tier
      // Expert/Beta tier: No truncation - full history
      // Other tiers: Limit based on count
      if (!hasFullHistory) {
        // Estimate: ~200-250 chars per reading entry
        // Free tier: ~2000 chars max (enough for 3-5 readings)
        // Premium/Pro: ~3500 chars max (enough for 5-8 readings)
        const maxHistoryLength = count <= 3 ? 2000 : 3500;
        if (historyText.length > maxHistoryLength) {
          // Truncate from the oldest entries (keep most recent)
          const lines = historyText.split('\n');
          const headerLine = lines[0]; // Keep header
          const readingEntries = lines.slice(1);
          
          let truncatedText = headerLine + '\n';
          let currentLength = headerLine.length + 1;
          
          // Add entries from most recent until we hit the limit
          for (const line of readingEntries) {
            if (currentLength + line.length + 1 > maxHistoryLength) {
              break;
            }
            truncatedText += line + '\n';
            currentLength += line.length + 1;
          }
          
          console.log(`📊 History truncated: ${historyText.length} → ${truncatedText.length} chars`);
          return truncatedText;
        }
      } else {
        console.log(`📊 Full history loaded for ${isBetaTester ? 'beta tester' : 'apex tier'}: ${historyText.length} chars`);
      }

      return historyText;
    } catch (error) {
      console.error('Error loading reading history:', error);
      return '';
    }
  }

  /**
   * Detect recurring themes from past readings
   */
  static async detectRecurringThemes(
    userId: string | undefined,
    currentQuestion: string | null,
    locale: SupportedLocale
  ): Promise<string> {
    if (!userId || !currentQuestion) return '';

    try {
      const questionHash = this.generateQuestionHash(currentQuestion);

      const { data, error } = await supabase
        .from('readings')
        .select('created_at, question')
        .eq('user_id', userId)
        .eq('question_hash', questionHash)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !data || data.length < 2) {
        return '';
      }

      type RecurringReadingData = {
        created_at: string;
        question: string | null;
      };

      const labels = getLocaleLabels(locale);
      const count = data.length;
      const timeframe = this.getTimeframeSummary(
        (data as RecurringReadingData[]).map(r => r.created_at),
        locale
      );

      return labels.recurringThemeNote(count, timeframe);
    } catch (error) {
      console.error('Error detecting themes:', error);
      return '';
    }
  }

  /**
   * Generate question hash
   */
  private static generateQuestionHash(question: string): string {
    let hash = 0;
    const str = question.trim().toLowerCase();
    
    if (str.length === 0) return '0';
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get human-readable timeframe summary
   */
  private static getTimeframeSummary(dates: string[], locale: SupportedLocale): string {
    if (dates.length === 0) return '';

    const now = new Date();
    const oldest = new Date(dates[dates.length - 1]);
    const daysDiff = Math.floor((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));

    const timeframes = {
      'en': {
        week: 'in the past week',
        month: 'in the past month',
        months: (n: number) => `in the past ${n} months`,
        recent: 'over recent months',
      },
      'zh-TW': {
        week: '過去一週',
        month: '過去一個月',
        months: (n: number) => `過去 ${n} 個月`,
        recent: '過去幾個月',
      },
      'ja': {
        week: '過去1週間',
        month: '過去1ヶ月',
        months: (n: number) => `過去${n}ヶ月`,
        recent: '最近数ヶ月',
      },
      'es': {
        week: 'en la última semana',
        month: 'en el último mes',
        months: (n: number) => `en los últimos ${n} meses`,
        recent: 'en los últimos meses',
      },
      'ru': {
        week: 'за последнюю неделю',
        month: 'за последний месяц',
        months: (n: number) => `за последние ${n} месяцев`,
        recent: 'за последние месяцы',
      },
      'pt': {
        week: 'na última semana',
        month: 'no último mês',
        months: (n: number) => `nos últimos ${n} meses`,
        recent: 'nos últimos meses',
      },
    };

    const t = timeframes[locale] || timeframes['en'];

    if (daysDiff < 7) return t.week;
    if (daysDiff < 30) return t.month;
    if (daysDiff < 90) {
      const months = Math.floor(daysDiff / 30);
      return t.months(months);
    }
    return t.recent;
  }

  /**
   * Detect salient patterns across reading history
   * Helps AI focus on what matters most
   */
  private static detectSalientPatterns(
    readings: any[],
    locale: SupportedLocale
  ): string {
    if (readings.length < 2) return '';

    const cardFrequency = new Map<string, number>();
    const questions: string[] = [];
    const hasReflection: string[] = [];
    const hasConversation: string[] = [];

    readings.forEach((reading) => {
      // Count card frequencies
      if (reading.elements_drawn && reading.elements_drawn.length > 0) {
        reading.elements_drawn.forEach((el: any) => {
          const cardTitle = el.metadata?.cardTitle;
          if (cardTitle) {
            cardFrequency.set(cardTitle, (cardFrequency.get(cardTitle) || 0) + 1);
          }
        });
      }

      // Track questions
      if (reading.question) {
        questions.push(reading.question);
      }

      // Track readings with reflections (breakthrough moments)
      if (reading.reflection) {
        hasReflection.push(reading.created_at);
      }

      // Track readings with conversations (insights)
      if (reading.conversation && reading.conversation.length > 0) {
        hasConversation.push(reading.created_at);
      }
    });

    const patterns: string[] = [];

    // Recurring cards (appear 3+ times)
    const recurringCards = Array.from(cardFrequency.entries())
      .filter(([_, count]) => count >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3); // Top 3 recurring cards

    if (recurringCards.length > 0) {
      const cardNames = recurringCards.map(([name]) => name).join(', ');
      if (locale === 'zh-TW') {
        patterns.push(`重複出現的卡牌（3次以上）：${cardNames}`);
      } else if (locale === 'ja') {
        patterns.push(`繰り返し出現するカード（3回以上）：${cardNames}`);
      } else {
        patterns.push(`Recurring cards (3+ times): ${cardNames}`);
      }
    }

    // Breakthrough moments
    if (hasReflection.length > 0 || hasConversation.length > 0) {
      const totalBreakthroughs = hasReflection.length + hasConversation.length;
      if (locale === 'zh-TW') {
        patterns.push(`${totalBreakthroughs}個解讀包含反思或對話洞察（突破時刻）`);
      } else if (locale === 'ja') {
        patterns.push(`${totalBreakthroughs}つのリーディングに振り返りや対話の洞察が含まれる（ブレークスルー）`);
      } else {
        patterns.push(`${totalBreakthroughs} readings include reflections/conversations (breakthrough moments)`);
      }
    }

    // Question evolution (if questions show progression)
    if (questions.length >= 3) {
      const uniqueQuestions = new Set(questions.map(q => q.toLowerCase().trim()));
      if (uniqueQuestions.size < questions.length * 0.7) {
        // More than 30% similarity suggests evolution
        if (locale === 'zh-TW') {
          patterns.push('問題顯示出隨時間的演變模式');
        } else if (locale === 'ja') {
          patterns.push('質問は時間の経過とともに進化パターンを示している');
        } else {
          patterns.push('Questions show evolution patterns over time');
        }
      }
    }

    return patterns.length > 0 ? patterns.map(p => `• ${p}`).join('\n') : '';
  }

  /**
   * Format conversation history for follow-up questions
   */
  static formatConversationHistory(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxMessages: number = 3
  ): string {
    if (!messages || messages.length === 0) {
      return '';
    }

    const recentMessages = messages.slice(-maxMessages);
    
    let formatted = 'Previous conversation:\n';
    recentMessages.forEach(msg => {
      const label = msg.role === 'user' ? 'User' : 'Assistant';
      formatted += `${label}: ${msg.content}\n`;
    });
    
    return formatted + '\n';
  }

  /**
   * Build card data section for prompt
   */
  static buildCardDataSection(
    cards: DrawnCardData[],
    tier: InterpretationTier,
    locale: SupportedLocale
  ): string {
    const labels = getLocaleLabels(locale);
    let section = '';

    cards.forEach((drawnCard, index) => {
      const cardCtx = this.extractCardContext(drawnCard, tier, locale);
      const num = index + 1;
      const reversedLabel = cardCtx.reversed 
        ? (locale === 'zh-TW' ? '（逆位）' : locale === 'ja' ? '（逆位置）' : ' (Reversed)')
        : '';
      
      section += `${num}. ${cardCtx.position}: ${cardCtx.title}${reversedLabel}\n`;
      section += `   ${labels.keywordsLabel}: ${cardCtx.keywords.join(', ')}\n`;
      
      if (tier === 'traditional') {
        section += `   ${labels.basicMeaningLabel}: ${cardCtx.meaning}\n\n`;
      }
      else if (tier === 'esoteric') {
        section += `   ${labels.elementLabel}: ${cardCtx.element} | ${labels.astrologyLabel}: ${cardCtx.astro}\n`;
        section += `   ${labels.symbolicMeaningLabel}: ${cardCtx.meaning}\n\n`;
      }
      else if (tier === 'jungian') {
        section += `   ${labels.elementLabel}: ${cardCtx.element} | ${labels.astrologyLabel}: ${cardCtx.astro}\n`;
        section += `   ${labels.archetypeMeaningLabel}: ${cardCtx.meaning}\n\n`;
      }
    });

    return section;
  }

  /**
   * Format user astrology context for prompt
   */
  static formatUserAstrologyContext(
    context: UserBirthContext | null,
    locale: SupportedLocale
  ): string {
    if (!context || !context.sunSign) {
      return '';
    }

    const labels = getLocaleLabels(locale);
    const parts: string[] = [];

    if (context.sunSign) parts.push(`${labels.sunLabel}: ${context.sunSign}`);
    if (context.moonSign) parts.push(`${labels.moonLabel}: ${context.moonSign}`);
    if (context.risingSign) parts.push(`${labels.risingLabel}: ${context.risingSign}`);

    return `\n${labels.userChartLabel} ${parts.join(', ')}\n`;
  }

  /**
   * Get token budget by tier
   */
  static getTierTokens(tier: InterpretationTier): number {
    // Token limits adjusted for 30% longer interpretations
    // Note: Gemini 2.5 uses ~1500 tokens for "thinking", so we set output tokens accordingly
    // The model will auto-adjust total tokens, but output will be limited
    switch (tier) {
      case 'traditional': return 2200;   // ~700 output tokens for ~156 words (30% longer)
      case 'esoteric': return 2800;      // ~1100 output tokens for ~234 words (30% longer)
      case 'jungian': return 3200;       // ~1300 output tokens for ~260 words (30% longer)
      default: return 2200;
    }
  }
}
