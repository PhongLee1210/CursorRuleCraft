import { BadgeInput } from '@/components/BadgeInput';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import { useCursorRules } from '@/hooks/useCursorRules';
import type { ApplyMode } from '@/types/cursor-rules';
import { t } from '@lingui/macro';
import { CaretDownIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface EditRuleDialogProps {
  open: boolean;
  onClose: () => void;
  ruleId: string;
  repositoryId: string;
  onSave: (
    ruleId: string,
    content: string,
    applyMode?: ApplyMode,
    globPattern?: string
  ) => Promise<void>;
}

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

export const EditRuleDialog = ({
  open,
  onClose,
  ruleId,
  repositoryId,
  onSave,
}: EditRuleDialogProps) => {
  // State
  const [content, setContent] = useState('');
  const [applyMode, setApplyMode] = useState<ApplyMode>('intelligent');
  const [globPatterns, setGlobPatterns] = useState<string[]>([]);
  const [currentPattern, setCurrentPattern] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ruleType, setRuleType] = useState<'PROJECT_RULE' | 'USER_RULE' | 'COMMAND'>(
    'PROJECT_RULE'
  );

  // External Hooks
  const cursorRules = useCursorRules();

  // Computed Values
  const showApplyModeSettings = useMemo(() => {
    return ruleType === 'PROJECT_RULE';
  }, [ruleType]);

  // Effects
  useEffect(() => {
    if (open && ruleId) {
      const fetchRule = async () => {
        setIsLoading(true);
        const result = await cursorRules.getRuleById(ruleId, repositoryId);
        if (result.data) {
          setContent(result.data.content);
          setRuleType(result.data.type);
          setApplyMode(result.data.apply_mode || 'intelligent');

          // Parse glob patterns from comma-separated string
          const patterns = result.data.glob_pattern
            ? result.data.glob_pattern
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean)
            : [];
          setGlobPatterns(patterns);
        }
        setIsLoading(false);
      };
      void fetchRule();
    }
  }, [open, ruleId, cursorRules, repositoryId]);

  // Event Handlers
  const handleAddPattern = useCallback(() => {
    const trimmedPattern = currentPattern.trim();
    if (trimmedPattern && !globPatterns.includes(trimmedPattern)) {
      setGlobPatterns([...globPatterns, trimmedPattern]);
      setCurrentPattern('');
    }
  }, [currentPattern, globPatterns]);

  const handleRemovePattern = useCallback(
    (pattern: string) => {
      setGlobPatterns(globPatterns.filter((p) => p !== pattern));
    },
    [globPatterns]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const globPattern =
        showApplyModeSettings && applyMode === 'specific' && globPatterns.length > 0
          ? globPatterns.join(',')
          : undefined;

      await onSave(ruleId, content, showApplyModeSettings ? applyMode : undefined, globPattern);
      onClose();
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setIsSaving(false);
    }
  }, [ruleId, content, applyMode, globPatterns, showApplyModeSettings, onSave, onClose]);

  // Render
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>{t`Edit Cursor Rule`}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <SpinnerGapIcon size={32} className="text-primary animate-spin" />
          </div>
        ) : (
          <div className="scrollbar-macos flex-1 space-y-6 overflow-y-auto py-4">
            {/* Apply Mode Selection - Only for PROJECT_RULE */}
            {showApplyModeSettings && (
              <div className="space-y-2">
                <label className="text-foreground text-sm font-medium">{t`Apply Mode`}</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-fit w-full justify-between"
                      disabled={isSaving}
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
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width]"
                    align="start"
                  >
                    <DropdownMenuRadioGroup
                      value={applyMode}
                      onValueChange={(value) => setApplyMode(value as ApplyMode)}
                    >
                      {APPLY_MODE_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          className="cursor-pointer py-3"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {option.description}
                            </span>
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Glob Pattern Input - Only for PROJECT_RULE with "specific" apply mode */}
            {showApplyModeSettings && applyMode === 'specific' && (
              <div className="space-y-2">
                <label htmlFor="globPattern" className="text-foreground text-sm font-medium">
                  {t`File Patterns`}
                </label>

                <BadgeInput
                  id="globPattern"
                  value={currentPattern}
                  values={globPatterns}
                  onChange={setCurrentPattern}
                  onAdd={handleAddPattern}
                  onRemove={handleRemovePattern}
                  placeholder={t`Enter pattern and press Enter...`}
                  disabled={isSaving}
                  className="mx-px"
                  aria-label={t`File pattern input`}
                />

                <div className="text-muted-foreground text-xs">
                  {t`Press Enter to add patterns. Examples: *.tsx, src/**/*.ts, package.json`}
                </div>
              </div>
            )}

            {/* Content Input */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-foreground text-sm font-medium">
                {t`Content`}
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-secondary border-border text-foreground focus:ring-primary/50 h-96 w-full resize-none rounded-md border p-4 font-mono text-sm focus:outline-none focus:ring-2"
                placeholder={t`Enter rule content...`}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSaving}>
            {t`Cancel`}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? <SpinnerGapIcon size={16} className="animate-spin" /> : t`Save`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
