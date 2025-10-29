import { memo } from 'react';

import { Response } from '@frontend/components/ai-elements/response';
import { cn } from '@frontend/lib/utils';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  children?: React.ReactNode;
}

export const MessageBubble = memo<MessageBubbleProps>(({ role, content, children }) => {
  return (
    <div className={cn('flex gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 transition-all duration-200 ease-out',
          role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {role === 'assistant' ? (
          <Response className="prose prose-sm max-w-none text-sm">{content}</Response>
        ) : (
          <div className="whitespace-pre-wrap text-sm">{content}</div>
        )}
        {children}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
