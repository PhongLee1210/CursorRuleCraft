import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useRepositoryService } from '@/hooks/useRepositoryService';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { t } from '@lingui/macro';
import {
  ArrowClockwiseIcon,
  CaretRightIcon,
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
import { AIChatPanel, type AIChatPanelRef } from './_components/AIChatPanel';
import { CursorRulesPanel } from './_components/CursorRulesPanel';
import { FileTreePanel } from './_components/FileTreePanel';
import { RepositoryHeader } from './_components/RepositoryHeader';

dayjs.extend(relativeTime);

export const RepositoryDetailPage = () => {
  // Refs
  const aiChatPanelRef = useRef<AIChatPanelRef>(null);

  // State
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
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

  const handleResetSession = useCallback(() => {
    aiChatPanelRef.current?.resetSession();
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
              showLeftPanel ? 'min-w-64' : 'w-fit'
            )}
          >
            <div className="border-border flex h-[57px] items-center justify-between border-b px-4 py-3">
              {showLeftPanel ? (
                <>
                  <div className="flex items-center gap-2">
                    <FolderOpenIcon size={20} className="text-primary" />
                    <span className="font-semibold">{t`Files`}</span>
                  </div>
                  <IconButton
                    onClick={() => setShowLeftPanel(false)}
                    label={t`Hide files`}
                    icon={<FolderOpenIcon size={18} />}
                  />
                </>
              ) : (
                <IconButton
                  onClick={() => setShowLeftPanel(true)}
                  label={t`Show files`}
                  icon={<FolderOpenIcon size={18} />}
                />
              )}
            </div>

            {showLeftPanel && (
              <div className="scrollbar-macos flex-1 overflow-y-auto">
                <FileTreePanel repository={repository} />
              </div>
            )}
          </aside>

          {/* Center Panel - AI Chat */}
          <main className="flex min-w-0 flex-1 flex-col">
            <div className="border-border flex h-[57px] items-center justify-between border-b px-4 py-3">
              <div className="flex shrink items-center gap-2 truncate">
                <ChatCircleDotsIcon size={20} className="text-primary" />
                <span className="font-semibold">{t`AI Assistant`}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconButton
                  onClick={handleResetSession}
                  label={t`Reset session`}
                  icon={<ArrowClockwiseIcon size={18} />}
                />
                <div className="bg-border h-5 w-px" />
                <IconButton
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  label={showRightPanel ? t`Hide rules` : t`Show rules`}
                  icon={showRightPanel ? <CaretRightIcon size={18} /> : <FileCodeIcon size={18} />}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <AIChatPanel ref={aiChatPanelRef} repository={repository} />
            </div>
          </main>

          {/* Right Panel - Cursor Rules */}
          <aside
            className={cn(
              'border-border flex flex-col border-l transition-all',
              showRightPanel ? 'min-w-64' : 'w-fit'
            )}
          >
            {showRightPanel && (
              <div className="scrollbar-macos flex-1 overflow-y-auto">
                <CursorRulesPanel repository={repository} />
              </div>
            )}
          </aside>
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
