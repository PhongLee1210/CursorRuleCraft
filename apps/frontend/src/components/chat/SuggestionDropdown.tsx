import { memo } from 'react';

import { cn } from '@frontend/lib/utils';

interface SuggestionDropdownProps {
  suggestions: string[];
  selectedIndex: number;
  isVisible: boolean;
  onSelect: (suggestion: string) => void;
}

export const SuggestionDropdown = memo<SuggestionDropdownProps>(
  ({ suggestions, selectedIndex, isVisible, onSelect }) => {
    return (
      <div
        className={cn(
          'border-border/60 bg-background/80 absolute left-0 right-0 z-50 origin-top overflow-hidden rounded-b-2xl backdrop-blur-sm',
          'border-x border-b transition-all delay-100 duration-200 ease-out',
          isVisible ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'
        )}
        style={{
          top: '100%',
        }}
      >
        <div className="p-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              className={cn(
                'text-foreground hover:bg-secondary/80 w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                selectedIndex === index && 'bg-secondary/80'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SuggestionDropdown.displayName = 'SuggestionDropdown';
