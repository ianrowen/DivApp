// src/core/api/aiProvider.ts
/**
 * AI Provider Abstraction Layer (CRITICAL ARCHITECTURE)
 * * This abstracts the AI backend so we can:
 * 1. Switch providers (Gemini → Claude → GPT) without changing app code
 * 2. Hide implementation details from users
 * 3. Control cost and quality globally
 */

import { i18n, type SupportedLocale } from '../../i18n';

export interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  language?: 'en' | 'zh-TW' | 'ja' | 'es' | 'ru';
}

export interface AIGenerateResult {
  text: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  provider: string;
  model: string;
}

export interface IAIProvider {
  generate(params: AIGenerateParams): Promise<AIGenerateResult>;
  generateStream?(params: AIGenerateParams): AsyncGenerator<string>;
}

// Provider registry for easy switching
class AIProviderRegistry {
  private providers: Map<string, IAIProvider> = new Map();
  private activeProvider: string = 'gemini'; // Default

  register(name: string, provider: IAIProvider) {
    this.providers.set(name, provider);
  }

  setActiveProvider(name: string) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not registered`);
    }
    this.activeProvider = name;
  }

  getActiveProvider(): IAIProvider {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`No active provider set`);
    }
    return provider;
  }
}

// Global registry instance
const registry = new AIProviderRegistry();

// Public API - this is what the rest of the app uses
export const AIProvider = {
  /**
   * Generate AI response
   * Language defaults to current i18n locale if not specified
   */
  async generate(params: AIGenerateParams): Promise<AIGenerateResult> {
    // Default to current i18n locale if language not specified
    // Cast to AIGenerateParams language type (which supports more languages than SupportedLocale)
    const language = params.language || (i18n.locale as AIGenerateParams['language']);
    
    // Create params with language set
    const paramsWithLanguage: AIGenerateParams = {
      ...params,
      language,
    };
    
    const provider = registry.getActiveProvider();
    return provider.generate(paramsWithLanguage);
  },

  /**
   * Generate streaming response (optional)
   */
  generateStream(params: AIGenerateParams): AsyncGenerator<string> {
    const provider = registry.getActiveProvider();
    if (!provider.generateStream) {
      throw new Error('Active provider does not support streaming');
    }
    return provider.generateStream(params);
  },

  /**
   * Register a new provider (called at app startup)
   */
  register(name: string, provider: IAIProvider) {
    registry.register(name, provider);
  },

  /**
   * Switch active provider (for A/B testing, failover)
   */
  setProvider(name: string) {
    registry.setActiveProvider(name);
  },
};

export default AIProvider;