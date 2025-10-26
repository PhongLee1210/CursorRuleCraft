import { useCallback, useState } from 'react';

import { t } from '@lingui/macro';
import {
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  GitBranchIcon,
  GithubLogoIcon,
  LinkBreakIcon,
  PlusIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';

import { Button } from '@frontend/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/DropdownMenu';
import { useGitHubAuth } from '@frontend/hooks/useGitHubAuth';
import { cn } from '@frontend/lib/utils';
import { GitHubRepositorySelectorDialog } from '@frontend/pages/dashboard/repositories/_components/GitHubRepositorySelectorDialog';


export const CreateRepositoryCard = () => {
  const [showSelector, setShowSelector] = useState(false);
  const { status, isConnected, isLoading, connectGitHub, disconnectGitHub } = useGitHubAuth();

  const handleConnect = useCallback(() => {
    if (!isConnected) {
      // First, connect to GitHub
      connectGitHub();
    } else {
      // Already connected, show repository selector (will check token status there)
      setShowSelector(true);
    }
  }, [isConnected, connectGitHub]);

  const handleDisconnect = useCallback(async () => {
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
  }, [disconnectGitHub]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isLoading || disconnectGitHub.isPending}
          className={cn(
            'border-border bg-secondary/20 hover:border-primary hover:bg-secondary/40 group relative flex h-[280px] w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center transition-all disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          <div className="bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center rounded-full p-4 transition-colors">
            {isLoading ? (
              <SpinnerGapIcon size={32} className="text-primary animate-spin" />
            ) : (
              <GitBranchIcon size={32} className="text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center justify-center gap-2 text-lg font-semibold">
              <PlusIcon size={20} />
              <span>{t`Connect Repository`}</span>
            </h3>
            <p className="text-muted-foreground/60 text-center text-sm">
              {isConnected ? t`Select a repository` : t`Connect your GitHub account`}
            </p>
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-6 flex items-center gap-2">
            {isConnected ? (
              <>
                <CheckCircleIcon size={16} className="text-success" />
                <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-xs">
                  {t`Connected as`} {status?.username}
                </span>
              </>
            ) : (
              <>
                <GithubLogoIcon size={16} className="text-muted-foreground" />
                <span className="text-muted-foreground/40 group-hover:text-muted-foreground text-xs">{t`Click to connect GitHub`}</span>
              </>
            )}
          </div>
        </button>

        {/* Disconnect menu - only show when connected */}
        {isConnected && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  disabled={disconnectGitHub.isPending}
                >
                  <DotsThreeVerticalIcon size={20} />
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
          </div>
        )}
      </div>

      {/* Repository Selector Dialog */}
      <GitHubRepositorySelectorDialog open={showSelector} onOpenChange={setShowSelector} />
    </>
  );
};
