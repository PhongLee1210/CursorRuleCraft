import { useRepositoryService } from '@/hooks/useRepositoryService';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { t } from '@lingui/macro';
import {
  CaretDownIcon,
  CaretRightIcon,
  FileCodeIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isExpanded?: boolean;
}

interface FileTreePanelProps {
  repository: Repository;
}

/**
 * Sort file tree nodes: directories first, then files, both alphabetically
 * This matches GitHub's file tree sorting behavior
 */
const sortFileTree = (nodes: FileNode[]): FileNode[] => {
  const sorted = [...nodes].sort((a, b) => {
    // Directories come before files
    if (a.type === 'directory' && b.type === 'file') {
      return -1;
    }
    if (a.type === 'file' && b.type === 'directory') {
      return 1;
    }
    // Within same type, sort alphabetically (case-insensitive)
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  // Recursively sort children
  return sorted.map((node) => ({
    ...node,
    children: node.children ? sortFileTree(node.children) : undefined,
  }));
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const codeExtensions = [
    'ts',
    'tsx',
    'js',
    'jsx',
    'py',
    'java',
    'go',
    'rs',
    'c',
    'cpp',
    'css',
    'scss',
    'html',
    'json',
    'yaml',
    'yml',
    'md',
    'txt',
  ];

  if (codeExtensions.includes(ext || '')) {
    return <FileCodeIcon size={16} className="text-primary flex-shrink-0" />;
  }
  return <FileIcon size={16} className="text-muted-foreground flex-shrink-0" />;
};

const FileTreeNode = memo<{
  node: FileNode;
  onToggle: (path: string) => void;
  level?: number;
}>(({ node, onToggle, level = 0 }) => {
  const isDirectory = node.type === 'directory';

  // Setup draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.path,
    data: {
      name: node.name,
      path: node.path,
      type: node.type,
    },
  });

  const style = useMemo(
    () => ({
      transform: CSS.Translate.toString(transform),
    }),
    [transform]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only toggle folder if not dragging
      if (isDirectory && !isDragging) {
        onToggle(node.path);
      }
    },
    [isDirectory, isDragging, node.path, onToggle]
  );

  return (
    <div className="overflow-hidden">
      <div
        ref={setNodeRef}
        style={{ ...style, paddingLeft: `${level * 12 + 12}px` }}
        {...listeners}
        {...attributes}
        onClick={handleClick}
        className={cn(
          'flex select-none items-center gap-2 px-3 py-1.5 text-sm',
          'hover:bg-secondary/50 active:bg-secondary/70 rounded-md transition-all duration-150 ease-out',
          'cursor-grab active:cursor-grabbing',
          isDragging && 'cursor-grabbing opacity-60 shadow-lg'
        )}
      >
        {isDirectory ? (
          <>
            <div className="transition-transform duration-200 ease-out">
              {node.isExpanded ? (
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
              {node.isExpanded ? (
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
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {isDirectory && node.children && (
        <div
          className={cn(
            'origin-top transition-all duration-300 ease-out',
            node.isExpanded
              ? 'max-h-[10000px] scale-y-100 opacity-100'
              : 'max-h-0 scale-y-95 opacity-0'
          )}
        >
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} onToggle={onToggle} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
});

FileTreeNode.displayName = 'FileTreeNode';

export const FileTreePanel = ({ repository }: FileTreePanelProps) => {
  // State
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // External Hooks
  const repositoryService = useRepositoryService();

  // Effects
  useEffect(() => {
    const fetchFileTree = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repositoryService.getRepositoryFileTree(repository.id);
        if (result.error) {
          throw result.error;
        }
        // Sort the file tree to ensure directories come before files
        const sortedTree = sortFileTree(result.data || []);
        setFileTree(sortedTree);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load file tree';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFileTree();
  }, [repository.id, repositoryService]);

  // Event Handlers
  const handleToggle = useCallback((path: string) => {
    setFileTree((prev) => {
      const toggleNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleNode(node.children) };
          }
          return node;
        });
      };
      return toggleNode(prev);
    });
  }, []);

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

  if (fileTree.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">{t`No files found`}</div>;
  }

  // Render
  return (
    <div className="py-2">
      {fileTree.map((node) => (
        <FileTreeNode key={node.path} node={node} onToggle={handleToggle} />
      ))}
    </div>
  );
};
