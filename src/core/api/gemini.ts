// src/core/api/gemini.ts
/**
 * Gemini AI Provider Implementation
 * * This is ONE implementation of IAIProvider.
 */

import { IAIProvider, AIGenerateParams, AIGenerateResult } from './aiProvider';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// Using a fast, cost-efficient model for most tasks
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025'; 

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
      maxTokens = 2048,
      temperature = 0.7,
    } = params;
    
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
                        systemInstruction: systemPrompt ? {
                            parts: [{ text: systemPrompt }]
                        } : undefined,
                        
                        generationConfig: {
                            temperature,
                            maxOutputTokens: maxTokens,
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
            
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
export default geminiProvider;