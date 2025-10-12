import { cn } from '@/lib/utils';
import { t } from '@lingui/macro';
import { FolderIcon } from '@phosphor-icons/react';
import { memo } from 'react';

interface UserRulesFormProps {
  content: string;
  isCreating: boolean;
  fullPath: string;
  validationErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onContentChange: (value: string) => void;
  onContentBlur: () => void;
}

export const UserRulesForm = memo<UserRulesFormProps>(
  ({
    content,
    isCreating,
    fullPath,
    validationErrors,
    touchedFields,
    onContentChange,
    onContentBlur,
  }) => {
    return (
      <div className="space-y-6">
        {/* File Path Display */}
        <div className="space-y-2">
          <label className="text-foreground text-sm font-medium">{t`File Path`}</label>
          <div className="bg-secondary/50 border-border text-muted-foreground flex items-center gap-2 rounded-md border px-4 py-3 font-mono text-sm">
            <FolderIcon size={14} />
            <span>{fullPath}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {t`This file will be created at the root of your repository`}
          </div>
        </div>

        {/* Content Input */}
        <div className="space-y-2">
          <label htmlFor="content" className="text-foreground text-sm font-medium">
            {t`Content`} <span className="text-error">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={onContentBlur}
            className={cn(
              'bg-secondary border-border text-foreground focus:ring-primary/50 h-64 w-full resize-none rounded-md border p-4 font-mono text-sm focus:outline-none focus:ring-2',
              touchedFields.content && validationErrors.content && 'border-error focus:ring-error'
            )}
            placeholder={t`Enter your global cursor rules...`}
            disabled={isCreating}
            aria-invalid={touchedFields.content && !!validationErrors.content}
            aria-describedby={validationErrors.content ? 'content-error' : undefined}
          />
          {touchedFields.content && validationErrors.content && (
            <p id="content-error" className="text-error text-xs">
              {validationErrors.content}
            </p>
          )}
          <div className="text-muted-foreground text-xs">
            {t`The .cursorrules file applies globally to all AI interactions in this repository`}
          </div>
        </div>
      </div>
    );
  }
);

UserRulesForm.displayName = 'UserRulesForm';

