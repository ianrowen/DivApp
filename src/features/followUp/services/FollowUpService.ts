// src/features/followUp/services/FollowUpService.ts
/**
 * Follow-up Questions Service
 * Handles conversation about readings with AI
 */

import AIProvider from '../../../core/api/aiProvider';

export interface FollowUpMessage {
  id: string;
  role: 'user' | 'assistant';
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
  messages: FollowUpMessage[];
}

export class FollowUpService {
  /**
   * Generate a follow-up response
   */
  static async askQuestion(
    context: FollowUpContext,
    userQuestion: string
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildPrompt(context, userQuestion);

    try {
      const result = await AIProvider.generate({
        prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1024,
        language: 'en', // TODO: Support multilingual
      });

      return result.text;
    } catch (error) {
      console.error('Follow-up question failed:', error);
      throw new Error('Failed to get answer. Please try again.');
    }
  }

  private static buildSystemPrompt(): string {
    return `You are a helpful Tarot reading assistant. The user has just received a Tarot reading and wants to ask follow-up questions about it.

Your role:
- Answer questions about the cards drawn and their meanings
- Provide deeper insights into the reading
- Help clarify confusing aspects
- Be supportive and encouraging
- Stay within the context of the reading provided

Keep responses concise (2-4 sentences) unless the question requires more detail.`;
  }

  private static buildPrompt(
    context: FollowUpContext,
    userQuestion: string
  ): string {
    let prompt = `The user has received this Tarot reading:\n\n`;

    if (context.originalQuestion) {
      prompt += `Original Question: ${context.originalQuestion}\n\n`;
    }

    prompt += `Cards Drawn:\n`;
    context.cards.forEach((card, index) => {
      const reversed = card.reversed ? ' (Reversed)' : '';
      prompt += `${index + 1}. ${card.position}: ${card.title}${reversed}\n`;
    });

    prompt += `\nInterpretation:\n${context.interpretation}\n\n`;

    if (context.messages.length > 0) {
      prompt += `Previous conversation:\n`;
      context.messages.slice(-3).forEach((msg) => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }

    prompt += `User's new question: ${userQuestion}\n\nPlease provide a helpful answer.`;

    return prompt;
  }
}

export default FollowUpService;

