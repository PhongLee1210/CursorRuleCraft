import { Badge } from "@frontend/components/Badge";
import { Button } from "@frontend/components/Button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@frontend/components/ContextMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/DropdownMenu";
import { useRepositories } from "@frontend/hooks/useRepositories";
import type { Repository } from "@frontend/types/repository";
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
import { useNavigate } from 'react-router';

import { BaseListItem } from './BaseItem';

type Props = {
  repository: Repository;
};

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'GITHUB':
      return <GithubLogoIcon size={20} />;
    case 'GITLAB':
      return <GitlabLogoIcon size={20} />;
    default:
      return <LinkSimpleIcon size={20} />;
  }
};

export const RepositoryListItem = ({ repository }: Props) => {
  const navigate = useNavigate();
  const { syncRepository, deleteRepository } = useRepositories();

  const lastSynced = repository.lastSyncedAt
    ? dayjs(repository.lastSyncedAt).format('DD/MM/YYYY HH:mm')
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

  const dropdownMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="aspect-square">
        <Button size="icon" variant="ghost">
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
        <ContextMenuSeparator />
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
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger className="even:bg-secondary/20">
        <BaseListItem
          className="group"
          start={getProviderIcon(repository.provider)}
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{repository.name}</span>
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
          }
          description={
            <div className="space-y-1">
              <p className="text-xs opacity-75">{repository.fullName}</p>
              <div className="flex items-center gap-3 text-xs opacity-60">
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
                <span>•</span>
                <span>{t`Last synced: ${lastSynced}`}</span>
              </div>
            </div>
          }
          end={dropdownMenu}
          onClick={onOpen}
        />
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onOpen}>
          <FolderOpenIcon size={14} className="mr-2" />
          {t`Open`}
        </ContextMenuItem>
        <ContextMenuItem onClick={onSync} disabled={isSyncing}>
          {isSyncing ? (
            <SpinnerGapIcon size={14} className="mr-2 animate-spin" />
          ) : (
            <ArrowsClockwiseIcon size={14} className="mr-2" />
          )}
          {isSyncing ? t`Syncing...` : t`Sync Now`}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-error" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? (
            <SpinnerGapIcon size={14} className="mr-2 animate-spin" />
          ) : (
            <TrashSimpleIcon size={14} className="mr-2" />
          )}
          {isDeleting ? t`Disconnecting...` : t`Disconnect`}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
