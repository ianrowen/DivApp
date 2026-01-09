// src/features/followUp/services/FollowUpService.ts
/**
 * Follow-up Questions Service
 * Handles conversation about readings with AI
 */

import AIProvider from '../../../core/api/aiProvider';
import { getSystemPrompt } from '../../../core/ai/prompts/systemPrompts';
import { PromptBuilder } from '../../../core/ai/prompts/promptBuilder';
import type { InterpretationTier, SupportedLocale, UserProfile } from '../../../core/ai/prompts/types';

export interface FollowUpMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface FollowUpContext {
  readingId: string;
  originalQuestion?: string;
  cards: Array<{
    title: string;
    position: string;
    reversed: boolean;
  }>;
  interpretation: string;
  interpretationStyle?: 'traditional' | 'esoteric' | 'jungian';
  currentInterpretation?: string;
  messages: FollowUpMessage[];
  userProfile?: UserProfile | null;
  locale?: SupportedLocale;
}

export class FollowUpService {
  /**
   * Generate a follow-up response
   */
  static async askQuestion(
    context: FollowUpContext,
    userQuestion: string
  ): Promise<string> {
    // Use comprehensive system prompt for consistency with interpretations
    const style = context.interpretationStyle || 'traditional';
    const locale = context.locale || 'en';
    const userContext = PromptBuilder.buildUserContext(context.userProfile || null);
    const systemPrompt = getSystemPrompt(
      'tarot',
      style as InterpretationTier,
      locale,
      userContext
    );
    const prompt = this.buildPrompt(context, userQuestion);

    // Debug logging: Log prompt details before AI call
    console.log('Follow-up prompt:', prompt);
    console.log('Follow-up prompt length:', prompt.length);
    console.log('Follow-up prompt context check:', {
      hasOriginalQuestion: !!context.originalQuestion,
      cardsCount: context.cards.length,
      hasInterpretation: !!context.interpretation && context.interpretation.length > 0,
      interpretationLength: context.interpretation?.length || 0,
      hasCurrentInterpretation: !!context.currentInterpretation,
      messagesCount: context.messages.length,
      userQuestionLength: userQuestion.length,
    });

    try {
      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1024,
        // Language defaults to current i18n locale from AIProvider
      });

      // Validate response before returning
      if (!result?.text || typeof result.text !== 'string' || result.text.trim().length === 0) {
        console.error('AI returned empty or invalid response:', {
          resultType: typeof result,
          hasText: !!result?.text,
          textLength: result?.text?.length || 0,
        });
        throw new Error('AI returned empty response. Please try rephrasing your question with more context.');
      }

      return result.text;
    } catch (error) {
      console.error('Follow-up question failed:', error);
      throw new Error('Failed to get answer. Please try again.');
    }
  }

  // Removed buildSystemPrompt - now using getSystemPrompt from systemPrompts.ts for consistency

  private static buildPrompt(
    context: FollowUpContext,
    userQuestion: string
  ): string {
    // Validate context has required data
    if (!context.interpretation || context.interpretation.trim().length === 0) {
      console.warn('FollowUpService: context.interpretation is empty or missing');
    }
    if (!context.cards || context.cards.length === 0) {
      console.warn('FollowUpService: context.cards is empty or missing');
    }
    if (!userQuestion || userQuestion.trim().length === 0) {
      console.warn('FollowUpService: userQuestion is empty or missing');
    }

    let prompt = `The user has received this Tarot reading:\n\n`;

    if (context.originalQuestion) {
      prompt += `Original Question: ${context.originalQuestion}\n\n`;
    }

    prompt += `Cards Drawn:\n`;
    if (context.cards && context.cards.length > 0) {
      context.cards.forEach((card, index) => {
        const reversed = card.reversed ? ' (Reversed)' : '';
        const cardTitle = card.title && typeof card.title === 'string' ? card.title : 'Unknown Card';
        const cardPosition = card.position && typeof card.position === 'string' ? card.position : 'Unknown Position';
        prompt += `${index + 1}. ${cardPosition}: ${cardTitle}${reversed}\n`;
      });
    } else {
      prompt += `No cards available.\n`;
    }

    // Include interpretation style information if available
    if (context.interpretationStyle && typeof context.interpretationStyle === 'string') {
      const styleName = context.interpretationStyle.charAt(0).toUpperCase() + context.interpretationStyle.slice(1);
      prompt += `\nThe user is currently viewing the ${styleName} interpretation.\n`;
    }

    // Use current interpretation if provided, otherwise fall back to base interpretation
    const activeInterpretation = context.currentInterpretation || context.interpretation;
    if (activeInterpretation && activeInterpretation.trim().length > 0) {
      prompt += `\nCurrent Interpretation (${context.interpretationStyle || 'traditional'}):\n${activeInterpretation}\n\n`;
    } else {
      console.warn('FollowUpService: No interpretation available in context');
      prompt += `\nCurrent Interpretation: Not available.\n\n`;
    }

    if (context.messages.length > 0) {
      prompt += `Previous conversation:\n`;
      // Include system messages and recent conversation history
      context.messages.slice(-5).forEach((msg) => {
        if (msg.role === 'system') {
          prompt += `[System: ${msg.content}]\n`;
        } else {
          prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }
      });
      prompt += `\n`;
    }

    const formattingNote = context.locale === 'zh-TW'
      ? '\n格式說明：使用**粗體**標記關鍵見解（每段最多1-2處），使用*斜體*標記強調內容。這些標記會自動渲染為粗體和斜體文字。不要對卡牌名稱使用任何格式 - 卡牌名稱應以純文字呈現。'
      : '\nFORMATTING: Use **bold** markdown for key insights (<2 per paragraph), use *italic* markdown for emphasis. These will be rendered as actual bold and italic text. Do NOT format card names - card names should appear as plain text.';
    
    prompt += `User's new question: ${userQuestion}\n\nPlease provide a helpful answer that is relevant to the current interpretation style the user is viewing.${formattingNote}`;

    return prompt;
  }
}

export default FollowUpService;

