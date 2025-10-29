import { AIPreferencesService } from '@backend/ai/ai-preferences.service';
import { AIService } from '@backend/ai/ai.service';
import { PromptTemplateService } from '@backend/ai/prompt-template.service';
import { AIProvider } from '@backend/ai/types';
import { ClerkToken } from '@backend/auth/decorators/clerk-token.decorator';
import { CurrentUser } from '@backend/auth/decorators/current-user.decorator';
import { Public } from '@backend/auth/decorators/public.decorator';
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
   * Generate cursor rules with phased streaming (rule generation + follow-up message)
   *
   * @example
   * POST /ai/generate-rules
   * {
   *   "messages": [
   *     { "role": "user", "content": "Create a rule for React components" }
   *   ],
   *   "ruleType": "PROJECT_RULE",
   *   "fileName": "react-components"
   * }
   */
  @Post('generate-rules')
  @Public()
  async generateRules(
    @Body()
    body: {
      messages: any[];
      ruleType: 'PROJECT_RULE' | 'COMMAND' | 'USER_RULE';
      fileName?: string;
      techStack?: string[];
      model?: string;
      provider?: AIProvider;
      temperature?: number;
      maxTokens?: number;
    },
    @Res() res: Response
  ) {
    const { messages, ruleType, fileName, model, provider, temperature, maxTokens } = body;

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Validate input
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        res.status(400).send('Last message must be from user');
        return;
      }

      // Convert messages for AI SDK
      const modelMessages = convertToModelMessages(messages);

      // Load enhanced rule generation prompt template
      const ruleGenerationPrompt = this.promptTemplate.renderTemplate('enhanced-rule-generation', {
        techStack: (body.techStack || []).join(', ') || 'general',
        ruleType: ruleType.toLowerCase().replace('_', ' '),
        userRequest: lastMessage.content || '',
        fileName: fileName || 'generated-rule',
      });

      // Set up custom streaming response
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Helper function to send JSON data as SSE
      const sendData = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Phase 1: Generate the cursor rule
        sendData({
          type: 'phase-start',
          phase: 'rule-generation',
          metadata: { ruleType, fileName },
        });

        const ruleStream = await this.aiService.generateStream({
          messages: [
            ...modelMessages.slice(0, -1), // All messages except last
            {
              role: 'system',
              content: ruleGenerationPrompt,
            },
            modelMessages[modelMessages.length - 1], // Last user message
          ],
          model,
          provider,
          temperature: temperature || 0.3, // Lower temperature for code generation
          maxTokens,
        });

        // Stream rule generation with metadata
        let ruleContent = '';
        for await (const chunk of ruleStream.textStream) {
          ruleContent += chunk;
          sendData({
            type: 'rule-content',
            content: chunk,
            accumulatedContent: ruleContent,
            phase: 'rule-generation',
          });
        }

        // Phase transition: Rule generation complete
        sendData({
          type: 'phase-end',
          phase: 'rule-generation',
          finalContent: ruleContent,
        });

        // Phase 2: Generate follow-up explanation message
        sendData({
          type: 'phase-start',
          phase: 'follow-up-message',
        });

        const followUpPrompt = this.promptTemplate.renderTemplate('rule-followup', {
          generatedRule: ruleContent.substring(0, 1000), // Truncate for context
          ruleType: ruleType.toLowerCase().replace('_', ' '),
        });

        const followUpStream = await this.aiService.generateStream({
          messages: [
            ...modelMessages,
            {
              role: 'assistant',
              content: `I've generated a cursor rule:\n\n${ruleContent}`,
            },
            {
              role: 'system',
              content: followUpPrompt,
            },
            {
              role: 'user',
              content: 'Please explain what this rule does and how to use it.',
            },
          ],
          model,
          provider,
          temperature: temperature || 0.7, // Higher temperature for explanation
          maxTokens: maxTokens || 500,
        });

        // Stream follow-up message
        let followUpContent = '';
        for await (const chunk of followUpStream.textStream) {
          followUpContent += chunk;
          sendData({
            type: 'follow-up-content',
            content: chunk,
            accumulatedContent: followUpContent,
            phase: 'follow-up-message',
          });
        }

        // Complete the streaming
        sendData({
          type: 'phase-end',
          phase: 'follow-up-message',
          finalContent: followUpContent,
        });

        res.end();
      } catch (error) {
        console.error('Rule generation streaming error:', error);
        sendData({
          type: 'error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
        res.end();
      }
    } catch (error) {
      console.error('Rule generation error:', error);
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
