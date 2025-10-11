import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useRepositoryService } from '@/hooks/useRepositoryService';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { t } from '@lingui/macro';
import {
  ChatCircleDotsIcon,
  FileCodeIcon,
  FolderIcon,
  FolderOpenIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AIChatPanel, type AIChatPanelRef } from './components/AIChatPanel';
import { FileTreePanel } from './components/FileTreePanel';
import { RepositoryHeader } from './components/RepositoryHeader';

dayjs.extend(relativeTime);

export const RepositoryDetailPage = () => {
  // Refs
  const aiChatPanelRef = useRef<AIChatPanelRef>(null);

  // State
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'files' | 'chat'>('files');
  const [activeDragItem, setActiveDragItem] = useState<{
    name: string;
    path: string;
    type: 'file' | 'directory';
  } | null>(null);

  // External Hooks
  const { id: repositoryId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repositoryService = useRepositoryService();

  // Setup drag and drop sensors with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement to avoid conflicts with clicks
      },
    })
  );

  // Computed Values
  const lastSynced = repository?.lastSyncedAt
    ? dayjs(repository.lastSyncedAt).fromNow()
    : t`Never synced`;

  // Effects
  useEffect(() => {
    const fetchRepository = async () => {
      if (!repositoryId) {
        setError('Repository ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await repositoryService.getRepositoryById(repositoryId);
        if (result.error) {
          throw result.error;
        }
        setRepository(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load repository';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRepository();
  }, [repositoryId, repositoryService]);

  // Event Handlers
  const handleBack = useCallback(() => {
    navigate('/dashboard/repositories');
  }, [navigate]);

  const handleSync = useCallback(async () => {
    if (!repositoryId) return;

    try {
      const result = await repositoryService.syncRepository(repositoryId);
      if (result.error) {
        throw result.error;
      }
      setRepository(result.data);
    } catch (err) {
      console.error('Failed to sync repository:', err);
    }
  }, [repositoryId, repositoryService]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current) {
      setActiveDragItem(
        active.data.current as {
          name: string;
          path: string;
          type: 'file' | 'directory';
        }
      );
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    // If dropped over the chat input
    if (over && over.id === 'chat-input-droppable' && active.data.current) {
      const fileData = active.data.current as {
        name: string;
        path: string;
        type: 'file' | 'directory';
      };
      aiChatPanelRef.current?.handleFileDrop(fileData);
    }

    // Clear the active drag item
    setActiveDragItem(null);
  }, []);

  // Early Returns
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <SpinnerGapIcon size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-error text-lg">{error || 'Repository not found'}</p>
        <Button onClick={handleBack}>{t`Back to Repositories`}</Button>
      </div>
    );
  }

  // Render
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-background flex h-screen flex-col">
        {/* Header */}
        <RepositoryHeader
          repository={repository}
          lastSynced={lastSynced}
          onBack={handleBack}
          onSync={handleSync}
        />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - File Tree */}
          <aside
            className={cn(
              'border-border flex flex-col border-r transition-all',
              activePanel === 'files' ? 'min-w-64' : 'w-fit'
            )}
          >
            <div className="border-border flex h-[57px] items-center justify-between border-b px-4 py-3">
              {activePanel === 'files' ? (
                <>
                  <div className="flex items-center gap-2">
                    <FolderOpenIcon size={20} className="text-primary" />
                    <span className="font-semibold">{t`Files`}</span>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => setActivePanel('files')}
                  variant="ghost"
                  size="sm"
                  aria-label={t`Show files`}
                >
                  <FolderOpenIcon size={18} />
                </Button>
              )}
            </div>

            {activePanel === 'files' && (
              <div className="scrollbar-macos flex-1 overflow-y-auto">
                <FileTreePanel repository={repository} />
              </div>
            )}
          </aside>

          <main className="flex flex-1 flex-col">
            <div className="border-border flex h-[57px] items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ChatCircleDotsIcon size={20} className="text-primary" />
                <span className="font-semibold">{t`AI Assistant`}</span>
              </div>
              {activePanel === 'chat' && (
                <IconButton
                  onClick={() => setActivePanel('files')}
                  label={t`Show files`}
                  icon={<FileCodeIcon size={18} />}
                />
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <AIChatPanel ref={aiChatPanelRef} repository={repository} />
            </div>
          </main>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragItem && (
          <div className="bg-primary/10 border-primary flex items-center gap-2 rounded-lg border-2 px-3 py-2 shadow-lg backdrop-blur-sm">
            {activeDragItem.type === 'directory' ? (
              <FolderIcon size={16} className="text-primary" />
            ) : (
              <FileCodeIcon size={16} className="text-primary" />
            )}
            <span className="text-foreground text-sm font-medium">{activeDragItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
