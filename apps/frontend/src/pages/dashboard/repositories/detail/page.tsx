import { Button } from "@frontend/components/Button";
import { IconButton } from "@frontend/components/IconButton";
import { useRepositoryService } from "@frontend/hooks/useRepositoryService";
import { cn } from "@frontend/lib/utils";
import type { IFileTreeNode } from "@frontend/services/repository/repository";
import { KindState, type State } from "@frontend/types";
import type { Repository } from "@frontend/types/repository";
import { experimental_useObject as useObject } from '@ai-sdk/react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { t } from '@lingui/macro';
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
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
import z from 'zod';
import { AIChatPanel, type AIChatPanelRef } from './_components/AIChatPanel';
import { FileTreePanel } from './_components/FileTreePanel';
import { RepositoryHeader } from './_components/RepositoryHeader';

dayjs.extend(relativeTime);

export const RepositoryDetailPage = () => {
  // Refs
  const aiChatPanelRef = useRef<AIChatPanelRef>(null);

  // State
  const [repository, setRepository] = useState<Repository | null>(null);
  const [state, setState] = useState<State>();
  const [isRateLimited, setIsRateLimited] = useState(false);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState<IFileTreeNode | null>(null);

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
        setState({ kind: KindState.ERROR, message: 'Not found' });
        return;
      }

      setState({ kind: KindState.LOADING });

      try {
        const result = await repositoryService.getRepositoryById(repositoryId);
        if (result.error) {
          throw result.error;
        }
        setRepository(result.data);
        setState({ kind: KindState.SUCCESSFUL, data: result.data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load repository';
        setState({ kind: KindState.ERROR, message });
      }
    };

    void fetchRepository();
  }, [repositoryId, repositoryService]);

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/chat',
    schema: z.object({ content: z.string() }),
    onError: (error) => {
      console.error('Error submitting request:', error);
      if (error.message.includes('limit')) {
        setIsRateLimited(true);
      }

      //   setErrorMessage(error.message);
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        // send it to /api/sandbox
        console.log('fragment', fragment);
        // posthog.capture('fragment_generated', {
        //   template: fragment?.template,
        // });

        // const response = await fetch('/api/sandbox', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     fragment,
        //     userID: session?.user?.id,
        //     teamID: userTeam?.id,
        //     accessToken: session?.access_token,
        //   }),
        // });

        // const result = await response.json();
        // console.log('result', result);
        // posthog.capture('sandbox_created', { url: result.url });

        // setResult(result);
        // setCurrentPreview({ fragment, result });
        // setMessage({ result });
        // setCurrentTab('fragment');
        // setIsPreviewLoading(false);
      }
    },
  });

  useEffect(() => {
    if (object) {
      //   setFragment(object);
      //   const content: Message['content'] = [
      //     { type: 'text', text: object.commentary || '' },
      //     { type: 'code', text: object.code || '' },
      //   ];
      //   if (!lastMessage || lastMessage.role !== 'assistant') {
      //     addMessage({
      //       role: 'assistant',
      //       content,
      //       object,
      //     });
      //   }
      //   if (lastMessage && lastMessage.role === 'assistant') {
      //     setMessage({
      //       content,
      //       object,
      //     });
      //   }
    }
  }, [object]);

  useEffect(() => {
    if (error) stop();
  }, [error]);

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
      setActiveDragItem(active.data.current as IFileTreeNode);
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
  if (state?.kind === KindState.LOADING) {
    return (
      <div className="flex h-screen items-center justify-center">
        <SpinnerGapIcon size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  if (state?.kind === KindState.ERROR) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-error text-lg">{state.message || 'Repository not found'}</p>
        <Button onClick={handleBack}>{t`Back to Repositories`}</Button>
      </div>
    );
  }

  if (!repository) {
    return null;
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
                    icon={<ArrowLeftIcon size={18} />}
                    hoverable={false}
                  />
                </>
              ) : (
                <IconButton
                  onClick={() => setShowLeftPanel(true)}
                  label={t`Show files`}
                  icon={<FolderOpenIcon size={18} />}
                  hoverable={false}
                />
              )}
            </div>

            <div
              className={cn(
                'scrollbar-macos flex-1 overflow-y-auto',
                showLeftPanel ? 'min-w-64' : 'w-0'
              )}
            >
              <FileTreePanel repository={repository} />
            </div>
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
                  hoverable={false}
                />
                <div className="bg-border h-5 w-px" />
                <IconButton
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  label={showRightPanel ? t`Hide rules` : t`Show rules`}
                  icon={showRightPanel ? <CaretRightIcon size={18} /> : <FileCodeIcon size={18} />}
                  hoverable={false}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <AIChatPanel ref={aiChatPanelRef} repository={repository} />
            </div>
          </main>

          {/* Right Panel - Cursor Rules */}
          {/* <Preview
            accessToken={session?.access_token}
            selectedTab={currentTab}
            onSelectedTabChange={setCurrentTab}
            isChatLoading={isLoading}
            fragment={fragment}
            result={result as ExecutionResult}
            onClose={() => setFragment(undefined)}
          /> */}
          {/* <aside
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
          </aside> */}
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
