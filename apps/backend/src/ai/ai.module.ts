import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { AIPreferencesService } from './ai-preferences.service';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { PromptTemplateService } from './prompt-template.service';

/**
 * AI Module
 *
 * Provides AI model integration for the application.
 * Currently supports Groq, designed to scale to multiple providers.
 *
 * Usage:
 * 1. Import AIModule in your feature module
 * 2. Inject AIService in your service/controller
 * 3. Use AIService methods to interact with AI models
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [AIModule],
 *   // ...
 * })
 * export class YourModule {}
 *
 * @Injectable()
 * export class YourService {
 *   constructor(private readonly aiService: AIService) {}
 *
 *   async generateResponse() {
 *     return this.aiService.generate({
 *       prompt: 'Hello, AI!',
 *       model: 'llama-3.3-70b-versatile'
 *     });
 *   }
 * }
 * ```
 */
@Module({
  imports: [ConfigModule, SupabaseModule],
  controllers: [AIController],
  providers: [AIService, AIPreferencesService, PromptTemplateService],
  exports: [AIService, AIPreferencesService, PromptTemplateService],
})
export class AIModule {}
