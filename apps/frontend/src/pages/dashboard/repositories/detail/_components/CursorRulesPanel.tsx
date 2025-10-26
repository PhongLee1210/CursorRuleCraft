import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { t } from '@lingui/macro';
import {
  CaretDownIcon,
  CaretRightIcon,
  FileCodeIcon,
  FilePlusIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
  SpinnerGapIcon,
  TrashIcon,
} from '@phosphor-icons/react';

import { Button } from '@frontend/components/Button';
import { useCursorRules } from '@frontend/hooks/useCursorRules';
import { cn } from '@frontend/lib/utils';
import { CreateRuleDialog } from '@frontend/pages/dashboard/repositories/detail/_dialog/CreateRuleDialog';
import { DeleteConfirmDialog } from '@frontend/pages/dashboard/repositories/detail/_dialog/DeleteConfirmDialog';
import { EditRuleDialog } from '@frontend/pages/dashboard/repositories/detail/_dialog/EditRuleDialog';
import type { RuleTreeNode } from '@frontend/types/cursor-rules';
import type { Repository } from '@frontend/types/repository';


interface CursorRulesPanelProps {
  repository: Repository;
}

/**
 * Get appropriate icon for rule files based on type
 */
const getRuleIcon = (fileName: string) => {
  if (fileName.endsWith('.rules.mdc') || fileName.endsWith('.md')) {
    return <FileCodeIcon size={16} className="text-primary flex-shrink-0" />;
  }
  if (fileName === '.cursorrules') {
    return <FileCodeIcon size={16} className="text-accent flex-shrink-0" />;
  }
  return <FileCodeIcon size={16} className="text-muted-foreground flex-shrink-0" />;
};

