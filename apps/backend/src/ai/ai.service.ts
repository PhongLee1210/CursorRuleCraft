import {
  createAIModel,
  getAvailableModels,
  getDefaultModel,
  isModelSupported,
} from '@/ai/models.config';
import { AIProvider, type ModelOptions } from '@/ai/types';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, streamText } from 'ai';

/**
 * AI Service
 *
 * Provides a centralized service for interacting with AI models.
 * Supports multiple providers with easy configuration and scaling.
 */
@Injectable()
export class AIService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get API key from environment for a specific provider
   */
  private getProviderApiKey(provider: AIProvider): string {
    const envKey = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = this.configService.get<string>(envKey);

    if (!apiKey) {
      throw new Error(
        `API key not found for provider ${provider}. Please set ${envKey} environment variable.`
      );
    }

    return apiKey;
  }

  /**
   * Create a model instance with the specified configuration
   */
  createModel(options: ModelOptions = {}) {
    const provider = options.provider || AIProvider.GROQ;
    const apiKey = options.apiKey || this.getProviderApiKey(provider);

    return createAIModel({
      ...options,
      apiKey,
    });
  }

  /**
   * Generate text using the AI model
   *
   * @example
   * ```ts
   * const result = await aiService.generate({
   *   prompt: 'Write a haiku about TypeScript',
   *   model: 'llama-3.3-70b-versatile'
   * });
   * console.log(result.text);
   * ```
   */
  async generate(options: {
    prompt: string;
    model?: string;
    provider?: AIProvider;
    temperature?: number;
    maxTokens?: number;
  }) {
    const { prompt, model, provider, temperature, maxTokens } = options;

    const aiModel = this.createModel({ model, provider });

    return generateText({
      model: aiModel,
      prompt,
      temperature,
      ...(maxTokens && { maxTokens }),
    });
  }

  /**
   * Stream text generation using the AI model
   *
   * @example
   * ```ts
   * const stream = await aiService.generateStream({
   *   prompt: 'Explain quantum computing',
   *   model: 'llama-3.3-70b-versatile'
   * });
   *
   * for await (const chunk of stream.textStream) {
   *   process.stdout.write(chunk);
   * }
   * ```
   */
  async generateStream(options: {
    prompt: string;
    model?: string;
    provider?: AIProvider;
    temperature?: number;
    maxTokens?: number;
  }) {
    const { prompt, model, provider, temperature, maxTokens } = options;

    const aiModel = this.createModel({ model, provider });

    return streamText({
      model: aiModel,
      prompt,
      temperature,
      ...(maxTokens && { maxTokens }),
    });
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider = AIProvider.GROQ): string[] {
    return getAvailableModels(provider);
  }

  /**
   * Get default model for a provider
   */
  getDefaultModel(provider: AIProvider = AIProvider.GROQ): string {
    return getDefaultModel(provider);
  }

  /**
   * Validate if a model is supported
   */
  isModelSupported(model: string, provider: AIProvider = AIProvider.GROQ): boolean {
    return isModelSupported(model, provider);
  }
}
