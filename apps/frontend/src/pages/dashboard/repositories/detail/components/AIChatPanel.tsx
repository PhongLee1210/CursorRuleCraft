import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import { t } from '@lingui/macro';
import {
  CheckIcon,
  CopyIcon,
  FileCodeIcon,
  MagicWandIcon,
  PaperPlaneRightIcon,
  SpinnerGapIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedRule?: {
    title: string;
    content: string;
  };
}

interface AIChatPanelProps {
  repository: Repository;
  selectedFile: string | null;
  onClearFileSelection: () => void;
}

export const AIChatPanel = ({
  repository,
  selectedFile,
  onClearFileSelection,
}: AIChatPanelProps) => {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI assistant for the **${repository.name}** repository. I can help you:\n\n• Understand your codebase structure\n• Generate project rules and documentation\n• Answer questions about your code\n• Suggest improvements and best practices\n\nWhat would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  // Computed Values

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
          title: `${repository.name} Project Rules`,
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

  const handleCopyRule = useCallback((ruleContent: string, ruleId: string) => {
    void navigator.clipboard.writeText(ruleContent);
    setCopiedRuleId(ruleId);
    setTimeout(() => setCopiedRuleId(null), 2000);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  // Render
  return (
    <div className="flex h-full flex-col">
      {/* Context Bar */}
      {selectedFile && (
        <div className="border-border bg-secondary/30 flex min-h-[57px] items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <FileCodeIcon size={16} className="text-primary" />
            <span className="text-sm font-medium">{t`Context:`}</span>
            <code className="text-muted-foreground bg-background rounded px-2 py-1 text-xs">
              {selectedFile}
            </code>
          </div>
          <Button
            variant="ghost"
            onClick={onClearFileSelection}
            size="sm"
            aria-label={t`Clear context`}
          >
            <XIcon size={16} />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-3',
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                )}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                {message.generatedRule && (
                  <div className="border-border bg-background mt-3 rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MagicWandIcon size={16} className="text-primary" />
                        <span className="font-semibold">{message.generatedRule.title}</span>
                      </div>
                      <Button
                        onClick={() => handleCopyRule(message.generatedRule!.content, message.id)}
                        variant="ghost"
                        size="sm"
                      >
                        {copiedRuleId === message.id ? (
                          <>
                            <CheckIcon size={14} className="text-success mr-1" />
                            {t`Copied`}
                          </>
                        ) : (
                          <>
                            <CopyIcon size={14} className="mr-1" />
                            {t`Copy Rule`}
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="text-muted-foreground overflow-x-auto whitespace-pre-wrap text-xs">
                      {message.generatedRule.content}
                    </pre>
                  </div>
                )}
              </div>
            </div>
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

      {/* Input Area */}
      <div className="border-border border-t p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center gap-2">
            <Button
              onClick={handleGenerateRule}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <MagicWandIcon size={16} className="mr-2" />
              {t`Generate Project Rule`}
            </Button>
          </div>

          <div className="bg-secondary flex items-end gap-2 rounded-lg p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t`Ask anything about your repository...`}
              className="placeholder:text-muted-foreground max-h-[200px] min-h-[60px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0"
              aria-label={t`Send message`}
            >
              {isLoading ? (
                <SpinnerGapIcon size={20} className="animate-spin" />
              ) : (
                <PaperPlaneRightIcon size={20} />
              )}
            </Button>
          </div>

          <p className="text-muted-foreground mt-2 text-xs">
            {t`Press Enter to send, Shift+Enter for new line`}
          </p>
        </div>
      </div>
    </div>
  );
};
