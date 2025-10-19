export {
  AIPreferencesService,
  type AIUsageStatistics,
  type UserAIPreferences,
} from '@/ai/ai-preferences.service';
export { AIController } from '@/ai/ai.controller';
export { AIModule } from '@/ai/ai.module';
export { AIService } from '@/ai/ai.service';
export {
  createAIModel,
  getAvailableModels,
  getDefaultModel,
  isModelSupported,
} from '@/ai/models.config';
export { AIProvider, PROVIDER_CONFIGS, type ModelOptions, type ProviderConfig } from '@/ai/types';
