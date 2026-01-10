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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini.ts:generate',message:'Gemini generate called',data:{hasApiKey:!!this.apiKey,apiKeyLength:this.apiKey?.length||0,apiKeyPrefix:this.apiKey?.substring(0,10)||'none',model:this.model},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!this.apiKey || this.apiKey.trim() === '') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini.ts:generate',message:'API key missing',data:{hasApiKey:!!this.apiKey,envVar:process.env.EXPO_PUBLIC_GEMINI_API_KEY?.substring(0,10)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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

  // Streaming support for progressive interpretation display
  // Uses XMLHttpRequest for React Native compatibility (supports POST + streaming)
  async *generateStream(params: AIGenerateParams): AsyncGenerator<string> {
    // Check for API key before proceeding
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY environment variable.');
    }

    let {
      prompt,
      systemPrompt,
      maxTokens = 2500,
      temperature = 0.7,
      language = 'en',
    } = params;
    
    // --- SAFETY PATCH FOR GEMINI 2.5 ---
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
    const enhancedSystemPrompt = systemPrompt
      ? `${languageInstruction}\n\n${thinkingInstruction}${systemPrompt}`
      : `${languageInstruction}\n\n${thinkingInstruction}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const requestBody = JSON.stringify({
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
    });

    // Try fetch with ReadableStream first (works on web)
    // Fall back to XMLHttpRequest for React Native
    const isWeb = typeof window !== 'undefined' && typeof ReadableStream !== 'undefined';
    
    if (isWeb) {
      // Use fetch with ReadableStream on web
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: requestBody,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
          throw new Error(
            `Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`
          );
        }

        if (!response.body || typeof response.body.getReader !== 'function') {
          throw new Error('Streaming not supported with fetch');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  const candidate = json.candidates?.[0];
                  const delta = candidate?.content?.parts?.[0]?.text;
                  
                  if (delta) {
                    yield delta;
                  }

                  if (candidate?.finishReason) {
                    const finishReason = candidate.finishReason;
                    if (finishReason === 'SAFETY') {
                      throw new Error('Content was blocked by safety filters. Please try rephrasing your question.');
                    }
                    if (finishReason === 'STOP' || finishReason === 'MAX_TOKENS') {
                      return;
                    }
                  }

                  if (json.error) {
                    throw new Error(`Gemini API error: ${json.error.message || JSON.stringify(json.error)}`);
                  }
                } catch (parseError: any) {
                  if (parseError.name !== 'SyntaxError') {
                    console.warn('Error parsing SSE data:', parseError);
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        return; // Successfully streamed with fetch
      } catch (fetchError: any) {
        // Fall through to XMLHttpRequest if fetch fails
        if (!fetchError.message?.includes('not supported')) {
          console.warn('Fetch streaming failed, trying XMLHttpRequest:', fetchError);
        }
      }
    }

    // Use XMLHttpRequest for React Native (supports POST + streaming via onprogress)
    yield* this.streamWithXHR(url, requestBody);
  }

  // XMLHttpRequest-based streaming for React Native
  private async *streamWithXHR(url: string, body: string): AsyncGenerator<string> {
    const chunks: string[] = [];
    let isComplete = false;
    let error: Error | null = null;
    let buffer = '';
    let lastProcessedLength = 0;
    let pollInterval: NodeJS.Timeout | null = null;

    const processResponseText = (responseText: string) => {
      if (responseText.length <= lastProcessedLength) {
        return; // No new data
      }

      const newData = responseText.slice(lastProcessedLength);
      buffer += newData;
      lastProcessedLength = responseText.length;

      // Process complete SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const candidate = json.candidates?.[0];
            const delta = candidate?.content?.parts?.[0]?.text;
            
            if (delta) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini.ts:364',message:'Chunk received from API',data:{chunkSize:delta.length,chunkPreview:delta.substring(0,30),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              chunks.push(delta);
            }

            if (candidate?.finishReason) {
              const finishReason = candidate.finishReason;
              if (finishReason === 'SAFETY') {
                error = new Error('Content was blocked by safety filters. Please try rephrasing your question.');
                return;
              }
              if (finishReason === 'STOP' || finishReason === 'MAX_TOKENS') {
                // Stream is complete
                isComplete = true;
              }
            }

            if (json.error) {
              error = new Error(`Gemini API error: ${json.error.message || JSON.stringify(json.error)}`);
              return;
            }
          } catch (parseError: any) {
            // Skip parsing errors for non-JSON SSE events
            if (parseError.name !== 'SyntaxError') {
              console.warn('Error parsing SSE data:', parseError, 'Line:', line);
            }
          }
        }
      }
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-goog-api-key', this.apiKey);
    
    // Enable response streaming (if supported)
    if ('responseType' in xhr) {
      // Keep default responseType for text streaming
    }

    xhr.onprogress = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING && xhr.responseText) {
        processResponseText(xhr.responseText);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING && xhr.responseText) {
        processResponseText(xhr.responseText);
      }
    };

    xhr.onload = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        // Process any remaining data
        if (xhr.responseText && xhr.responseText.length > lastProcessedLength) {
          processResponseText(xhr.responseText);
        }
        isComplete = true;
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          error = new Error(`Gemini API error (${xhr.status}): ${errorData.error?.message || xhr.statusText}`);
        } catch {
          error = new Error(`Gemini API error (${xhr.status}): ${xhr.statusText}`);
        }
        isComplete = true;
      }
    };

    xhr.onerror = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      error = new Error('Network error while streaming from Gemini API');
      isComplete = true;
    };

    xhr.send(body);

    // Poll for updates if onprogress doesn't fire (some React Native versions buffer responses)
    // Check responseText periodically
    pollInterval = setInterval(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/428b75af-757e-429a-aaa1-d11d73a7516d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini.ts:450',message:'Poll interval fired',data:{readyState:xhr.readyState,responseTextLength:xhr.responseText?.length||0,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (xhr.readyState === XMLHttpRequest.LOADING && xhr.responseText) {
        processResponseText(xhr.responseText);
      } else if (xhr.readyState === XMLHttpRequest.DONE) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    }, 16); // Check every 16ms (~60fps) for faster chunk detection

    // Yield chunks as they arrive
    try {
      while (!isComplete || chunks.length > 0) {
        if (error) {
          throw error;
        }
        
        if (chunks.length > 0) {
          const chunk = chunks.shift()!;
          yield chunk;
        } else if (!isComplete) {
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 20));
        } else {
          break;
        }
      }
    } finally {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (xhr.readyState !== XMLHttpRequest.DONE && xhr.readyState !== XMLHttpRequest.UNSENT) {
        xhr.abort();
      }
    }
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