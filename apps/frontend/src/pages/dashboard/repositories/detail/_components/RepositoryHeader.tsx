import { Badge } from "@frontend/components/Badge";
import { Button } from "@frontend/components/Button";
import { IconButton } from "@frontend/components/IconButton";
import { cn } from "@frontend/lib/utils";
import type { Repository } from "@frontend/types/repository";
import { t } from '@lingui/macro';
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  GithubLogoIcon,
  GitlabLogoIcon,
  LinkSimpleIcon,
} from '@phosphor-icons/react';
import { memo } from 'react';

// Helper Functions
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

// Types
interface RepositoryHeaderProps {
  repository: Repository;
  lastSynced: string;
  onBack: () => void;
  onSync: () => void;
}

export const RepositoryHeader = memo(
  ({ repository, lastSynced, onBack, onSync }: RepositoryHeaderProps) => {
    // Event Handlers
    const handleViewOnProvider = () => {
      window.open(repository.url, '_blank');
    };

    // Render
    return (
      <header className="border-border flex items-center justify-between border-b px-6 py-4 pl-2">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeftIcon size={20} />
            {t`Back`}
          </Button>

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
          <IconButton onClick={onSync} label={t`Sync`} icon={<ArrowsClockwiseIcon size={16} />} />
          <IconButton
            onClick={handleViewOnProvider}
            label={t`View on ${repository.provider}`}
            icon={<LinkSimpleIcon size={16} />}
          />
        </div>
      </header>
    );
  }
);

RepositoryHeader.displayName = 'RepositoryHeader';
