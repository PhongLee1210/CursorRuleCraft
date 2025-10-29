import { useEffect, useRef } from 'react';

import { t } from '@lingui/macro';
import { ChatCircleTextIcon, CheckCircleIcon, FileIcon, SparkleIcon } from '@phosphor-icons/react';

import type { RuleGenerationState } from '@frontend/hooks/useRuleGeneration';
import { cn } from '@frontend/lib/utils';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  placeholder: string;
  className?: string;
}

function StreamingText({ content, isStreaming, placeholder, className }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const container = containerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [content, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent max-h-full overflow-y-auto',
        'scroll-smooth transition-all duration-200',
        className
      )}
    >
      {content ? (
        <div className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
          {content}
          {isStreaming && <span className="bg-primary ml-1 inline-block h-4 w-2 animate-pulse" />}
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 text-sm italic">
          <div className="bg-muted-foreground/50 h-2 w-2 animate-pulse rounded-full" />
          {placeholder}
        </div>
      )}
    </div>
  );
}

interface RuleGenerationPanelProps {
  state: RuleGenerationState;
  className?: string;
}

/**
 * Displays phased rule generation with smooth streaming UX
 * Optimized for full-height aside layout with smooth scrolling
 */
export function RuleGenerationPanel({ state, className }: RuleGenerationPanelProps) {
  const getPhaseIcon = () => {
    switch (state.currentPhase) {
      case 'rule-generation':
        return <FileIcon className="h-5 w-5 text-blue-500" />;
      case 'follow-up-message':
        return <ChatCircleTextIcon className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <SparkleIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  const getPhaseTitle = () => {
    switch (state.currentPhase) {
      case 'rule-generation':
        return t`Generating Cursor Rule`;
      case 'follow-up-message':
        return t`Generating Explanation`;
      case 'completed':
        return t`Rule Generated Successfully`;
      default:
        return t`Ready to Generate`;
    }
  };

  const getPhaseDescription = () => {
    if (state.metadata) {
      const { ruleType, fileName } = state.metadata;
      const typeLabel = ruleType.replace('_', ' ').toLowerCase();
      return t`Creating ${typeLabel}${fileName ? ` "${fileName}"` : ''}`;
    }
    return '';
  };

  // Show panel only when generating or has content
  if (
    !state.isGenerating &&
    state.currentPhase === 'idle' &&
    !state.ruleContent &&
    !state.followUpContent
  ) {
    return (
      <div className={cn('flex h-full items-center justify-center p-6 text-center', className)}>
        <div className="space-y-3">
          <SparkleIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
          <div className="text-muted-foreground text-sm">
            {t`Start generating cursor rules by asking the AI`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Phase indicator - Fixed at top */}
      <div className="border-border/50 flex-shrink-0 border-b p-4">
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300">
          <div className="flex-shrink-0">{getPhaseIcon()}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{getPhaseTitle()}</div>
            {getPhaseDescription() && (
              <div className="text-muted-foreground mt-1 truncate text-xs">
                {getPhaseDescription()}
              </div>
            )}
          </div>
          {state.isGenerating && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                {state.isStreamingRule ? t`Writing...` : t`Generating...`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Flexible height */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Rule Generation Section */}
          {(state.ruleContent || state.isStreamingRule) && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-border/50 flex-shrink-0 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {t`Generated Cursor Rule`}
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <StreamingText
                  content={state.ruleContent}
                  isStreaming={state.isStreamingRule}
                  placeholder={t`Generating rule content...`}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {/* Follow-up Message Section */}
          {(state.followUpContent || state.isStreamingFollowUp) && (
            <div className="border-border/50 flex min-h-0 flex-1 flex-col border-t">
              <div className="border-border/50 flex-shrink-0 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <ChatCircleTextIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                    {t`AI Explanation`}
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <StreamingText
                  content={state.followUpContent}
                  isStreaming={state.isStreamingFollowUp}
                  placeholder={t`Generating explanation...`}
                  className="h-full [&>div]:font-sans [&>div]:leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display - Fixed at bottom */}
      {state.error && (
        <div className="border-border/50 flex-shrink-0 border-t p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/20">
            <div className="mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
              <span className="text-sm font-semibold">{t`Generation Error`}</span>
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">{state.error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
