import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { useRepositoryService } from '@/hooks/useRepositoryService';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import { t } from '@lingui/macro';
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  ChatCircleDotsIcon,
  FileCodeIcon,
  FolderOpenIcon,
  GithubLogoIcon,
  GitlabLogoIcon,
  LinkSimpleIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AIChatPanel } from './components/AIChatPanel';
import { FileTreePanel } from './components/FileTreePanel';

dayjs.extend(relativeTime);

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'GITHUB':
      return <GithubLogoIcon size={24} />;
    case 'GITLAB':
      return <GitlabLogoIcon size={24} />;
    default:
      return <LinkSimpleIcon size={24} />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'GITHUB':
      return 'text-[#181717] dark:text-white';
    case 'GITLAB':
      return 'text-[#FC6D26]';
    default:
      return 'text-primary';
  }
};

export const RepositoryDetailPage = () => {
  // Refs

  // State
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'files' | 'chat'>('files');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // External Hooks
  const { id: repositoryId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repositoryService = useRepositoryService();

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

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedFile(filePath);
    // setActivePanel('chat');
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
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <IconButton onClick={handleBack} label={t`Back`} icon={<ArrowLeftIcon size={20} />} />

          <div
            className={cn(
              'bg-secondary/50 flex items-center justify-center rounded-lg p-2',
              getProviderColor(repository.provider)
            )}
          >
            {getProviderIcon(repository.provider)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{repository.name}</h1>
              {repository.isPrivate && (
                <Badge variant="secondary" className="text-xs">
                  {t`Private`}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{repository.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-muted-foreground flex flex-col items-end text-xs">
            <span>{t`Last synced:`}</span>
            <span className="font-medium">{lastSynced}</span>
          </div>
          <Button onClick={handleSync} variant="outline" size="sm">
            <ArrowsClockwiseIcon size={16} className="mr-2" />
            {t`Sync`}
          </Button>
          <Button onClick={() => window.open(repository.url, '_blank')} variant="outline" size="sm">
            <LinkSimpleIcon size={16} className="mr-2" />
            {t`View on ${repository.provider}`}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - File Tree */}
        <aside
          className={cn(
            'border-border flex flex-col border-r transition-all',
            activePanel === 'files' ? 'w-80' : 'w-fit'
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
            <div className="flex-1 overflow-y-auto">
              <FileTreePanel
                repository={repository}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            </div>
          )}
        </aside>

        <main className="flex flex-1 flex-col">
          {activePanel === 'chat' && (
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <>
                <div className="flex items-center gap-2">
                  <ChatCircleDotsIcon size={20} className="text-primary" />
                  <span className="font-semibold">{t`AI Assistant`}</span>
                </div>
                <IconButton
                  onClick={() => setActivePanel('files')}
                  label={t`Show files`}
                  icon={<FileCodeIcon size={18} />}
                />
              </>
            </div>
          )}
          {selectedFile === null && (
            <div className="border-border flex h-[57px] items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ChatCircleDotsIcon size={20} className="text-primary" />
                <span className="font-semibold">{t`AI Assistant`}</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <AIChatPanel
              repository={repository}
              selectedFile={selectedFile}
              onClearFileSelection={() => setSelectedFile(null)}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
