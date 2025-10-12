import { BadgeInput } from '@/components/BadgeInput';
import { Button } from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import { Input } from '@/components/Input';
import { cn } from '@/lib/utils';
import { t } from '@lingui/macro';
import { CaretDownIcon, FolderIcon } from '@phosphor-icons/react';
import { memo } from 'react';

type ApplyMode = 'always' | 'intelligent' | 'specific' | 'manual';

const APPLY_MODE_OPTIONS = [
  {
    value: 'always' as const,
    label: `Always Apply`,
    description: `Apply to every chat and cmd-k session`,
  },
  {
    value: 'intelligent' as const,
    label: `Apply Intelligently`,
    description: `When Agent decides it's relevant based on description`,
  },
  {
    value: 'specific' as const,
    label: `Apply to Specific Files`,
    description: `When file matches a specified pattern`,
  },
  {
    value: 'manual' as const,
    label: `Apply Manually`,
    description: `When @-mentioned`,
  },
] as const;

interface ProjectRulesFormProps {
  fileName: string;
  content: string;
  applyMode: ApplyMode;
  globPatterns: string[];
  currentPattern: string;
  isCreating: boolean;
  fullPath: string;
  validationErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onFileNameChange: (value: string) => void;
  onFileNameBlur: () => void;
  onContentChange: (value: string) => void;
  onContentBlur: () => void;
  onApplyModeChange: (value: ApplyMode) => void;
  onCurrentPatternChange: (value: string) => void;
  onAddPattern: () => void;
  onRemovePattern: (pattern: string) => void;
}

export const ProjectRulesForm = memo<ProjectRulesFormProps>(
  ({
    fileName,
    content,
    applyMode,
    globPatterns,
    currentPattern,
    isCreating,
    fullPath,
    validationErrors,
    touchedFields,
    onFileNameChange,
    onFileNameBlur,
    onContentChange,
    onContentBlur,
    onApplyModeChange,
    onCurrentPatternChange,
    onAddPattern,
    onRemovePattern,
  }) => {
    return (
      <div className="space-y-6">
        {/* Apply Mode Selection */}
        <div className="space-y-2">
          <label className="text-foreground text-sm font-medium">{t`Apply Mode`}</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-fit w-full justify-between"
                disabled={isCreating}
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">
                    {APPLY_MODE_OPTIONS.find((opt) => opt.value === applyMode)?.label}
                  </span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {APPLY_MODE_OPTIONS.find((opt) => opt.value === applyMode)?.description}
                  </span>
                </span>
                <CaretDownIcon size={16} className="ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
              <DropdownMenuRadioGroup
                value={applyMode}
                onValueChange={(value) => onApplyModeChange(value as ApplyMode)}
              >
                {APPLY_MODE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-muted-foreground text-xs">{option.description}</span>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Glob Pattern Input - Only for "specific" apply mode */}
        {applyMode === 'specific' && (
          <div className="space-y-2">
            <label htmlFor="globPattern" className="text-foreground text-sm font-medium">
              {t`File Patterns`} <span className="text-error">*</span>
            </label>

            <BadgeInput
              id="globPattern"
              value={currentPattern}
              values={globPatterns}
              onChange={onCurrentPatternChange}
              onAdd={onAddPattern}
              onRemove={onRemovePattern}
              placeholder={t`Enter pattern and press Enter...`}
              disabled={isCreating}
              className={cn(
                'mx-px',
                touchedFields.globPatterns && validationErrors.globPatterns && 'border-error'
              )}
              aria-label={t`File pattern input`}
              aria-invalid={touchedFields.globPatterns && !!validationErrors.globPatterns}
              aria-describedby={validationErrors.globPatterns ? 'globPatterns-error' : undefined}
            />

            {touchedFields.globPatterns && validationErrors.globPatterns ? (
              <p id="globPatterns-error" className="text-error text-xs">
                {validationErrors.globPatterns}
              </p>
            ) : (
              <div className="text-muted-foreground text-xs">
                {t`Press Enter to add patterns. Examples: *.tsx, src/**/*.ts, package.json`}
              </div>
            )}
          </div>
        )}

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
            placeholder={t`e.g., react-component-rules`}
            disabled={isCreating}
            className={cn(
              'font-mono',
              touchedFields.fileName &&
                validationErrors.fileName &&
                'border-error focus:ring-error'
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
            placeholder={t`Enter your project rules and guidelines...`}
            disabled={isCreating}
            aria-invalid={touchedFields.content && !!validationErrors.content}
            aria-describedby={validationErrors.content ? 'content-error' : undefined}
          />
          {touchedFields.content && validationErrors.content && (
            <p id="content-error" className="text-error text-xs">
              {validationErrors.content}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ProjectRulesForm.displayName = 'ProjectRulesForm';

