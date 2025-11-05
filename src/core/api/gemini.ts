// src/core/api/gemini.ts
/**
 * Gemini AI Provider Implementation
 * 
 * This is ONE implementation of IAIProvider.
 * To switch to Claude or GPT, create claude.ts or openai.ts
 * with the same interface, then register it instead.
 */

import { IAIProvider, AIGenerateParams, AIGenerateResult } from './aiProvider';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Use flash for cost efficiency

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
                parts: [
                  {
                    text: systemPrompt 
                      ? `${systemPrompt}\n\n${prompt}` 
                      : prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              topP: 0.95,
              topK: 40,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Extract text from Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract token usage (Gemini provides this in metadata)
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
      console.error('Gemini generation error:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  // Optional: Streaming support for follow-up questions
  async *generateStream(params: AIGenerateParams): AsyncGenerator<string> {
    // Streaming implementation would go here
    // For MVP, we can skip this and just use generate()
    throw new Error('Streaming not yet implemented for Gemini');
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();
export default geminiProvider;