const RuleTreeNode = memo<{
  node: RuleTreeNode;
  expandedNodes: Set<string>;
  onToggle: (path: string) => void;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onCreateInFolder?: (folderType: 'rules' | 'command') => void;
  level?: number;
}>(({ node, expandedNodes, onToggle, onEdit, onDelete, onCreateInFolder, level = 0 }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isDirectory = node.type === 'directory';
  const isFile = node.type === 'file';
  const isExpanded = expandedNodes.has(node.path);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDirectory) {
        onToggle(node.path);
      }
    },
    [isDirectory, node.path, onToggle]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.ruleId && onEdit) {
        onEdit(node.ruleId);
      }
      setShowMenu(false);
    },
    [node.ruleId, onEdit]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.ruleId && onDelete) {
        onDelete(node.ruleId);
      }
      setShowMenu(false);
    },
    [node.ruleId, onDelete]
  );

  const handleCreateInFolder = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCreateInFolder) {
        // Extract folder type from path: .cursor/rules or .cursor/commands
        const folderType = node.name === 'commands' ? 'command' : 'rules';
        onCreateInFolder(folderType);
      }
    },
    [node.name, onCreateInFolder]
  );

  return (
    <div className="overflow-hidden">
      <div
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
        className={cn(
          'group relative flex select-none items-center gap-2 px-3 py-1.5 text-sm',
          isDirectory && 'hover:bg-secondary/50 cursor-pointer rounded-md transition-colors',
          isFile && 'rounded-md transition-colors'
        )}
      >
        {isDirectory ? (
          <>
            <div className="transition-transform duration-200 ease-out">
              {isExpanded ? (
                <CaretDownIcon
                  size={12}
                  className="text-muted-foreground flex-shrink-0 transition-colors"
                />
              ) : (
                <CaretRightIcon
                  size={12}
                  className="text-muted-foreground flex-shrink-0 transition-colors"
                />
              )}
            </div>
            <div className="transition-all duration-200 ease-out">
              {isExpanded ? (
                <FolderOpenIcon
                  size={16}
                  className="text-primary flex-shrink-0 transition-colors"
                />
              ) : (
                <FolderIcon
                  size={16}
                  className="text-muted-foreground flex-shrink-0 transition-colors"
                />
              )}
            </div>
          </>
        ) : (
          <>
            <span className="w-3 flex-shrink-0" />
            {getRuleIcon(node.name)}
          </>
        )}
        <span className="flex-1 truncate">{node.name}</span>

        {isDirectory && (node.name === 'rules' || node.name === 'commands') && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCreateInFolder}
              className="hover:bg-secondary/50 rounded p-1 transition-colors"
              aria-label={t`Create rule in ${node.name}`}
            >
              <FilePlusIcon size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}

        {isFile && node.ruleId && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleEdit}
              className="hover:bg-secondary/50 rounded p-1 transition-colors"
              aria-label={t`Edit rule`}
            >
              <PencilIcon size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={handleDelete}
              className="hover:bg-secondary/50 rounded p-1 transition-colors"
              aria-label={t`Delete rule`}
            >
              <TrashIcon size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
      </div>

      {isDirectory && node.children && node.children.length > 0 && isExpanded && (
        <div className="origin-top transition-all duration-300 ease-out">
          {node.children.map((child) => (
            <RuleTreeNode
              key={child.path}
              node={child}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateInFolder={onCreateInFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

RuleTreeNode.displayName = 'RuleTreeNode';

/**
 * Main CursorRulesPanel Component
 */
export const CursorRulesPanel = ({ repository }: CursorRulesPanelProps) => {
  // State
  const [rulesTree, setRulesTree] = useState<RuleTreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogInitialFolder, setCreateDialogInitialFolder] = useState<
    'rules' | 'command' | undefined
  >(undefined);
  const [isCreateDialogLocked, setIsCreateDialogLocked] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // External Hooks
  const cursorRules = useCursorRules();

  // Effects
  const fetchRulesTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cursorRules.getRulesTree(repository.id);
      if (result.error) {
        throw result.error;
      }
      setRulesTree(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cursor rules';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [repository.id, cursorRules]);

  useEffect(() => {
    void fetchRulesTree();
  }, [fetchRulesTree]);

  // Event Handlers
  const handleToggle = useCallback((path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleEdit = useCallback((ruleId: string) => {
    setEditingRuleId(ruleId);
  }, []);

  const handleDelete = useCallback((ruleId: string) => {
    setDeletingRuleId(ruleId);
  }, []);

  const handleCreateInFolder = useCallback((folderType: 'rules' | 'command') => {
    setCreateDialogInitialFolder(folderType);
    setIsCreateDialogLocked(true); // Lock to this folder type
    setIsCreateDialogOpen(true);
  }, []);

  const handleSaveRule = useCallback(
    async (
      ruleId: string,
      content: string,
      applyMode?: 'always' | 'intelligent' | 'specific' | 'manual',
      globPattern?: string
    ) => {
      const result = await cursorRules.updateRule(repository.id, ruleId, {
        content,
        apply_mode: applyMode,
        glob_pattern: globPattern,
      });
      if (result.error) {
        throw result.error;
      }
      // Refresh the tree
      await fetchRulesTree();
    },
    [cursorRules, repository.id, fetchRulesTree]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRuleId) return;

    const result = await cursorRules.deleteRule(repository.id, deletingRuleId);
    if (result.error) {
      throw result.error;
    }
    // Refresh the tree
    await fetchRulesTree();
  }, [deletingRuleId, cursorRules, fetchRulesTree]);

  const handleCreateRule = useCallback(
    async (
      fileName: string,
      folder: 'rules' | 'command' | 'user',
      content: string,
      applyMode?: 'always' | 'intelligent' | 'specific' | 'manual',
      globPattern?: string
    ) => {
      let type: 'PROJECT_RULE' | 'COMMAND' | 'USER_RULE';

      if (folder === 'user') {
        type = 'USER_RULE';
      } else if (folder === 'command') {
        type = 'COMMAND';
      } else {
        type = 'PROJECT_RULE';
      }

      // Note: fileName should NOT include extension
      // The backend will add the appropriate extension when building the tree
      const result = await cursorRules.createRule(repository.id, {
        file_name: fileName,
        content,
        type,
        is_active: true,
        apply_mode: applyMode,
        glob_pattern: globPattern,
      });

      if (result.error) {
        throw result.error;
      }

      // Refresh the tree
      await fetchRulesTree();
    },
    [cursorRules, repository.id, fetchRulesTree]
  );

  // Computed Values - Must be before early returns to follow Rules of Hooks
  const hasRules = rulesTree?.children && rulesTree.children.length > 0;

  // Check if .cursorrules already exists
  const hasUserRule = useMemo(() => {
    if (!rulesTree?.children) return false;

    const checkForUserRule = (nodes: RuleTreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name === '.cursorrules') {
          return true;
        }
        if (node.type === 'directory' && node.children) {
          if (checkForUserRule(node.children)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkForUserRule(rulesTree.children);
  }, [rulesTree]);

  // Early Returns
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <SpinnerGapIcon size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-error text-sm">{error}</p>
      </div>
    );
  }

  // Render
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <FolderIcon size={16} className="text-primary" />
          <span className="text-foreground text-sm font-medium">Cursor Rules</span>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            setCreateDialogInitialFolder(undefined);
            setIsCreateDialogLocked(false); // Allow all folder types
            setIsCreateDialogOpen(true);
          }}
        >
          <FilePlusIcon size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="scrollbar-macos flex-1 overflow-y-auto">
        {!hasRules ? (
          <div className="text-muted-foreground p-8 text-center">
            <div className="bg-secondary/50 border-border mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed">
              <FolderOpenIcon size={32} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t`No cursor rules found`}</p>
            <p className="mt-2 text-xs">{t`Click the + button to create your first rule`}</p>
          </div>
        ) : (
          <div className="py-2">
            {rulesTree.children?.map((node) => (
              <RuleTreeNode
                key={node.path}
                node={node}
                expandedNodes={expandedNodes}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateInFolder={handleCreateInFolder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateRuleDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setCreateDialogInitialFolder(undefined);
          setIsCreateDialogLocked(false);
        }}
        repositoryId={repository.id}
        onCreate={handleCreateRule}
        initialFolder={createDialogInitialFolder}
        lockFolder={isCreateDialogLocked}
        hasUserRule={hasUserRule}
      />

      {/* Edit Dialog */}
      {editingRuleId && (
        <EditRuleDialog
          open={!!editingRuleId}
          onClose={() => setEditingRuleId(null)}
          ruleId={editingRuleId}
          repositoryId={repository.id}
          onSave={handleSaveRule}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingRuleId && (
        <DeleteConfirmDialog
          open={!!deletingRuleId}
          onClose={() => setDeletingRuleId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
