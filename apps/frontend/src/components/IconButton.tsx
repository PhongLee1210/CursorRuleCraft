'use client';

import { cn } from "@frontend/lib/utils";
import * as Tooltip from '@radix-ui/react-tooltip';
import { useMemo, type ReactNode } from 'react';

export const IconButton = ({
  label,
  icon,
  onClick,
  className = '',
  hoverable = true,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  hoverable?: boolean;
}) => {
  const buttonClasses = useMemo(() => {
    return cn(
      'group relative inline-flex items-center justify-center gap-1.5 rounded-lg',
      'size-9 w-auto px-3',
      hoverable ? 'md:h-8 md:w-8 md:px-0 md:hover:w-auto md:hover:px-3' : 'md:h-8 md:w-8 md:px-0', // static width for tooltip mode
      'bg-secondary/30 hover:bg-secondary/50',
      'backdrop-blur-sm',
      'text-[11px] font-medium',
      'transition-all duration-200',
      'border-border/50 border',
      className
    );
  }, [className, hoverable]);

  const content = (
    <button type="button" onClick={onClick} className={buttonClasses}>
      <span
        className={cn(
          'shrink-0 transition-transform duration-300 ease-in',
          hoverable && 'group-hover:mr-0 md:-mr-1.5'
        )}
      >
        {icon}
      </span>
      {hoverable && (
        <span
          className={cn(
            'text-foreground',
            'md:w-0 md:-translate-x-2 md:overflow-hidden md:opacity-0',
            'md:group-hover:w-auto md:group-hover:translate-x-0 md:group-hover:opacity-100',
            'text-nowrap md:transition-all md:duration-200'
          )}
        >
          {label}
        </span>
      )}
    </button>
  );

  // When hoverable=false → wrap with Tooltip
  if (!hoverable) {
    return (
      <Tooltip.Provider delayDuration={100}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              className={cn('bg-secondary text-foreground rounded-md px-2 py-1 text-xs shadow-md')}
            >
              {label}
              <Tooltip.Arrow className="fill-secondary" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return content;
};

IconButton.displayName = 'IconButton';
