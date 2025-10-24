/**
 * React Hook for AI Generator
 * Provides an interface for using the mock AI generator service
 */

import type {
  AIGenerateRequest,
  AIGenerateResponse,
  AIMessage,
  AIStreamChunk,
} from '@frontend/types/ai-messages';
import { useCallback, useState } from 'react';

interface UseAIGeneratorReturn {
  isGenerating: boolean;
  isStreaming: boolean;
  error: string | null;
  response: AIGenerateResponse | null;
  messages: AIMessage[];

  // Methods
  generate: (request: AIGenerateRequest) => Promise<AIGenerateResponse>;
  generateStream: (
    request: AIGenerateRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ) => Promise<void>;

  reset: () => void;
}

/**
 * Hook for AI generation with mock service
 */
export function useAIGenerator(): UseAIGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIGenerateResponse | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);

  const generate = useCallback(async (request: AIGenerateRequest) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = {
        id: '1',
        messages: [],
        model: 'gpt-4o',
        provider: 'openai',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
      setResponse(result);
      setMessages(result.messages);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateStream = useCallback(
    async (request: AIGenerateRequest, onChunk: (chunk: AIStreamChunk) => void) => {
      setIsStreaming(true);
      setError(null);

      try {
        const chunks: AIMessage[] = [];

        for await (const chunk of [
          {
            id: '1',
            type: 'delta',
            message: {
              role: 'assistant',
              content: 'Hello, how can I help you today?',
            },
          },
        ]) {
          onChunk({
            id: chunk.id,
            type: chunk.type as 'delta' | 'start' | 'complete' | 'error',
            message: chunk.message as AIMessage,
          });

          if (chunk.type === 'delta' && chunk.message) {
            chunks.push(chunk.message as AIMessage);
          }
        }

        setMessages(chunks);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const generateCursorSuggestion = useCallback(
    async (context: {
      currentFile: string;
      cursorLine: number;
      cursorColumn: number;
      beforeCursor: string;
      afterCursor: string;
    }) => {
      setIsGenerating(true);
      setError(null);

      try {
        const result = {
          id: '1',
          type: 'cursor_suggestion',
          message: {
            role: 'assistant',
            content: 'Hello, how can I help you today?',
          },
        };
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const generateMultiFile = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const files = [
        {
          id: '1',
          name: 'file.ts',
          content: 'console.log("Hello, world!");',
        },
      ];
      return files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setIsStreaming(false);
    setError(null);
    setResponse(null);
    setMessages([]);
  }, []);

  return {
    isGenerating,
    isStreaming,
    error,
    response,
    messages,
    generate,
    generateStream,
    reset,
  };
}
