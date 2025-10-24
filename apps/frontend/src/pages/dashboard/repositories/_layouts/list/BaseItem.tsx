import { cn } from "@frontend/lib/utils";
import type { ReactNode } from 'react';

type Props = {
  start?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  end?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const BaseListItem = ({ start, title, description, end, className, onClick }: Props) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border bg-secondary/20 hover:bg-secondary/40 flex w-full items-center gap-x-4 rounded-lg border p-4 text-left transition-colors',
        className
      )}
    >
      {start && <div className="flex items-center justify-center">{start}</div>}

      <div className="flex-1 space-y-0.5 overflow-hidden">
        {title && (
          <div className="flex items-center font-medium leading-relaxed tracking-tight">
            {title}
          </div>
        )}
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed opacity-75">{description}</p>
        )}
      </div>

      {end && (
        <div className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          {end}
        </div>
      )}
    </button>
  );
};
