import { AIPreferencesService } from '@/ai/ai-preferences.service';
import { AIService } from '@/ai/ai.service';
import { AIProvider } from '@/ai/types';
import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

/**
 * AI Controller
 *
 * Provides endpoints for AI generation and user preferences management.
 */
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly preferencesService: AIPreferencesService
  ) {}

  /**
   * Get available models for a provider
   *
   * @example GET /ai/models?provider=groq
   */
  @Get('models')
  @Public()
  getModels(@Query('provider') provider?: AIProvider) {
    return {
      provider: provider || AIProvider.GROQ,
      defaultModel: this.aiService.getDefaultModel(provider),
      models: this.aiService.getAvailableModels(provider),
    };
  }

  /**
   * Generate text using AI
   *
   * @example
   * POST /ai/generate
   * {
   *   "prompt": "Write a haiku about TypeScript",
   *   "model": "llama-3.3-70b-versatile",
   *   "temperature": 0.7
   * }
   */
  @Post('generate')
  @Public()
  async generate(
    @Body()
    body: {
      prompt: string;
      model?: string;
      provider?: AIProvider;
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    const result = await this.aiService.generate(body);

    return {
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    };
  }

  /**
   * Get current user's AI preferences
   *
   * @example GET /ai/preferences
   */
  @Get('preferences')
  async getPreferences(@CurrentUser('id') userId: string, @ClerkToken() clerkToken: string) {
    return this.preferencesService.getUserPreferences(userId, clerkToken);
  }

  /**
   * Update current user's AI preferences
   *
   * @example
   * PUT /ai/preferences
   * {
   *   "default_provider": "groq",
   *   "default_model": "llama-3.1-8b-instant",
   *   "default_temperature": 0.8
   * }
   */
  @Put('preferences')
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @ClerkToken() clerkToken: string,
    @Body()
    updates: Partial<{
      default_provider: AIProvider;
      default_model: string;
      default_temperature: number;
      default_max_tokens: number;
    }>
  ) {
    return this.preferencesService.updateUserPreferences(userId, clerkToken, updates);
  }

  /**
   * Get current user's usage statistics
   *
   * @example GET /ai/usage?days=30
   */
  @Get('usage')
  async getUsageStats(
    @CurrentUser('id') userId: string,
    @ClerkToken() clerkToken: string,
    @Query('days') days?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('repositoryId') repositoryId?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.preferencesService.getUserUsageStats(userId, clerkToken, {
      startDate,
      workspaceId,
      repositoryId,
    });
  }

  /**
   * Get aggregated usage statistics
   *
   * @example GET /ai/usage/aggregate?groupBy=model&days=7
   */
  @Get('usage/aggregate')
  async getAggregatedUsage(
    @CurrentUser('id') userId: string,
    @ClerkToken() clerkToken: string,
    @Query('groupBy') groupBy?: 'provider' | 'model' | 'day',
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.preferencesService.getAggregatedUsageStats(userId, clerkToken, {
      startDate,
      groupBy,
    });
  }

  /**
   * Get workspace usage statistics (for workspace members)
   *
   * @example GET /ai/workspaces/:workspaceId/usage?days=7
   */
  @Get('workspaces/:workspaceId/usage')
  async getWorkspaceUsage(
    @Param('workspaceId') workspaceId: string,
    @ClerkToken() clerkToken: string,
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.preferencesService.getWorkspaceUsageStats(workspaceId, clerkToken, {
      startDate,
    });
  }
}
