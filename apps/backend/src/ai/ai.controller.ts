import { AIPreferencesService } from '@/ai/ai-preferences.service';
import { AIService } from '@/ai/ai.service';
import { PromptTemplateService } from '@/ai/prompt-template.service';
import { AIProvider } from '@/ai/types';
import { ClerkToken } from '@/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Body, Controller, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { convertToModelMessages } from 'ai';
import { Response } from 'express';

/**
 * AI Controller
 *
 * Provides endpoints for AI generation and user preferences management.
 */
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly preferencesService: AIPreferencesService,
    private readonly promptTemplate: PromptTemplateService
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
   * Stream AI chat responses
   *
   * @example
   * POST /ai/chat
   * {
   *   "messages": [
   *     { "role": "user", "content": "Hello, how are you?" }
   *   ],
   *   "model": "llama-3.3-70b-versatile",
   *   "temperature": 0.7
   * }
   */
  @Post('chat')
  @Public()
  async chat(@Body() body: any, @Res() res: Response) {
    // Handle ai-sdk useChat format - extract messages from the request
    let messages: any[]; // UIMessage[] from frontend
    let model: string | undefined;
    let provider: AIProvider | undefined;
    let temperature: number | undefined;
    let maxTokens: number | undefined;

    try {
      if (Array.isArray(body)) {
        // useChat sends messages as an array directly (when body is just the messages array)
        messages = body; // Keep as UIMessages for conversion later
      } else if (typeof body === 'object' && body !== null) {
        // Handle object format with messages array or single message
        if (body.messages && Array.isArray(body.messages)) {
          messages = body.messages; // Keep as UIMessages for conversion later
        } else if (body.message) {
          // Single message format - ensure content is a string
          const content =
            typeof body.message === 'string' ? body.message : JSON.stringify(body.message);
          messages = [{ role: 'user', content }];
        } else {
          throw new Error('No messages found in request body');
        }

        // Extract additional parameters
        model = body.model;
        provider = body.provider;
        temperature = body.temperature;
        maxTokens = body.maxTokens;
      } else {
        throw new Error('Invalid body format');
      }
    } catch (error) {
      console.error('Failed to parse request body:', error);
      res.status(400).send('Invalid request body format');
      return;
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Get the last user message to validate the request
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        res.status(400).send('Last message must be from user');
        return;
      }

      // Additional validation for message content
      if (!lastMessage.content && (!lastMessage.parts || lastMessage.parts.length === 0)) {
        res.status(400).send('Last message must have content');
        return;
      }

      // Get system prompt from template
      const systemPrompt = this.promptTemplate.loadTemplate('chat');

      // Convert UIMessages to ModelMessages for AI SDK
      const modelMessages = convertToModelMessages(messages);

      const stream = await this.aiService.generateStream({
        messages: modelMessages,
        system: systemPrompt,
        model,
        provider,
        temperature,
        maxTokens,
      });

      return stream.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      console.error('Chat streaming error:', error);
      res.status(500).send('Internal server error');
    }
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
