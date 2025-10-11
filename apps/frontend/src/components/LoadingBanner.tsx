import { cn } from '@/lib/utils';

// Types
interface LoadingBannerProps {
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
  className?: string;
}

/**
 * Loading Banner Component
 *
 * A banner that displays a loading spinner with an optional message.
 * Can show progress information if provided.
 */
export const LoadingBanner = ({
  message = 'Loading...',
  progress,
  className,
}: LoadingBannerProps) => {
  const displayMessage = progress ? `${message} (${progress.current}/${progress.total})` : message;

  return (
    <div
      className={cn(
        'bg-primary/10 border-primary/20 fixed left-0 right-0 top-0 z-[9999] border-b p-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <svg
          className="text-primary size-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-foreground text-sm font-medium">{displayMessage}</span>
      </div>
    </div>
  );
};
