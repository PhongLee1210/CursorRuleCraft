/**
 * AI Message Types
 * Based on e2b-dev/fragments message patterns for AI code generation
 */

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  CODE = 'code',
  FILE = 'file',
}

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  timestamp: number;
}

/**
 * Text message
 */
export interface MessageText extends BaseMessage {
  type: MessageType.TEXT;
  content: string;
}

/**
 * Code message - represents generated code snippets
 */
export interface MessageCode extends BaseMessage {
  type: MessageType.CODE;
  language: string;
  code: string;
  description?: string;
  fileName?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * File message - represents full file operations
 */
export interface MessageFile extends BaseMessage {
  type: MessageType.FILE;
  fileName: string;
  filePath: string;
  content: string;
  language?: string;
  operation: 'create' | 'update' | 'delete';
  description?: string;
}

/**
 * Union type for all message types
 */
export type AIMessage = MessageText | MessageCode | MessageFile;

/**
 * Chat message with streaming support
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  messages: AIMessage[];
  timestamp: number;
  isStreaming?: boolean;
}

/**
 * Request payload for AI generation
 */
export interface AIGenerateRequest {
  prompt: string;
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  includeContext?: {
    files?: string[];
    cursorPosition?: {
      line: number;
      column: number;
    };
  };
}

/**
 * Response payload for AI generation
 */
export interface AIGenerateResponse {
  id: string;
  messages: AIMessage[];
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Stream chunk for real-time updates
 */
export interface AIStreamChunk {
  id: string;
  type: 'start' | 'delta' | 'complete' | 'error';
  message?: Partial<AIMessage>;
  content?: string;
  error?: string;
}
