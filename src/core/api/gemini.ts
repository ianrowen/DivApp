// src/core/api/gemini.ts
/**
 * Gemini AI Provider Implementation
 * * This is ONE implementation of IAIProvider.
 */

import { IAIProvider, AIGenerateParams, AIGenerateResult } from './aiProvider';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// Using Gemini 2.5 Flash model
// Best balance of quality, speed, and cost for interpretations and follow-up Q&A
// Note: This model uses "thinking" tokens. We handle this by ensuring maxTokens is high enough.
const GEMINI_MODEL = 'gemini-2.5-flash';

// Don't throw immediately - let the provider handle missing keys gracefully
if (!GEMINI_API_KEY) {
  // Missing API key - AI features will not work
}

export class GeminiProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = GEMINI_API_KEY, model: string = GEMINI_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    // Check for API key before proceeding
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY environment variable.');
    }

    let {
      prompt,
      systemPrompt,
      maxTokens = 2500, // Increased default
      temperature = 0.7,
      language = 'en',
    } = params;
    
    // --- SAFETY PATCH FOR GEMINI 2.5 ---
    // Gemini 2.5 uses "Thinking Tokens" (approx 1000-2000) before writing.
    // If maxTokens is too low, it uses them all up thinking and produces 0 output.
    // We need at least 3000-4000 total: ~1500 for thinking + ~2000-2500 for output.
    if (this.model.includes('2.5') && maxTokens < 4000) {
        maxTokens = 4000;
    }
    // -----------------------------------

    // Build language instruction for system prompt
    const languageInstruction = this.getLanguageInstruction(language);
    
    // For Gemini 2.5, add instruction to reduce thinking time and be direct
    const thinkingInstruction = this.model.includes('2.5')
      ? 'Be direct and concise. Minimize internal reasoning. Focus on generating the response quickly.\n\n'
      : '';
    
    // Combine language instruction with existing system prompt
    // Language instruction goes at the START for high priority
    const enhancedSystemPrompt = systemPrompt
      ? `${languageInstruction}\n\n${thinkingInstruction}${systemPrompt}`
      : `${languageInstruction}\n\n${thinkingInstruction}`;
    
    // Simple retry logic (exponential backoff)
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: prompt },
                                ],
                            },
                        ],
                        systemInstruction: enhancedSystemPrompt ? {
                            parts: [{ text: enhancedSystemPrompt }]
                        } : undefined,
                        
                        generationConfig: {
                            temperature,
                            maxOutputTokens: maxTokens,
                            candidateCount: 1,
                            responseMimeType: 'text/plain',
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`
                );
            }

            const data = await response.json();
            
            // Enhanced error checking for Gemini API responses
            if (data.error) {
                throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
            }
            
            const candidate = data.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text || '';
            const finishReason = candidate?.finishReason;

            // Check for safety ratings that might block content
            if (finishReason) {
                if (finishReason !== 'STOP') {
                    console.warn(`⚠️ Gemini finish reason: ${finishReason}`);
                    
                    if (finishReason === 'SAFETY') {
                        throw new Error('Content was blocked by safety filters. Please try rephrasing your question.');
                    }
                    
                    if (finishReason === 'MAX_TOKENS') {
                        const thoughts = data.usageMetadata?.thoughtsTokenCount || 0;
                        console.warn(`⚠️ Response truncated. Thoughts used: ${thoughts}. Text length: ${text.length}`);
                    }
                }
            }
            
            // Handle MAX_TOKENS case where model used all tokens for "thoughts"
            // OLD LOGIC: Threw error if text was empty.
            // NEW LOGIC: Still throw if empty, but with clearer message.
            if ((!text || text.trim().length === 0) && finishReason === 'MAX_TOKENS') {
                const thoughtsTokens = data.usageMetadata?.thoughtsTokenCount || 0;
                console.warn(`⚠️ Model hit token limit purely on thoughts (${thoughtsTokens} tokens).`);
                throw new Error('The AI spent too long thinking. Please try again (the token limit has been auto-adjusted).');
            }
            
            // Log response details for debugging other empty response cases
            if (!text || text.trim().length === 0) {
                console.error('❌ Gemini returned empty response');
                console.error('Finish reason:', finishReason);
                throw new Error('Gemini API returned empty response. This may be due to content filtering or an API issue.');
            }
            
            const usageMetadata = data.usageMetadata || {};
            
            const tokensUsed = {
                input: usageMetadata.promptTokenCount || 0,
                output: usageMetadata.candidatesTokenCount || 0,
            };

            return {
                text,
                tokensUsed,
                provider: 'gemini',
                model: this.model,
            };

        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed: ${error?.message || error}`);
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    console.error('Gemini generation error after retries:', lastError);
    throw new Error(`AI generation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Optional: Streaming support for follow-up questions
  async *generateStream(params: AIGenerateParams): AsyncGenerator<string> {
    throw new Error('Streaming not yet implemented for Gemini');
  }
  
  /**
   * Get language instruction for system prompt
   */
  private getLanguageInstruction(language: string): string {
    switch (language) {
      case 'zh-TW':
        return 'IMPORTANT: Respond in Traditional Chinese (繁體中文) as used in Taiwan. Use Traditional Chinese characters, not Simplified Chinese.';
      case 'en':
        return 'Respond in English.';
      case 'ja':
        return 'Respond in Japanese (日本語).';
      case 'es':
        return 'Respond in Spanish (Español).';
      case 'ru':
        return 'Respond in Russian (Русский).';
      default:
        return 'Respond in English.';
    }
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
export default geminiProvider;