import { MentionedFileBadge, QuickActionButton, SuggestionDropdown } from '@/components/chat';
import { RepoBanner } from '@/components/RepoBanner';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { t } from '@lingui/macro';
import {
  CodeIcon,
  CommandIcon,
  MagicWandIcon,
  PaperPlaneRightIcon,
  SpinnerGapIcon,
  TerminalIcon,
  XIcon,
} from '@phosphor-icons/react';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Constants
const SUGGESTED_PROMPTS = [
  `Generate cursor rules for React components`,
  `Generate cursor rules for TypeScript best practices`,
  `Generate cursor rules for API integration`,
  `Generate cursor rules for state management`,
  `Generate Tailwind CSS utility classes documentation`,
  `Generate testing guidelines and patterns`,
];

const MAX_TEXTAREA_HEIGHT = 200;
const SUGGESTION_LIMIT = 6;
const BLUR_DELAY = 200;

// Types
export interface MentionedFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onGenerateRule?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  selectedFile?: string | null;
  onClearFileSelection?: () => void;
  mentionedFiles?: MentionedFile[];
  onRemoveMention?: (path: string) => void;
  className?: string;
}

const ChatInputComponent = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      value,
      onChange,
      onSend,
      onGenerateRule,
      placeholder = `Generate cursor rules...`,
      disabled = false,
      isLoading = false,
      selectedFile,
      onClearFileSelection,
      mentionedFiles = [],
      onRemoveMention,
      className,
    },
    ref
  ) => {
    // Refs
    const dropdownRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Setup droppable
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: 'chat-input-droppable',
    });

    // State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isFocused, setIsFocused] = useState(false);
    const [_isFileHovered, _setIsFileHovered] = useState(false);

    // Computed Values
    const filteredSuggestions = useMemo(
      () =>
        SUGGESTED_PROMPTS.filter((prompt) =>
          prompt.toLowerCase().includes(value.toLowerCase())
        ).slice(0, SUGGESTION_LIMIT),
      [value]
    );

    const shouldShowSuggestions = useMemo(
      () => showSuggestions && !value && filteredSuggestions.length > 0,
      [showSuggestions, value, filteredSuggestions.length]
    );

    const shouldShowQuickActions = useMemo(() => !isFocused && !value, [isFocused, value]);

    // Effects
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-resize textarea based on content
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
      textarea.style.height = `${newHeight}px`;
    }, [value]);

    // Event Handlers
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    }, []);

    const handleBlur = useCallback(() => {
      setTimeout(() => {
        setIsFocused(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }, BLUR_DELAY);
    }, []);

    const handleSelectSuggestion = useCallback(
      (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      },
      [onChange]
    );

    const handleQuickActionClick = useCallback(
      (prompt: string) => {
        onChange(prompt);
      },
      [onChange]
    );

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (shouldShowSuggestions) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(filteredSuggestions[selectedIndex]);
            return;
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
            setSelectedIndex(-1);
            return;
          }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      },
      [onSend, shouldShowSuggestions, selectedIndex, filteredSuggestions, handleSelectSuggestion]
    );

    const handleTextareaChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    const handleWrapperClick = useCallback(() => {
      textareaRef.current?.focus();
    }, []);

    // Render
    return (
      <div ref={setDroppableRef} className={cn('w-full', className)}>
        {/* Context Bar - Fixed at top when file is selected */}
        {selectedFile && (
          <div
            className="border-border/50 bg-secondary/20 hover:border-destructive/50 hover:bg-destructive/10 group mb-3 flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-all"
            onClick={onClearFileSelection}
          >
            <div className="flex items-center gap-2">
              <XIcon size={14} className={cn('text-destructive')} />
              <span className="text-muted-foreground group-hover:text-destructive/80 text-xs transition-colors">
                {t`Context:`}
              </span>
              <code className="text-foreground group-hover:text-destructive bg-background/50 rounded px-1.5 py-0.5 text-xs transition-colors">
                {selectedFile}
              </code>
            </div>
            <span className="text-muted-foreground group-hover:text-destructive text-xs transition-colors">
              {t`Click to remove`}
            </span>
          </div>
        )}

        {/* Main Input Container */}
        <div className="relative w-full space-y-3" ref={dropdownRef}>
          {/* Combined Input and Suggestions Container with Repo Banner */}
          <div className="relative">
            <RepoBanner className="absolute inset-x-2 bottom-full z-0 translate-y-1 pb-2" />
            <div className="relative">
              {/* Input Box */}
              <div
                onClick={handleWrapperClick}
                className={cn(
                  'border-border/60 bg-background relative z-10 flex w-full flex-col shadow-md',
                  'transition-all duration-200 ease-out',
                  shouldShowSuggestions ? 'rounded-t-2xl border' : 'rounded-2xl border',
                  'cursor-text',
                  isOver &&
                    'before:border-primary before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed'
                )}
              >
                {/* Mentioned Files */}
                {mentionedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pt-3">
                    {mentionedFiles.map((file) => (
                      <MentionedFileBadge
                        key={file.path}
                        name={file.name}
                        path={file.path}
                        type={file.type}
                        onRemove={onRemoveMention}
                      />
                    ))}
                  </div>
                )}

                {/* Textarea */}
                <div
                  className={cn(
                    'relative min-h-[44px] px-4 pb-2',
                    mentionedFiles.length > 0 ? 'pt-2' : 'pt-3'
                  )}
                >
                  <textarea
                    ref={mergeRefs(ref, textareaRef)}
                    value={value}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyPress}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled || isLoading}
                    rows={1}
                    className={cn(
                      'placeholder:text-muted-foreground/60 selection:bg-primary/20 text-foreground relative w-full resize-none border-none bg-transparent text-sm font-normal leading-5 outline-none',
                      'overflow-hidden !p-0 transition-all duration-200'
                    )}
                  />
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-end px-3 pb-3">
                  {/* Send Button */}
                  <button
                    onClick={onSend}
                    disabled={!value.trim() || isLoading}
                    className={cn(
                      'bg-primary hover:bg-primary/90 text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                      'disabled:cursor-not-allowed disabled:opacity-40'
                    )}
                    aria-label={t`Send message`}
                  >
                    {isLoading ? (
                      <SpinnerGapIcon size={16} className="animate-spin" />
                    ) : (
                      <PaperPlaneRightIcon size={16} weight="fill" />
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions Dropdown */}
              <SuggestionDropdown
                suggestions={filteredSuggestions}
                selectedIndex={selectedIndex}
                isVisible={shouldShowSuggestions}
                onSelect={handleSelectSuggestion}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={cn(
              'flex flex-wrap items-center justify-center gap-2 transition-all duration-150',
              shouldShowQuickActions
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-2 opacity-0'
            )}
          >
            <QuickActionButton
              icon={<CodeIcon size={14} />}
              label={t`Project Rules`}
              onClick={() => handleQuickActionClick(t`Generate cursor rules for React components`)}
              disabled={isLoading}
            />

            <QuickActionButton
              icon={<TerminalIcon size={14} />}
              label={t`Commands`}
              onClick={() =>
                handleQuickActionClick(t`Generate cursor command shortcuts and CLI usage`)
              }
              disabled={isLoading}
            />

            <QuickActionButton
              icon={<CommandIcon size={14} />}
              label={t`Code Rules`}
              onClick={() =>
                handleQuickActionClick(t`Generate Tailwind CSS utility classes documentation`)
              }
              disabled={isLoading}
            />

            {onGenerateRule && (
              <QuickActionButton
                icon={<MagicWandIcon size={14} />}
                label={t`User Rules`}
                onClick={onGenerateRule}
                disabled={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatInputComponent.displayName = 'ChatInput';

export const ChatInput = ChatInputComponent;
