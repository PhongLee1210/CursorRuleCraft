import { cn } from "@frontend/lib/utils";
import { forwardRef } from 'react';

interface QuickActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

export const QuickActionButton = forwardRef<HTMLButtonElement, QuickActionButtonProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'border-border/50 bg-background/50 hover:bg-background hover:border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }
);

QuickActionButton.displayName = 'QuickActionButton';
