// src/core/ai/prompts/promptBuilder.ts
// FINAL VERSION: Full history + conversation highlights

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
    let meaning = meaningObj[lang] || meaningObj.en || '';

    if (tier === 'traditional') {
      const clauses = meaning.split(/[,;]/);
      meaning = clauses.slice(0, 2).join(', ');
    }

    return {
      title: typeof card.title === 'string' ? card.title : (card.title[lang] || card.title.en),
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
   */
  static getSmartHistoryCount(
    userTier: UserTier = 'free',
    isRecurring: boolean = false
  ): number {
    if (isRecurring) {
      switch (userTier) {
        case 'free': return 5;
        case 'premium': return 8;
        case 'pro':
        case 'expert': return 12;
        default: return 5;
      }
    }

    switch (userTier) {
      case 'free': return 3;
      case 'premium': return 5;
      case 'pro':
      case 'expert': return 8;
      default: return 3;
    }
  }

  /**
   * Extract meaningful conversation highlights
   * Focuses on user revelations, breakthroughs, and context - NOT AI explanations
   */
  private static extractConversationHighlights(
    conversation: any[] | undefined,
    maxHighlights: number = 2
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
        // Truncate long messages but try to preserve complete thoughts
        if (msg.length <= 100) return msg;
        
        // Find last complete sentence within 100 chars
        const truncated = msg.substring(0, 100);
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
   */
  static async loadRecentReadingHistory(
    userId: string | undefined,
    locale: SupportedLocale,
    count: number = 5,
    includeConversations: boolean = true // Can disable for free tier
  ): Promise<string> {
    if (!userId) return '';

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
        .select('question, interpretations, conversation, reflection, created_at, elements_drawn')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(effectiveCount);

      if (error) {
        console.warn('Failed to load reading history:', error);
        return '';
      }

      if (!data || data.length === 0) {
        return '';
      }

      const labels = getLocaleLabels(locale);
      const headerText = locale === 'zh-TW'
        ? '\n**近期解讀：**\n'
        : locale === 'ja'
        ? '\n**最近のリーディング：**\n'
        : '\n**Recent Readings:**\n';

      let historyText = headerText;

      data.forEach((reading) => {
        const date = new Date(reading.created_at).toLocaleDateString(
          locale === 'zh-TW' ? 'zh-TW' : locale === 'ja' ? 'ja-JP' : 'en-US',
          { month: 'short', day: 'numeric' }
        );
        
        const question = reading.question || labels.generalGuidance;

        // Format: Date - Question
        historyText += `• ${date}: "${question}"\n`;

        // Add key cards drawn (max 3 for brevity)
        if (reading.elements_drawn && reading.elements_drawn.length > 0) {
          const cardNames = reading.elements_drawn
            .slice(0, 3)
            .map((el: any) => el.metadata?.cardTitle)
            .filter(Boolean)
            .join(', ');
          
          if (cardNames) {
            const cardsLabel = locale === 'zh-TW' ? '牌' : locale === 'ja' ? 'カード' : 'Cards';
            historyText += `  ${cardsLabel}: ${cardNames}\n`;
          }
        }

        // Add interpretation summary (first sentence only)
        const interp = reading.interpretations?.traditional?.content 
                    || reading.interpretations?.esoteric?.content 
                    || reading.interpretations?.jungian?.content;
        
        if (interp) {
          const firstSentence = interp.split(/[.!?]/)[0] + '.';
          const summary = firstSentence.length > 120 
            ? firstSentence.substring(0, 120) + '...'
            : firstSentence;
          
          const keyLabel = locale === 'zh-TW' ? '要點' : locale === 'ja' ? 'ポイント' : 'Key point';
          historyText += `  ${keyLabel}: ${summary}\n`;
        }

        // ⭐ NEW: Add conversation highlights (where the real gold often is)
        if (includeConversations && reading.conversation && reading.conversation.length > 0) {
          const highlights = this.extractConversationHighlights(
            reading.conversation,
            2 // Max 2 insights per reading
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
          historyText += `  ${reflectionLabel}: ${reading.reflection}\n`;
        }

        historyText += '\n';
      });

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

      const labels = getLocaleLabels(locale);
      const count = data.length;
      const timeframe = this.getTimeframeSummary(
        data.map(r => r.created_at),
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
      
      section += `${num}. **${cardCtx.position}:** ${cardCtx.title}${reversedLabel}\n`;
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
