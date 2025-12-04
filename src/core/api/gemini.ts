// src/core/api/gemini.ts
/**
 * Gemini AI Provider Implementation
 * * This is ONE implementation of IAIProvider.
 */

import { IAIProvider, AIGenerateParams, AIGenerateResult } from './aiProvider';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// Using Gemini 2.5 Flash model (released 2025)
// Best balance of quality, speed, and cost for interpretations and follow-up Q&A
// Note: This model uses "thinking" tokens - we limit them with thinkingBudget parameter
const GEMINI_MODEL = 'gemini-2.5-flash';
// Alternative models: 'gemini-2.5-pro' (higher quality), 'gemini-1.5-flash' (no thinking mode) 

if (!GEMINI_API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable');
}

export class GeminiProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = GEMINI_API_KEY, model: string = GEMINI_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    const {
      prompt,
      systemPrompt,
      maxTokens = 1200,
      temperature = 0.7,
      language = 'en',
    } = params;
    
    // Build language instruction for system prompt
    const languageInstruction = this.getLanguageInstruction(language);
    
    // Combine language instruction with existing system prompt
    // Language instruction goes at the START for high priority
    const enhancedSystemPrompt = systemPrompt
      ? `${languageInstruction}\n\n${systemPrompt}`
      : languageInstruction;
    
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
            
            // Check for safety ratings that might block content
            if (data.candidates?.[0]?.finishReason) {
                const finishReason = data.candidates[0].finishReason;
                if (finishReason !== 'STOP') {
                    console.warn(`⚠️ Gemini finish reason: ${finishReason}`);
                    if (finishReason === 'SAFETY') {
                        throw new Error('Content was blocked by safety filters. Please try rephrasing your question.');
                    }
                    // MAX_TOKENS is not an error - we still return the partial response
                    // The response was just truncated, which is acceptable
                    if (finishReason === 'MAX_TOKENS') {
                        console.warn('⚠️ Response was truncated at token limit, but returning partial response');
                    }
                }
            }
            
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Handle MAX_TOKENS case where model used all tokens for "thoughts" (internal reasoning)
            // and didn't generate output text yet
            if ((!text || text.trim().length === 0) && data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
                const thoughtsTokens = data.usageMetadata?.thoughtsTokenCount || 0;
                const promptTokens = data.usageMetadata?.promptTokenCount || 0;
                console.warn(`⚠️ Model hit token limit before generating output. Thoughts tokens: ${thoughtsTokens}, Prompt tokens: ${promptTokens}`);
                throw new Error('The response was too long and hit the token limit before completion. Try reducing the prompt length or increasing max tokens.');
            }
            
            // Log response details for debugging other empty response cases
            if (!text || text.trim().length === 0) {
                console.error('❌ Gemini returned empty response');
                console.error('Response data:', JSON.stringify(data, null, 2));
                console.error('Candidates:', data.candidates);
                console.error('Finish reason:', data.candidates?.[0]?.finishReason);
                console.error('Safety ratings:', data.candidates?.[0]?.safetyRatings);
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

        } catch (error) {
            lastError = error;
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
   * Specifies the language and variant (e.g., Traditional Chinese as used in Taiwan)
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