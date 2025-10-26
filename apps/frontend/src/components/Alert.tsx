import { useCallback, type ReactNode } from 'react';

import { cn } from '@frontend/lib/utils';

// Constants
const VARIANT_STYLES = {
  error: 'bg-error border-error-accent/20 text-error-foreground',
  info: 'bg-primary border-primary/20 text-foreground',
  warning: 'bg-warning border-warning-accent/20 text-warning-foreground',
  success: 'bg-success border-success-accent/20 text-success-foreground',
} as const;

// Types
interface AlertProps {
  variant?: keyof typeof VARIANT_STYLES;
  title?: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  details?: ReactNode;
  className?: string;
}

export const Alert = ({
  variant = 'info',
  title,
  message,
  icon,
  action,
  details,
  className,
}: AlertProps) => {
  const handleActionClick = useCallback(() => {
    action?.onClick();
  }, [action]);

  return (
    <div
      className={cn(
        'fixed left-0 right-0 top-0 z-[9999] border-b p-4 opacity-100',
        VARIANT_STYLES[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}

          <div className="flex-1">
            {title && <h3 className="m-0 font-semibold">{title}</h3>}
            <p className="mb-0 mt-1 text-sm opacity-90">{message}</p>
            {details && <div className="mb-0 mt-1 text-xs opacity-80">{details}</div>}
          </div>

          {action && (
            <button
              onClick={handleActionClick}
              className={cn(
                'cursor-pointer rounded-md border-none px-4 py-2 font-medium transition-colors',
                variant === 'error' && 'bg-error text-error-foreground hover:bg-error-accent',
                variant === 'info' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                variant === 'warning' &&
                  'bg-warning text-warning-foreground hover:bg-warning-accent',
                variant === 'success' &&
                  'bg-success text-success-foreground hover:bg-success-accent'
              )}
              aria-label={action.label}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
