import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export const IconButton = ({
  label,
  icon,
  onClick,
  className = '',
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex items-center justify-center gap-1.5 rounded-lg',
        // Mobile: show label always
        'size-9 w-auto px-3',
        // Desktop: icon only by default, expand on hover
        'md:h-8 md:w-8 md:px-0 md:hover:w-auto md:hover:px-3',
        'bg-secondary/30 hover:bg-secondary/50',
        'backdrop-blur-sm',
        'text-[11px] font-medium',
        'transition-all duration-200',
        'border-border/50 border',
        className
      )}
    >
      <span className="shrink-0 transition-transform duration-300 ease-in group-hover:mr-0 md:-mr-1.5">
        {icon}
      </span>
      <span
        className={cn(
          // Mobile: always visible
          'text-foreground',
          // Desktop: hidden by default, show on hover
          'md:w-0 md:-translate-x-2 md:overflow-hidden md:opacity-0',
          'md:group-hover:w-auto md:group-hover:translate-x-0 md:group-hover:opacity-100',
          'text-nowrap md:transition-all md:duration-200'
        )}
      >
        {label}
      </span>
    </button>
  );
};
