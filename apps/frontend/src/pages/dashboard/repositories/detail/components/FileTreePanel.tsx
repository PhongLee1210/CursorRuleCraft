import { useRepositoryService } from '@/hooks/useRepositoryService';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
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
import { useCallback, useEffect, useState } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isExpanded?: boolean;
}

interface FileTreePanelProps {
  repository: Repository;
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
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
    return <FileCodeIcon size={16} className="text-primary" />;
  }
  return <FileIcon size={16} className="text-muted-foreground" />;
};

const FileTreeNode = ({
  node,
  onFileSelect,
  selectedFile,
  onToggle,
  level = 0,
}: {
  node: FileNode;
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
  onToggle: (path: string) => void;
  level?: number;
}) => {
  const isSelected = selectedFile === node.path;
  const isDirectory = node.type === 'directory';

  const handleClick = useCallback(() => {
    if (isDirectory) {
      onToggle(node.path);
    } else {
      onFileSelect(node.path);
    }
  }, [isDirectory, node.path, onFileSelect, onToggle]);

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'hover:bg-secondary/50 flex cursor-pointer select-none items-center gap-2 px-3 py-1.5 text-sm transition-colors',
          isSelected && 'bg-secondary',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {isDirectory ? (
          <>
            {node.isExpanded ? (
              <CaretDownIcon size={12} className="text-muted-foreground flex-shrink-0" />
            ) : (
              <CaretRightIcon size={12} className="text-muted-foreground flex-shrink-0" />
            )}
            {node.isExpanded ? (
              <FolderOpenIcon size={16} className="text-primary flex-shrink-0" />
            ) : (
              <FolderIcon size={16} className="text-muted-foreground flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {isDirectory && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreePanel = ({ repository, onFileSelect, selectedFile }: FileTreePanelProps) => {
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

    setFileTree((prev) => toggleNode(prev));
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
        <FileTreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};
