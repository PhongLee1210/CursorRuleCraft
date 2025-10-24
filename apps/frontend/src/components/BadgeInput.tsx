import { cn } from "@frontend/lib/utils";
import { XIcon } from '@phosphor-icons/react';
import { useCallback, useRef } from 'react';
import { Badge } from './Badge';

interface BadgeInputProps {
  id?: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  badgeClassName?: string;
  'aria-label'?: string;
}

export const BadgeInput = ({
  id,
  value,
  values,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  disabled = false,
  className,
  badgeClassName,
  'aria-label': ariaLabel,
}: BadgeInputProps) => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Event Handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAdd();
      } else if (e.key === 'Backspace' && value === '' && values.length > 0) {
        // Remove last value when backspace is pressed on empty input
        onRemove(values[values.length - 1]);
      }
    },
    [value, values, onAdd, onRemove]
  );

  const handleWrapperClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Render
  return (
    <div
      onClick={handleWrapperClick}
      className={cn(
        'border-border focus-within:ring-primary flex min-h-[42px] flex-col gap-2 rounded-md border p-2 transition-shadow focus-within:ring-1',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {/* Display existing values as badges */}
      <div className="flex flex-wrap gap-1">
        {values.map((val, index) => (
          <Badge
            key={`${val}-${index}`}
            variant="secondary"
            className={cn(
              'bg-primary/10 text-primary border-primary/20 flex items-center gap-1 border px-2 py-1 font-mono text-xs',
              badgeClassName
            )}
          >
            {val}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(val);
              }}
              disabled={disabled}
              className="hover:bg-primary/20 ml-1 rounded-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${val}`}
            >
              <XIcon size={12} />
            </button>
          </Badge>
        ))}
      </div>

      {/* Input for new value */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? placeholder : ''}
        disabled={disabled}
        aria-label={ariaLabel}
        className="text-foreground placeholder:text-muted-foreground min-w-[200px] flex-1 border-none bg-transparent font-mono text-sm outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
};
