import { AIProvider } from '@backend/ai/types';
import { SupabaseService } from '@backend/supabase/supabase.service';
import { Injectable } from '@nestjs/common';

/**
 * User AI Preferences from Database
 */
export interface UserAIPreferences {
  user_id: string;
  default_provider: AIProvider;
  default_model: string;
  default_temperature: number;
  default_max_tokens: number | null;
  total_tokens_used: number;
  total_requests_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * AI Usage Statistics from Database
 */
export interface AIUsageStatistics {
  id: string;
  user_id: string;
  workspace_id: string | null;
  repository_id: string | null;
  session_id: string | null;
  message_id: string | null;
  provider: AIProvider;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number | null;
  generation_time_ms: number | null;
  created_at: string;
}

/**
 * AI Preferences Service
 *
 * Manages user AI preferences and usage tracking in Supabase.
 * This service stores model PREFERENCES (safe), NOT API keys (sensitive).
 *
 * What we store:
 * ✅ Model preferences (provider, model name, temperature, etc.)
 * ✅ Usage statistics (tokens, costs, performance)
 * ✅ User defaults for AI interactions
 *
 * What we NEVER store:
 * ❌ API keys
 * ❌ Access tokens
 * ❌ Authentication credentials
 */
@Injectable()
export class AIPreferencesService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Get user's AI preferences
   * Creates default preferences if they don't exist
   */
  async getUserPreferences(userId: string, clerkToken: string): Promise<UserAIPreferences> {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    // Try to get existing preferences
    const { data, error } = await client
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      throw new Error(`Failed to get AI preferences: ${error.message}`);
    }

    // If preferences don't exist, create them with defaults
    if (!data) {
      return this.createDefaultPreferences(userId, clerkToken);
    }

    return data;
  }

  /**
   * Create default AI preferences for a user
   */
  async createDefaultPreferences(userId: string, clerkToken: string): Promise<UserAIPreferences> {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('user_ai_preferences')
      .insert({
        user_id: userId,
        default_provider: AIProvider.GROQ,
        default_model: 'llama-3.3-70b-versatile',
        default_temperature: 0.7,
        default_max_tokens: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create AI preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user's AI preferences
   */
  async updateUserPreferences(
    userId: string,
    clerkToken: string,
    updates: Partial<{
      default_provider: AIProvider;
      default_model: string;
      default_temperature: number;
      default_max_tokens: number;
    }>
  ): Promise<UserAIPreferences> {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('user_ai_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update AI preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Track AI usage for analytics and cost management
   */
  async trackUsage(
    clerkToken: string,
    usage: {
      user_id: string;
      workspace_id?: string;
      repository_id?: string;
      session_id?: string;
      message_id?: string;
      provider: AIProvider;
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      estimated_cost?: number;
      generation_time_ms?: number;
    }
  ): Promise<AIUsageStatistics> {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    const { data, error } = await client
      .from('ai_usage_statistics')
      .insert(usage)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track AI usage: ${error.message}`);
    }

    // Update user's total tokens and request count
    await client
      .from('user_ai_preferences')
      .update({
        total_tokens_used: client.rpc('increment_total_tokens', {
          user_id: usage.user_id,
          tokens: usage.total_tokens,
        }),
        total_requests_count: client.rpc('increment_total_requests', {
          user_id: usage.user_id,
        }),
        last_used_at: new Date().toISOString(),
      })
      .eq('user_id', usage.user_id);

    return data;
  }

  /**
   * Get user's usage statistics for a time period
   */
  async getUserUsageStats(
    userId: string,
    clerkToken: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      workspaceId?: string;
      repositoryId?: string;
    }
  ) {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    let query = client
      .from('ai_usage_statistics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options?.workspaceId) {
      query = query.eq('workspace_id', options.workspaceId);
    }

    if (options?.repositoryId) {
      query = query.eq('repository_id', options.repositoryId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }

    return data as AIUsageStatistics[];
  }

  /**
   * Get aggregated usage statistics
   */
  async getAggregatedUsageStats(
    userId: string,
    clerkToken: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'provider' | 'model' | 'day';
    }
  ) {
    // Build the query based on grouping
    const stats = await this.getUserUsageStats(userId, clerkToken, options);

    // Define the structure of aggregated data
    interface AggregatedData {
      request_count: number;
      total_tokens: number;
      total_cost: number;
      avg_generation_time: number;
      generation_times: number[];
    }

    // Aggregate in memory (for simplicity)
    // In production, you might want to use SQL aggregation functions
    const aggregated = stats.reduce(
      (acc, stat) => {
        const key =
          options?.groupBy === 'provider'
            ? stat.provider
            : options?.groupBy === 'model'
              ? stat.model
              : stat.created_at.split('T')[0]; // day

        if (!acc[key]) {
          acc[key] = {
            request_count: 0,
            total_tokens: 0,
            total_cost: 0,
            avg_generation_time: 0,
            generation_times: [],
          };
        }

        acc[key].request_count += 1;
        acc[key].total_tokens += stat.total_tokens;
        acc[key].total_cost += stat.estimated_cost || 0;

        if (stat.generation_time_ms) {
          acc[key].generation_times.push(stat.generation_time_ms);
        }

        return acc;
      },
      {} as Record<string, AggregatedData>
    );

    // Calculate averages and remove intermediate data
    const result: Record<string, Omit<AggregatedData, 'generation_times'>> = {};

    Object.keys(aggregated).forEach((key) => {
      const times = aggregated[key].generation_times;
      const avgTime =
        times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;

      result[key] = {
        request_count: aggregated[key].request_count,
        total_tokens: aggregated[key].total_tokens,
        total_cost: aggregated[key].total_cost,
        avg_generation_time: avgTime,
      };
    });

    return result;
  }

  /**
   * Get workspace usage statistics (for workspace admins)
   */
  async getWorkspaceUsageStats(
    workspaceId: string,
    clerkToken: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const client = this.supabase.getClientWithClerkToken(clerkToken);

    let query = client
      .from('ai_usage_statistics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get workspace usage: ${error.message}`);
    }

    return data as AIUsageStatistics[];
  }
}
