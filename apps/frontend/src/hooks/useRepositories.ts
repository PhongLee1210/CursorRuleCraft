import { useRepositoryService } from '@frontend/hooks/useRepositoryService';
import { useWorkspaceStore } from '@frontend/stores/workspace';
import type { Repository } from '@frontend/types/repository';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for managing repositories
 *
 * @example
 * ```tsx
 * function RepositoriesList() {
 *   const { repositories, isLoading, syncRepository, deleteRepository } = useRepositories();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {repositories?.map((repo) => (
 *         <div key={repo.id}>
 *           {repo.name}
 *           <button onClick={() => syncRepository.mutate(repo.id)}>Sync</button>
 *           <button onClick={() => deleteRepository.mutate(repo.id)}>Delete</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRepositories() {
  const repositoryService = useRepositoryService();
  const queryClient = useQueryClient();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  // Query repositories for current workspace
  const {
    data: repositories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['repositories', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      const result = await repositoryService.getWorkspaceRepositories(workspaceId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for syncing a repository
  const syncRepositoryMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const result = await repositoryService.syncRepository(repositoryId);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update the repository in the cache
      queryClient.setQueryData<Repository[]>(['repositories', workspaceId], (old) => {
        if (!old) return old;
        return old.map((repo) => (repo.id === data?.id ? data : repo));
      });
    },
  });

  // Mutation for deleting a repository
  const deleteRepositoryMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const result = await repositoryService.deleteRepository(repositoryId);
      if (result.error) {
        throw result.error;
      }
      return repositoryId;
    },
    onSuccess: (deletedId) => {
      // Remove the repository from the cache
      queryClient.setQueryData<Repository[]>(['repositories', workspaceId], (old) => {
        if (!old) return old;
        return old.filter((repo) => repo.id !== deletedId);
      });
    },
  });

  // Mutation for connecting a GitHub repository
  const connectGitHubRepositoryMutation = useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      if (!workspaceId) {
        throw new Error('No workspace selected');
      }

      const result = await repositoryService.connectGitHubRepository(workspaceId, owner, repo);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Add the new repository to the cache
      queryClient.setQueryData<Repository[]>(['repositories', workspaceId], (old) => {
        if (!old) return [data!];
        return [...old, data!];
      });
    },
  });

  return {
    repositories: repositories ?? [],
    isLoading,
    error,
    syncRepository: syncRepositoryMutation,
    deleteRepository: deleteRepositoryMutation,
    connectGitHubRepository: connectGitHubRepositoryMutation,
  };
}

/**
 * Hook for fetching available GitHub repositories
 *
 * @param page - Page number for pagination (default: 1)
 * @param perPage - Number of repositories per page (default: 30)
 * @param enabled - Whether to fetch repositories (default: true). Set to false to prevent fetching.
 *
 * @example
 * ```tsx
 * function GitHubRepoSelector({ isOpen }) {
 *   const { repositories, isLoading, requiresReconnect } = useGitHubRepositories(1, 30, isOpen);
 *
 *   return (
 *     <div>
 *       {repositories?.map((repo) => (
 *         <div key={repo.id}>{repo.full_name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGitHubRepositories(page = 1, perPage = 30, enabled = true) {
  const repositoryService = useRepositoryService();

  const { data, isLoading, error } = useQuery({
    queryKey: ['github', 'repositories', page, perPage],
    queryFn: async () => {
      const result = await repositoryService.getAvailableGitHubRepositories(page, perPage);
      if (result.error) {
        throw result.error;
      }
      return {
        repositories: result.data ?? [],
        requiresSetup: result.requiresSetup ?? false,
        requiresReconnect: result.requiresReconnect ?? false,
        message: result.message,
      };
    },
    enabled, // Only fetch when enabled is true
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    repositories: data?.repositories ?? [],
    requiresSetup: data?.requiresSetup ?? false,
    requiresReconnect: data?.requiresReconnect ?? false,
    message: data?.message,
    isLoading,
    error,
  };
}
