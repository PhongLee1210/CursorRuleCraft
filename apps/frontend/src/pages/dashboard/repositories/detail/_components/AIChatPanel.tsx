import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import type { RuleType } from '@cursorrulecraft/shared-types';
import { MessageBubble } from '@frontend/components/chat';
import { ChatInput, type MentionedFile } from '@frontend/components/ChatInput';
import type { UseRuleGenerationReturn } from '@frontend/hooks/useRuleGeneration';
import { cn } from '@frontend/lib/utils';
import type { Repository } from '@frontend/types/repository';

interface GeneratedRuleDraft {
  type: RuleType;
  fileName: string;
  content: string;
}

interface _Message {
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
  ruleGeneration: UseRuleGenerationReturn;
}

export interface AIChatPanelRef {
  handleFileDrop: (file: { name: string; path: string; type: 'file' | 'directory' }) => void;
  resetSession: () => void;
}

export const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(
  ({ repository: _repository, selectedFile, onClearFileSelection, ruleGeneration }, ref) => {
    // Refs
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // State
    const [mentionedFiles, setMentionedFiles] = useState<MentionedFile[]>([]);
    const [input, setInput] = useState<string>('');
    const [isRuleGenerationMode, setIsRuleGenerationMode] = useState(false);
    const [pendingRuleType, setPendingRuleType] = useState<RuleType | null>(null);

    // Use ai-sdk useChat hook for regular chat
    const chatHelpers = useChat({
      transport: new DefaultChatTransport({
        prepareSendMessagesRequest: ({ id, messages }) => {
          return {
            api: '/api/ai/chat',
            body: {
              id,
              messages,
            },
          };
        },
      }),
    });

    // Destructure chat helpers
    const { messages: chatMessages, sendMessage, status } = chatHelpers;

    // Local state for optimistic message updates
    const [optimisticMessages, setOptimisticMessages] = useState<typeof chatMessages>([]);

    // Merge chat messages with optimistic messages
    const messages = useMemo(() => {
      // Use optimistic messages if they exist, otherwise use chat messages
      return optimisticMessages.length > 0 ? optimisticMessages : chatMessages;
    }, [chatMessages, optimisticMessages]);

    // Computed Values
    const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

    // Effects
    // Focus input when file is selected but don't auto-populate text
    useEffect(() => {
      if (selectedFile) {
        inputRef.current?.focus();
      }
    }, [selectedFile]);

    // Clear optimistic messages when chat messages update (API response received)
    useEffect(() => {
      if (optimisticMessages.length > 0 && chatMessages.length >= optimisticMessages.length) {
        const hasNewMessages =
          chatMessages.length > optimisticMessages.length ||
          chatMessages.some((msg, idx) => {
            const optimistic = optimisticMessages[idx];
            const optimisticText =
              optimistic?.parts?.[0] && 'text' in optimistic.parts[0]
                ? optimistic.parts[0].text
                : '';
            const chatText = (msg as { content?: string }).content || '';
            return optimistic && chatText !== optimisticText;
          });

        if (hasNewMessages) {
          // This is a valid use case for clearing optimistic updates when real data arrives
          // eslint-disable-next-line
          setOptimisticMessages([]);
        }
      }
    }, [chatMessages, optimisticMessages]);

    // Event Handlers
    const handleSend = useCallback(
      async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || status === 'streaming' || ruleGeneration.isGenerating) return;

        if (isRuleGenerationMode && pendingRuleType) {
          // Generate rule with phased streaming
          setIsRuleGenerationMode(false);

          try {
            await ruleGeneration.generateRule({
              messages: [{ role: 'user', content: input }],
              ruleType: pendingRuleType,
              fileName: input
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .slice(0, 50),
            });

            // After rule generation completes, add a follow-up message to chat
            setTimeout(() => {
              sendMessage({
                text: `I've generated a cursor rule based on your request. Here's what I created:\n\n**${ruleGeneration.metadata?.fileName}**\n${ruleGeneration.ruleContent.slice(0, 200)}...`,
              });
            }, 1000);
          } catch (error) {
            console.error('Rule generation failed:', error);
            sendMessage({
              text: `Sorry, I encountered an error while generating the cursor rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }

          setPendingRuleType(null);
        } else {
          // Detect rule generation intent before sending regular chat message
          try {
            const intent = ruleGeneration.detectRuleIntent(input);

            if (intent.hasIntent && intent.confidence > 0.7 && intent.ruleType) {
              // Automatically trigger rule generation
              try {
                await ruleGeneration.generateRule({
                  messages: [{ role: 'user', content: input }],
                  ruleType: intent.ruleType,
                  techStack: intent.techStack,
                  fileName: input
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .slice(0, 50),
                });

                // Add a message explaining what was detected and generated
                setTimeout(() => {
                  sendMessage({
                    text: `I detected your request for ${intent.description.toLowerCase()}. I've automatically generated a cursor rule for you. Check the rules panel on the right to see the result!`,
                  });
                }, 1000);
              } catch (error) {
                console.error('Auto rule generation failed:', error);
                // Fall back to regular chat - show immediately
                setOptimisticMessages((prev) => [
                  ...prev,
                  {
                    id: `optimistic-${Date.now()}`,
                    role: 'user',
                    parts: [{ type: 'text', text: input }],
                  },
                ]);
                setInput('');
                sendMessage({ text: input });
              }
            } else {
              // Regular chat message - show immediately
              setOptimisticMessages((prev) => [
                ...prev,
                {
                  id: `optimistic-${Date.now()}`,
                  role: 'user',
                  parts: [{ type: 'text', text: input }],
                },
              ]);
              setInput('');
              sendMessage({ text: input });
            }
          } catch (error) {
            console.error('Intent detection failed:', error);
            // Fall back to regular chat - show immediately
            setOptimisticMessages((prev) => [
              ...prev,
              {
                id: `optimistic-${Date.now()}`,
                role: 'user',
                parts: [{ type: 'text', text: input }],
              },
            ]);
            setInput('');
            sendMessage({ text: input });
          }
        }

        // Clear input for all cases
        setInput('');
      },
      [
        input,
        sendMessage,
        setOptimisticMessages,
        isRuleGenerationMode,
        pendingRuleType,
        ruleGeneration,
        status,
      ]
    );

    const handleRuleGenerationRequest = useCallback(
      (ruleType: RuleType | null) => {
        if (ruleType === null) {
          // Cancel rule generation mode
          setIsRuleGenerationMode(false);
          setPendingRuleType(null);
          ruleGeneration.reset();
        } else {
          setIsRuleGenerationMode(true);
          setPendingRuleType(ruleType);
          inputRef.current?.focus();
        }
      },
      [ruleGeneration]
    );

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
      // Note: useChat doesn't have a built-in reset, so we'll need to reload the page
      // or implement custom reset logic. For now, we'll just clear mentioned files
      setMentionedFiles([]);
      setInput('');
      setOptimisticMessages([]);
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      handleFileDrop,
      resetSession,
    }));

    // Render
    return (
      <div className="relative flex h-full flex-col">
        {/* Messages Area */}
        {(hasMessages || ruleGeneration.isGenerating) && (
          <div
            className="scrollbar-hide overflow-y-auto p-4"
            style={{ height: 'calc(100vh - 57px - 81px - 170px)' }}
          >
            <div className="mx-auto max-w-3xl space-y-4">
              {/* Regular Chat Messages */}
              {messages.map((message, index) => {
                // Handle user messages
                if (message.role === 'user') {
                  return (
                    <MessageBubble
                      key={message.id || `msg-${index}`}
                      role="user"
                      content={message.parts?.[0]?.type === 'text' ? message.parts[0].text : ''}
                    />
                  );
                }

                // Handle assistant messages
                if (message.role === 'assistant') {
                  // Handle streaming parts for assistant messages
                  if (Array.isArray(message.parts)) {
                    return message.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return (
                          <MessageBubble
                            key={`${message.id}-part-${i}`}
                            role="assistant"
                            content={part.text}
                          />
                        );
                      }
                      return null;
                    });
                  }

                  // Fallback for normal assistant message content
                  return (
                    <MessageBubble key={message.id || `msg-${index}`} role="assistant" content="" />
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Chat Input - Always positioned at bottom */}
        <div
          className={cn(
            'bg-background/95 supports-[backdrop-filter]:bg-background/60 absolute inset-x-0 backdrop-blur',
            'transition-all ease-out',
            hasMessages || ruleGeneration.isGenerating ? 'bottom-0' : 'inset-y-1/3'
          )}
        >
          <div className="mx-auto max-w-3xl p-4">
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              hasMessages={hasMessages}
              selectedFile={selectedFile}
              onClearFileSelection={onClearFileSelection}
              mentionedFiles={mentionedFiles}
              onRemoveMention={handleRemoveMention}
              isRuleGenerationMode={isRuleGenerationMode}
              pendingRuleType={pendingRuleType}
              onRuleGenerationRequest={handleRuleGenerationRequest}
              isGenerating={ruleGeneration.isGenerating}
              isLoading={status === 'streaming' || ruleGeneration.isGenerating}
            />
          </div>
        </div>
      </div>
    );
  }
);

AIChatPanel.displayName = 'AIChatPanel';
