import { Button } from "@frontend/components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/DropdownMenu";
import { KeyboardShortcut } from "@frontend/components/KeyboardShortcut";
import { useGitHubAuth } from "@frontend/hooks/useGitHubAuth";
import { GitHubRepositorySelectorDialog } from "@frontend/pages/dashboard/repositories/_components/GitHubRepositorySelectorDialog";
import { t } from '@lingui/macro';
import {
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  GitBranchIcon,
  LinkBreakIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import { useCallback, useState } from 'react';

import { BaseListItem } from './BaseItem';

export const CreateRepositoryListItem = () => {
  const [showSelector, setShowSelector] = useState(false);
  const { status, isConnected, connectGitHub, disconnectGitHub } = useGitHubAuth();

  const handleConnect = useCallback(() => {
    if (!isConnected) {
      // First, connect to GitHub
      connectGitHub();
    } else {
      // Already connected, show repository selector (will check token status there)
      setShowSelector(true);
    }
  }, [isConnected, connectGitHub]);

  const handleDisconnect = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (
        window.confirm(
          t`Are you sure you want to disconnect your GitHub account? This will remove all connected repositories.`
        )
      ) {
        try {
          await disconnectGitHub.mutateAsync();
        } catch (error) {
          console.error('Failed to disconnect GitHub:', error);
        }
      }
    },
    [disconnectGitHub]
  );

  return (
    <>
      <BaseListItem
        start={
          isConnected ? (
            <CheckCircleIcon size={18} className="text-success" />
          ) : (
            <GitBranchIcon size={18} />
          )
        }
        title={
          <>
            <span>{t`Connect a repository`}</span>
            <KeyboardShortcut className="ml-2">^N</KeyboardShortcut>
          </>
        }
        description={
          isConnected
            ? t`Select a repository from ${status?.username || 'your GitHub account'}`
            : t`Connect your GitHub account to get started`
        }
        onClick={handleConnect}
        end={
          isConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" disabled={disconnectGitHub.isPending}>
                  <DotsThreeVerticalIcon size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  disabled={disconnectGitHub.isPending}
                  className="text-error"
                >
                  {disconnectGitHub.isPending ? (
                    <SpinnerGapIcon size={14} className="mr-2 animate-spin" />
                  ) : (
                    <LinkBreakIcon size={14} className="mr-2" />
                  )}
                  {disconnectGitHub.isPending ? t`Disconnecting...` : t`Disconnect GitHub`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <GitHubRepositorySelectorDialog open={showSelector} onOpenChange={setShowSelector} />
    </>
  );
};
