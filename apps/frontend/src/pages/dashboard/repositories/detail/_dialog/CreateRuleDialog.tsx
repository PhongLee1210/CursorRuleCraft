import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Tabs';
import {
  validateContent,
  validateCreateRuleForm,
  validateFileName,
  validateGlobPatterns,
} from '@/lib/validations/cursor-rules';
import { CommandRulesForm } from '@/pages/dashboard/repositories/detail/_dialog/CommandRulesForm';
import { ProjectRulesForm } from '@/pages/dashboard/repositories/detail/_dialog/ProjectRulesForm';
import { UserRulesForm } from '@/pages/dashboard/repositories/detail/_dialog/UserRulesForm';
import { t } from '@lingui/macro';
import { FileCodeIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CreateRuleDialogProps {
  open: boolean;
  onClose: () => void;
  repositoryId: string;
  onCreate: (
    fileName: string,
    folder: 'rules' | 'command' | 'user',
    content: string,
    applyMode?: 'always' | 'intelligent' | 'specific' | 'manual',
    globPattern?: string
  ) => Promise<void>;
  initialFolder?: 'rules' | 'command' | 'user';
  lockFolder?: boolean;
  hasUserRule?: boolean;
}

type ApplyMode = 'always' | 'intelligent' | 'specific' | 'manual';

const FOLDER_OPTIONS = [
  {
    value: 'rules' as const,
    label: `Rules`,
    description: `Project-specific rules for AI assistance`,
    icon: <FileCodeIcon size={20} className="text-primary" />,
    example: 'my-rule.rules.mdc',
  },
  {
    value: 'command' as const,
    label: `Commands`,
    description: `Reusable commands and prompts`,
    icon: <FileCodeIcon size={20} className="text-accent" />,
    example: 'generate-component.md',
  },
  {
    value: 'user' as const,
    label: `User Rule`,
    description: `Global .cursorrules file (one per repository)`,
    icon: <FileCodeIcon size={20} className="text-success" />,
    example: '.cursorrules',
  },
] as const;

export const CreateRuleDialog = ({
  open,
  onClose,
  repositoryId,
  onCreate,
  initialFolder,
  lockFolder = false,
  hasUserRule = false,
}: CreateRuleDialogProps) => {
  // State
  const [selectedFolder, setSelectedFolder] = useState<'rules' | 'command' | 'user'>(
    initialFolder || 'rules'
  );
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [applyMode, setApplyMode] = useState<ApplyMode>('intelligent');
  const [globPatterns, setGlobPatterns] = useState<string[]>([]);
  const [currentPattern, setCurrentPattern] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Effects
  useEffect(() => {
    // Update selected folder when dialog opens with an initial folder
    if (open && initialFolder) {
      setSelectedFolder(initialFolder);
    }
  }, [open, initialFolder]);

  // Computed Values
  const fullPath = useMemo(() => {
    // Special case for .cursorrules
    if (selectedFolder === 'user') {
      return `.cursorrules`;
    }

    const normalizedFileName = fileName.trim().toLowerCase().replace(/\s+/g, '-');
    const extension = selectedFolder === 'rules' ? '.rules.mdc' : '.md';
    const displayFileName = normalizedFileName
      ? normalizedFileName.endsWith(extension)
        ? normalizedFileName
        : `${normalizedFileName}${extension}`
      : `new-file${extension}`;
    return `.cursor/${selectedFolder}/${displayFileName}`;
  }, [selectedFolder, fileName]);

  const isValid = useMemo(() => {
    // For user rules, only content is required
    if (selectedFolder === 'user') {
      return content.trim().length > 0;
    }

    const validation = validateCreateRuleForm({
      fileName,
      content,
      selectedFolder,
      applyMode: selectedFolder === 'rules' ? applyMode : undefined,
      globPatterns:
        selectedFolder === 'rules' && applyMode === 'specific' ? globPatterns : undefined,
    });
    return validation.isValid;
  }, [fileName, content, selectedFolder, applyMode, globPatterns]);

  // Event Handlers
  const handleFileNameBlur = useCallback(() => {
    setTouchedFields((prev) => ({ ...prev, fileName: true }));
    const error = validateFileName(fileName);
    setValidationErrors((prev) => ({
      ...prev,
      fileName: error || '',
    }));
  }, [fileName]);

  const handleContentBlur = useCallback(() => {
    setTouchedFields((prev) => ({ ...prev, content: true }));
    const error = validateContent(content);
    setValidationErrors((prev) => ({
      ...prev,
      content: error || '',
    }));
  }, [content]);

  const handleFileNameChange = useCallback(
    (value: string) => {
      setFileName(value);
      // Clear error when user starts typing
      if (touchedFields.fileName) {
        const error = validateFileName(value);
        setValidationErrors((prev) => ({
          ...prev,
          fileName: error || '',
        }));
      }
    },
    [touchedFields.fileName]
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      // Clear error when user starts typing
      if (touchedFields.content) {
        const error = validateContent(value);
        setValidationErrors((prev) => ({
          ...prev,
          content: error || '',
        }));
      }
    },
    [touchedFields.content]
  );

  const handleApplyModeChange = useCallback(
    (value: ApplyMode) => {
      setApplyMode(value);
      // Validate glob patterns when apply mode changes to 'specific'
      if (value === 'specific') {
        const error = validateGlobPatterns(globPatterns, value);
        setValidationErrors((prev) => ({
          ...prev,
          globPatterns: error || '',
        }));
      } else {
        // Clear glob patterns error when not in 'specific' mode
        setValidationErrors((prev) => {
          const { globPatterns, ...rest } = prev;
          return rest;
        });
      }
    },
    [globPatterns]
  );

  const handleAddPattern = useCallback(() => {
    const trimmedPattern = currentPattern.trim();
    if (trimmedPattern && !globPatterns.includes(trimmedPattern)) {
      const newPatterns = [...globPatterns, trimmedPattern];
      setGlobPatterns(newPatterns);
      setCurrentPattern('');

      // Validate patterns after adding
      if (applyMode === 'specific') {
        const error = validateGlobPatterns(newPatterns, applyMode);
        setValidationErrors((prev) => ({
          ...prev,
          globPatterns: error || '',
        }));
      }
    }
  }, [currentPattern, globPatterns, applyMode]);

  const handleRemovePattern = useCallback(
    (pattern: string) => {
      const newPatterns = globPatterns.filter((p) => p !== pattern);
      setGlobPatterns(newPatterns);

      // Validate patterns after removing
      if (applyMode === 'specific') {
        const error = validateGlobPatterns(newPatterns, applyMode);
        setValidationErrors((prev) => ({
          ...prev,
          globPatterns: error || '',
        }));
      }
    },
    [globPatterns, applyMode]
  );

  const handleCreate = useCallback(async () => {
    // For user rules, simple validation
    if (selectedFolder === 'user') {
      if (content.trim().length === 0) {
        setValidationErrors({ content: 'Content is required' });
        setTouchedFields({ content: true });
        return;
      }
    } else {
      // Validate all fields for other types
      const validation = validateCreateRuleForm({
        fileName,
        content,
        selectedFolder,
        applyMode: selectedFolder === 'rules' ? applyMode : undefined,
        globPatterns:
          selectedFolder === 'rules' && applyMode === 'specific' ? globPatterns : undefined,
      });

      // If validation fails, show all errors and mark all fields as touched
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setTouchedFields({
          fileName: true,
          content: true,
          globPatterns: true,
        });
        return;
      }
    }

    setIsCreating(true);
    setError(null);

    try {
      let fileNameWithoutExtension: string;

      if (selectedFolder === 'user') {
        // For user rules, use empty string (backend will use .cursorrules)
        fileNameWithoutExtension = '';
      } else {
        // Normalize filename and strip extension (backend will add it)
        const normalizedFileName = fileName.trim().toLowerCase().replace(/\s+/g, '-');
        const extension = selectedFolder === 'rules' ? '.rules.mdc' : '.md';

        // Remove extension if user included it
        fileNameWithoutExtension = normalizedFileName.endsWith(extension)
          ? normalizedFileName.slice(0, -extension.length)
          : normalizedFileName;
      }

      await onCreate(
        fileNameWithoutExtension,
        selectedFolder,
        content,
        selectedFolder === 'rules' ? applyMode : undefined,
        selectedFolder === 'rules' && applyMode === 'specific' ? globPatterns.join(',') : undefined
      );

      // Reset form and close
      setFileName('');
      setContent('');
      setSelectedFolder('rules');
      setApplyMode('intelligent');
      setGlobPatterns([]);
      setCurrentPattern('');
      setValidationErrors({});
      setTouchedFields({});
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rule';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }, [fileName, content, selectedFolder, applyMode, globPatterns, onCreate, onClose]);

  const handleClose = useCallback(() => {
    if (!isCreating) {
      setFileName('');
      setContent('');
      setSelectedFolder('rules');
      setApplyMode('intelligent');
      setGlobPatterns([]);
      setCurrentPattern('');
      setError(null);
      setValidationErrors({});
      setTouchedFields({});
      onClose();
    }
  }, [isCreating, onClose]);

  // Render
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>{t`Create New Cursor Rule`}</DialogTitle>
          <DialogDescription>
            {t`Create a new rule file in your .cursor directory. Rules help guide AI assistance for your project.`}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-macos flex-1 space-y-6 overflow-y-auto py-4">
          {/* Folder Selection - Tabs (only show if not locked) */}
          {!lockFolder && (
            <div className="space-y-3">
              <label className="text-foreground text-sm font-medium">{t`Select Folder`}</label>
              <Tabs
                value={selectedFolder}
                onValueChange={(value) => setSelectedFolder(value as 'rules' | 'command' | 'user')}
              >
                <TabsList className="grid w-full grid-cols-3">
                  {FOLDER_OPTIONS.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      disabled={isCreating || (option.value === 'user' && hasUserRule)}
                    >
                      <span className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {FOLDER_OPTIONS.map((option) => (
                  <TabsContent key={option.value} value={option.value} className="mt-3">
                    <div className="bg-secondary/50 border-border rounded-lg border p-4">
                      <div className="text-muted-foreground text-sm">{option.description}</div>
                      <div className="text-muted-foreground/70 mt-2 font-mono text-xs">
                        {t`Example:`}{' '}
                        {option.value === 'user'
                          ? option.example
                          : `.cursor/${option.value}/${option.example}`}
                      </div>
                      {option.value === 'user' && hasUserRule && (
                        <div className="text-warning mt-2 text-xs">
                          {t`.cursorrules already exists in this repository`}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {/* Locked folder info banner (show if locked) */}
          {lockFolder && (
            <div className="bg-secondary/50 border-border rounded-lg border p-4">
              <div className="flex items-center gap-2">
                {selectedFolder === 'rules' && (
                  <>
                    <FileCodeIcon size={20} className="text-primary" />
                    <div>
                      <div className="text-foreground text-sm font-medium">
                        {t`Creating Project Rule`}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {t`This will be created in`}{' '}
                        <code className="font-mono">.cursor/rules/</code>
                      </div>
                    </div>
                  </>
                )}
                {selectedFolder === 'command' && (
                  <>
                    <FileCodeIcon size={20} className="text-accent" />
                    <div>
                      <div className="text-foreground text-sm font-medium">{t`Creating Command`}</div>
                      <div className="text-muted-foreground text-xs">
                        {t`This will be created in`}{' '}
                        <code className="font-mono">.cursor/commands/</code>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Render appropriate form based on selected folder */}
          {selectedFolder === 'rules' && (
            <ProjectRulesForm
              fileName={fileName}
              content={content}
              applyMode={applyMode}
              globPatterns={globPatterns}
              currentPattern={currentPattern}
              isCreating={isCreating}
              fullPath={fullPath}
              validationErrors={validationErrors}
              touchedFields={touchedFields}
              onFileNameChange={handleFileNameChange}
              onFileNameBlur={handleFileNameBlur}
              onContentChange={handleContentChange}
              onContentBlur={handleContentBlur}
              onApplyModeChange={handleApplyModeChange}
              onCurrentPatternChange={setCurrentPattern}
              onAddPattern={handleAddPattern}
              onRemovePattern={handleRemovePattern}
            />
          )}

          {selectedFolder === 'command' && (
            <CommandRulesForm
              fileName={fileName}
              content={content}
              isCreating={isCreating}
              fullPath={fullPath}
              validationErrors={validationErrors}
              touchedFields={touchedFields}
              onFileNameChange={handleFileNameChange}
              onFileNameBlur={handleFileNameBlur}
              onContentChange={handleContentChange}
              onContentBlur={handleContentBlur}
            />
          )}

          {selectedFolder === 'user' && (
            <UserRulesForm
              content={content}
              isCreating={isCreating}
              fullPath={fullPath}
              validationErrors={validationErrors}
              touchedFields={touchedFields}
              onContentChange={handleContentChange}
              onContentBlur={handleContentBlur}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 text-error border-error rounded-md border p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline" disabled={isCreating}>
            {t`Cancel`}
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || isCreating}>
            {isCreating ? (
              <>
                <SpinnerGapIcon size={16} className="mr-2 animate-spin" />
                {t`Creating...`}
              </>
            ) : (
              t`Create Rule`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
