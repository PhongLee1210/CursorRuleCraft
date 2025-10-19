/**
 * AI Provider Types
 * Define supported AI providers and their configurations
 */

export enum AIProvider {
  GROQ = 'groq',
  // Future providers can be added here:
  // OPENAI = 'openai',
  // ANTHROPIC = 'anthropic',
  // GOOGLE = 'google',
}

export interface ProviderConfig {
  baseURL: string;
  defaultModel: string;
  models: string[];
}

export interface ModelOptions {
  provider?: AIProvider;
  model?: string;
  apiKey?: string;
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  [AIProvider.GROQ]: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  },
  // Future provider configs can be added here:
  // [AIProvider.OPENAI]: {
  //   baseURL: 'https://api.openai.com/v1',
  //   defaultModel: 'gpt-4-turbo-preview',
  //   models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
  // },
};
