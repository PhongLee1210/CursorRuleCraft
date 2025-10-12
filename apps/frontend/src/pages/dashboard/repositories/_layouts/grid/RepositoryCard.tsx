import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/DropdownMenu';
import { useRepositories } from '@/hooks/useRepositories';
import { cn } from '@/lib/utils';
import type { Repository } from '@/types/repository';
import { t } from '@lingui/macro';
import {
  ArrowsClockwiseIcon,
  DotsThreeVerticalIcon,
  FolderOpenIcon,
  GitBranchIcon,
  GithubLogoIcon,
  GitlabLogoIcon,
  LinkSimpleIcon,
  SpinnerGapIcon,
  StarIcon,
  TrashSimpleIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router';

dayjs.extend(relativeTime);

type Props = {
  repository: Repository;
};

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'GITHUB':
      return <GithubLogoIcon size={32} />;
    case 'GITLAB':
      return <GitlabLogoIcon size={32} />;
    default:
      return <LinkSimpleIcon size={32} />;
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

export const RepositoryCard = ({ repository }: Props) => {
  const navigate = useNavigate();
  const { syncRepository, deleteRepository } = useRepositories();

  const lastSynced = repository.lastSyncedAt
    ? dayjs(repository.lastSyncedAt).fromNow()
    : t`Never synced`;

  const isSyncing = syncRepository.isPending;
  const isDeleting = deleteRepository.isPending;

  const onOpen = () => {
    void navigate(`/dashboard/repositories/${repository.id}`);
  };

  const onSync = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await syncRepository.mutateAsync(repository.id);
    } catch (error) {
      console.error('Failed to sync repository:', error);
    }
  };

  const onDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t`Are you sure you want to disconnect this repository?`)) {
      try {
        await deleteRepository.mutateAsync(repository.id);
      } catch (error) {
        console.error('Failed to delete repository:', error);
      }
    }
  };

  return (
    <div
      onClick={onOpen}
      className={cn(
        'border-border bg-card group relative flex h-[280px] cursor-pointer flex-col rounded-lg border p-6 transition-all hover:shadow-lg'
      )}
    >
      {/* Header with provider icon and actions */}
      <div className="flex items-start justify-between">
        <div
          className={cn('bg-secondary/50 rounded-lg p-3', getProviderColor(repository.provider))}
        >
          {getProviderIcon(repository.provider)}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <DotsThreeVerticalIcon size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <FolderOpenIcon size={14} className="mr-2" />
              {t`Open`}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
              {isSyncing ? (
                <SpinnerGapIcon size={14} className="mr-2 animate-spin" />
              ) : (
                <ArrowsClockwiseIcon size={14} className="mr-2" />
              )}
              {isSyncing ? t`Syncing...` : t`Sync Now`}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-error" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? (
                <SpinnerGapIcon size={14} className="mr-2 animate-spin" />
              ) : (
                <TrashSimpleIcon size={14} className="mr-2" />
              )}
              {isDeleting ? t`Disconnecting...` : t`Disconnect`}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Repository info */}
      <div className="mt-4 flex-1 space-y-2 overflow-hidden break-words">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 text-lg font-semibold">{repository.name}</h3>
          {repository.isPrivate && (
            <Badge variant="secondary" className="text-xs">
              {t`Private`}
            </Badge>
          )}
          {repository.language && (
            <Badge variant="secondary" outline className="text-xs">
              {repository.language}
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground text-sm">{repository.fullName}</p>

        {repository.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{repository.description}</p>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="mt-auto space-y-2 pt-4">
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <GitBranchIcon size={12} weight="bold" />
            <span>{repository.defaultBranch}</span>
          </div>
          {repository.starsCount !== undefined && (
            <div className="flex items-center gap-1">
              <StarIcon size={12} weight="bold" />
              <span>{repository.starsCount}</span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{t`Last synced:`}</span>
          <span>{lastSynced}</span>
        </div>
      </div>
    </div>
  );
};
