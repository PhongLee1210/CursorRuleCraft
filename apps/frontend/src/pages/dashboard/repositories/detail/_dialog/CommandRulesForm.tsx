import { memo } from 'react';

import { t } from '@lingui/macro';
import { FolderIcon } from '@phosphor-icons/react';

import { Input } from '@frontend/components/Input';
import { cn } from '@frontend/lib/utils';


interface CommandRulesFormProps {
  fileName: string;
  content: string;
  isCreating: boolean;
  fullPath: string;
  validationErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onFileNameChange: (value: string) => void;
  onFileNameBlur: () => void;
  onContentChange: (value: string) => void;
  onContentBlur: () => void;
}

export const CommandRulesForm = memo<CommandRulesFormProps>(
  ({
    fileName,
    content,
    isCreating,
    fullPath,
    validationErrors,
    touchedFields,
    onFileNameChange,
    onFileNameBlur,
    onContentChange,
    onContentBlur,
  }) => {
    return (
      <div className="space-y-6">
        {/* File Name Input */}
        <div className="space-y-2">
          <label htmlFor="fileName" className="text-foreground text-sm font-medium">
            {t`File Name`} <span className="text-error">*</span>
          </label>
          <Input
            id="fileName"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            onBlur={onFileNameBlur}
            placeholder={t`e.g., generate-test`}
            disabled={isCreating}
            className={cn(
              'font-mono',
              touchedFields.fileName && validationErrors.fileName && 'border-error focus:ring-error'
            )}
            aria-invalid={touchedFields.fileName && !!validationErrors.fileName}
            aria-describedby={validationErrors.fileName ? 'fileName-error' : undefined}
          />
          {touchedFields.fileName && validationErrors.fileName && (
            <p id="fileName-error" className="text-error text-xs">
              {validationErrors.fileName}
            </p>
          )}
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <FolderIcon size={14} />
            <span className="font-mono">{fullPath}</span>
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
            placeholder={t`Enter your command or prompt template...`}
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
            {t`Commands are reusable prompts that can be @-mentioned in Cursor`}
          </div>
        </div>
      </div>
    );
  }
);

CommandRulesForm.displayName = 'CommandRulesForm';
