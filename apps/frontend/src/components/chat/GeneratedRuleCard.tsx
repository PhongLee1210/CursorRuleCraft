import { Button } from "@frontend/components/Button";
import { cn } from "@frontend/lib/utils";
import { t } from '@lingui/macro';
import { CheckIcon, CopyIcon, MagicWandIcon } from '@phosphor-icons/react';
import { memo, useCallback, useState } from 'react';

interface GeneratedRuleCardProps {
  title: string;
  content: string;
  messageId: string;
}

export const GeneratedRuleCard = memo<GeneratedRuleCardProps>(({ title, content }) => {
  // State
  const [copied, setCopied] = useState(false);

  // Event Handlers
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div
      className={cn(
        'border-border bg-background mt-3 rounded-lg border p-4',
        'transition-all duration-200 ease-out'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MagicWandIcon size={16} className="text-primary flex-shrink-0" />
          <span className="font-semibold">{title}</span>
        </div>
        <Button onClick={handleCopy} variant="ghost" size="sm">
          {copied ? (
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
        {content}
      </pre>
    </div>
  );
});

GeneratedRuleCard.displayName = 'GeneratedRuleCard';
