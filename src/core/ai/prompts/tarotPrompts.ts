// src/core/ai/prompts/tarotPrompts.ts
// ADAPTED VERSION for your AIProvider.generate() signature

import { PromptBuilder } from './promptBuilder';
import { getSystemPrompt, getLocaleLabels } from './systemPrompts';
import { supabaseHelpers } from '../../api/supabase';
import type {
  TarotPromptConfig,
  FollowUpPromptConfig,
  DrawnCardData,
} from './types';

/**
 * Get current user ID helper
 */
async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const user = await supabaseHelpers.getCurrentUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

/**
 * Build initial Tarot reading prompt
 * ADAPTED: Returns { prompt, systemPrompt } for your AIProvider
 */
export async function buildInitialTarotPrompt(
  config: TarotPromptConfig
): Promise<{
  prompt: string;  // ← Changed from 'userMessage' to match your API
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  language: 'en' | 'zh-TW';  // ← Added for your API
}> {
  const {
    question,
    drawnCards,
    tier,
    locale,
    userProfile,
    userId,
    userTier = 'free',
  } = config;

  const userContext = PromptBuilder.buildUserContext(userProfile);
  const systemPrompt = getSystemPrompt('tarot', tier, locale, userContext);

  const labels = getLocaleLabels(locale);

  // Build user message/prompt
  let prompt = locale === 'zh-TW'
    ? `請為此塔羅牌解讀提供解讀：\n\n`
    : `Provide an interpretation for this Tarot reading:\n\n`;

  if (question) {
    prompt += `${labels.questionLabel} ${question}\n\n`;
  }

  // ===== LOAD READING HISTORY AND DETECT RECURRING THEMES =====
  const effectiveUserId = userId || (await getCurrentUserId());

  if (effectiveUserId) {
    const recurringThemes = await PromptBuilder.detectRecurringThemes(
      effectiveUserId,
      question,
      locale
    );
    
    const isRecurring = recurringThemes.length > 0;
    const historyCount = PromptBuilder.getSmartHistoryCount(userTier, isRecurring);
    const includeConversations = userTier !== 'free';

    console.log(`📊 Loading ${historyCount} past readings (tier: ${userTier}, recurring: ${isRecurring}, conversations: ${includeConversations})`);

    const history = await PromptBuilder.loadRecentReadingHistory(
      effectiveUserId,
      locale,
      historyCount,
      includeConversations
    );

    if (history) {
      prompt += history;
    }

    if (recurringThemes) {
      prompt += recurringThemes;
    }
  }
  // ===== END READING HISTORY/THEME LOADING =====

  // Add card data
  prompt += PromptBuilder.buildCardDataSection(drawnCards, tier, locale);

  // Add user birth chart if available
  prompt += PromptBuilder.formatUserAstrologyContext(userContext, locale);

  return {
    prompt,  // ← Your API uses 'prompt'
    systemPrompt,
    temperature: 0.7,
    maxTokens: PromptBuilder.getTierTokens(tier),
    language: locale,  // ← Your API needs this
  };
}

/**
 * Build follow-up question prompt
 * ADAPTED: Returns { prompt, systemPrompt } for your AIProvider
 */
export async function buildFollowUpPrompt(
  config: FollowUpPromptConfig
): Promise<{
  prompt: string;  // ← Changed from 'userMessage'
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  language: 'en' | 'zh-TW';  // ← Added for your API
}> {
  const {
    question: userQuestion,
    originalReading,
    conversationHistory,
    locale,
    userProfile,
  } = config;

  const { question: originalQuestion, drawnCards, tier } = originalReading;

  const userContext = PromptBuilder.buildUserContext(userProfile);
  const systemPrompt = getSystemPrompt('tarot', tier, locale, userContext);

  const labels = getLocaleLabels(locale);

  let prompt = locale === 'zh-TW'
    ? `您正在回答關於此塔羅解讀的後續問題：\n\n`
    : `You are continuing a tarot reading conversation.\n\n`;

  if (originalQuestion) {
    prompt += `${labels.questionLabel} ${originalQuestion}\n\n`;
  }

  // Add cards from original reading
  prompt += PromptBuilder.buildCardDataSection(drawnCards, tier, locale);

  // Add conversation history if exists
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += PromptBuilder.formatConversationHistory(conversationHistory, 3);
  }

  // Add user's new question
  const newQuestionLabel = locale === 'zh-TW' ? '新問題：' : 'New question: ';
  prompt += `${newQuestionLabel}${userQuestion}\n`;

  // Follow-up prompts are shorter
  const maxTokens = tier === 'traditional' ? 600 : tier === 'esoteric' ? 800 : 1000;

  return {
    prompt,  // ← Your API uses 'prompt'
    systemPrompt,
    temperature: 0.7,
    maxTokens,
    language: locale,  // ← Your API needs this
  };
}
