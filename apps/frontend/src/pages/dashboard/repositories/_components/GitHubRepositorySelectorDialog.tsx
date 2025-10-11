import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/Dialog';
import { Input } from '@/components/Input';
import { ScrollArea } from '@/components/ScrollArea';
import { useGitHubRepositories, useRepositories } from '@/hooks/useRepositories';
import { cn } from '@/lib/utils';
import type { GitHubRepository } from '@/types/repository';
import { t } from '@lingui/macro';
import {
  GithubLogoIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  SpinnerGapIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

interface GitHubRepositorySelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GitHubRepositorySelectorDialog = ({
  open,
  onOpenChange,
}: GitHubRepositorySelectorDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounceValue(searchQuery, 300);

  const { repositories: githubRepos, isLoading } = useGitHubRepositories();
  const { connectGitHubRepository } = useRepositories();

  // Filter repositories based on search
  const filteredRepos = githubRepos.filter((repo: GitHubRepository) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      repo.full_name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query)
    );
  });

  const handleConnect = async (repo: GitHubRepository) => {
    try {
      const [owner, repoName] = repo.full_name.split('/');
      await connectGitHubRepository.mutateAsync({ owner, repo: repoName });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to connect repository:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GithubLogoIcon size={24} />
            {t`Connect GitHub Repository`}
          </DialogTitle>
          <DialogDescription>
            {t`Select a repository from your GitHub account to connect to this workspace.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon
              size={18}
              className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
            />
            <Input
              placeholder={t`Search repositories...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Repository List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <SpinnerGapIcon size={32} className="text-primary animate-spin" />
                <p className="text-muted-foreground mt-4 text-sm">{t`Loading repositories...`}</p>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-sm">
                  {debouncedSearch
                    ? t`No repositories found matching your search.`
                    : t`No repositories available.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredRepos.map((repo: GitHubRepository, index: number) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  >
                    <div
                      className={cn(
                        'border-border bg-card hover:border-primary group relative flex items-start gap-4 rounded-lg border p-4 transition-all hover:shadow-md'
                      )}
                    >
                      {/* Repository Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{repo.full_name}</h4>
                          {repo.private && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <LockKeyIcon size={12} />
                              {t`Private`}
                            </Badge>
                          )}
                          {repo.language && (
                            <Badge variant="secondary" className="text-xs">
                              {repo.language}
                            </Badge>
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {repo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <StarIcon size={14} weight="fill" className="text-yellow-500" />
                            <span>{repo.stargazers_count.toLocaleString()}</span>
                          </div>
                          {repo.topics && repo.topics.length > 0 && (
                            <div className="flex gap-1">
                              {repo.topics.slice(0, 3).map((topic) => (
                                <Badge key={topic} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                              {repo.topics.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{repo.topics.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connect Button */}
                      <Button
                        size="sm"
                        onClick={() => handleConnect(repo)}
                        disabled={connectGitHubRepository.isPending}
                        className="shrink-0"
                      >
                        {connectGitHubRepository.isPending ? (
                          <>
                            <SpinnerGapIcon size={16} className="mr-2 animate-spin" />
                            {t`Connecting...`}
                          </>
                        ) : (
                          t`Connect`
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
