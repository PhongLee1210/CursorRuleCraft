import { GeneratedRuleCard, MessageBubble } from '@/components/chat';
import { ChatInput, type MentionedFile } from '@/components/ChatInput';
import type { RuleType } from '@/types/cursor-rules';
import type { Repository } from '@/types/repository';
import { t } from '@lingui/macro';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

interface GeneratedRuleDraft {
  type: RuleType;
  fileName: string;
  content: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedRule?: GeneratedRuleDraft;
}

interface AIChatPanelProps {
  repository: Repository;
  selectedFile?: string | null;
  onClearFileSelection?: () => void;
}

export interface AIChatPanelRef {
  handleFileDrop: (file: { name: string; path: string; type: 'file' | 'directory' }) => void;
  resetSession: () => void;
}

export const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(
  ({ repository, selectedFile, onClearFileSelection }, ref) => {
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mentionedFiles, setMentionedFiles] = useState<MentionedFile[]>([]);

    // Computed Values
    const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

    // Effects
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
      if (selectedFile) {
        setInput(`Can you explain the file: ${selectedFile}`);
        inputRef.current?.focus();
      }
    }, [selectedFile]);

    // Event Handlers
    const handleSend = useCallback(async () => {
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        // TODO: Integrate with actual AI service
        // Simulated response for now
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I understand you're asking about "${input.trim()}". Based on the repository structure and code analysis, here's what I found...\n\nThis is a simulated response. In production, this would connect to an AI service that has access to your repository's codebase.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsLoading(false);
      }
    }, [input, isLoading]);

    const handleGenerateRule = useCallback(async () => {
      setIsLoading(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: t`Generate a comprehensive project rule based on the repository structure and code patterns.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // TODO: Integrate with actual AI service
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: t`I've analyzed your repository and generated a comprehensive project rule. You can copy it and add it to your Cursor project rules.`,
          timestamp: new Date(),
          generatedRule: {
            type: 'PROJECT_RULE',
            fileName: `${repository.name.toLowerCase().replace(/\s+/g, '-')}-project-rules`,
            content: `# ${repository.name} Project Rules

## Overview
This project uses ${repository.language || 'multiple languages'} and follows specific patterns and conventions.

## Code Style
- Follow consistent naming conventions
- Use TypeScript for type safety
- Implement proper error handling

## Architecture
- Maintain modular structure
- Separate concerns appropriately
- Use dependency injection where applicable

## Testing
- Write unit tests for all business logic
- Maintain test coverage above 80%
- Use integration tests for critical paths

## Documentation
- Document all public APIs
- Keep README up to date
- Add inline comments for complex logic`,
          },
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Failed to generate rule:', error);
      } finally {
        setIsLoading(false);
      }
    }, [repository]);

    const handleRemoveMention = useCallback((path: string) => {
      setMentionedFiles((prev) => prev.filter((f) => f.path !== path));
    }, []);

    const handleFileDrop = useCallback(
      (file: { name: string; path: string; type: 'file' | 'directory' }) => {
        setMentionedFiles((prev) => {
          // Check if file is already mentioned
          const isAlreadyMentioned = prev.some((f) => f.path === file.path);
          if (isAlreadyMentioned) {
            return prev;
          }
          return [...prev, file];
        });
      },
      []
    );

    const resetSession = useCallback(() => {
      setMessages([]);
      setInput('');
      setMentionedFiles([]);
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      handleFileDrop,
      resetSession,
    }));

    // Render
    return (
      <div className="flex h-full flex-col">
        {hasMessages ? (
          <>
            {/* Messages */}
            <div className="scrollbar-subtle flex-1 overflow-y-auto p-4">
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} role={message.role} content={message.content}>
                    {message.generatedRule && (
                      <GeneratedRuleCard
                        title={message.generatedRule.fileName}
                        content={message.generatedRule.content}
                        messageId={message.id}
                      />
                    )}
                  </MessageBubble>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg px-4 py-3">
                      <SpinnerGapIcon size={20} className="text-primary animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="border-border animate-in slide-in-from-bottom-4 border-t p-6 duration-500">
              <div className="mx-auto max-w-3xl">
                <ChatInput
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  onGenerateRule={handleGenerateRule}
                  isLoading={isLoading}
                  selectedFile={selectedFile}
                  onClearFileSelection={onClearFileSelection}
                  mentionedFiles={mentionedFiles}
                  onRemoveMention={handleRemoveMention}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty State - Centered Input */
          <div className="flex h-full items-center justify-center p-6">
            <div className="w-full max-w-3xl">
              <ChatInput
                ref={inputRef}
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onGenerateRule={handleGenerateRule}
                isLoading={isLoading}
                selectedFile={selectedFile}
                onClearFileSelection={onClearFileSelection}
                mentionedFiles={mentionedFiles}
                onRemoveMention={handleRemoveMention}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

AIChatPanel.displayName = 'AIChatPanel';
