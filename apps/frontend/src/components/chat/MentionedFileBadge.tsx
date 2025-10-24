import { cn } from "@frontend/lib/utils";
import { FileCodeIcon, FolderIcon, XIcon } from '@phosphor-icons/react';
import { memo, useCallback } from 'react';

interface MentionedFileBadgeProps {
  name: string;
  path: string;
  type: 'file' | 'directory';
  onRemove?: (path: string) => void;
}

export const MentionedFileBadge = memo<MentionedFileBadgeProps>(
  ({ name, path, type, onRemove }) => {
    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.(path);
      },
      [path, onRemove]
    );

    return (
      <div
        onClick={handleRemove}
        className={cn(
          'border-border/50 bg-secondary/30 group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1'
        )}
      >
        {type === 'directory' ? (
          <FolderIcon size={14} className="text-primary flex-shrink-0" />
        ) : (
          <FileCodeIcon size={14} className="text-primary flex-shrink-0" />
        )}
        <span className="text-foreground text-xs">{name}</span>
        <XIcon
          size={12}
          weight="bold"
          className="text-foreground/80 group-hover:text-foreground transition-colors"
        />
      </div>
    );
  }
);

MentionedFileBadge.displayName = 'MentionedFileBadge';
