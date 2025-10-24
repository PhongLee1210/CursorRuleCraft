import { MessageBubble } from "@frontend/components/chat";
import { ChatInput, type MentionedFile } from "@frontend/components/ChatInput";
import { cn } from "@frontend/lib/utils";
import type { RuleType } from "@frontend/types/cursor-rules";
import type { Repository } from "@frontend/types/repository";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

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
}

export interface AIChatPanelRef {
  handleFileDrop: (file: { name: string; path: string; type: 'file' | 'directory' }) => void;
  resetSession: () => void;
}

export const AIChatPanel = forwardRef<AIChatPanelRef, AIChatPanelProps>(
  ({ repository: _repository, selectedFile, onClearFileSelection }, ref) => {
    // Refs
    const inputRef = useRef<HTMLTextAreaElement>(null);
    // State
    const [mentionedFiles, setMentionedFiles] = useState<MentionedFile[]>([]);
    const [input, setInput] = useState<string>('');

    // Use ai-sdk useChat hook for proper streaming
    const {
      messages,
      status: _status,
      sendMessage,
    } = useChat({
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

    // Computed Values
    const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

    // Effects
    // useEffect(() => {
    //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    useEffect(() => {
      if (selectedFile) {
        setInput(`Can you explain the file: ${selectedFile}`);
        inputRef.current?.focus();
      }
    }, [selectedFile]);

    // Event Handlers
    const handleSend = useCallback(
      (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput('');
        // useChat handles streaming automatically
      },
      [input]
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
        {hasMessages && (
          <div className="scrollbar-hide flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4">
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
            hasMessages ? 'bottom-0' : 'inset-y-1/3'
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
            />
          </div>
        </div>
      </div>
    );
  }
);

AIChatPanel.displayName = 'AIChatPanel';
