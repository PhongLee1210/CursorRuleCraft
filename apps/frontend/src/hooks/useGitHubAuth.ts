import { useRepositoryService } from '@frontend/hooks/useRepositoryService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for GitHub OAuth integration
 *
 * @example
 * ```tsx
 * function GitHubConnect() {
 *   const { status, isConnected, connectGitHub, disconnectGitHub, isLoading } = useGitHubAuth();
 *
 *   if (isConnected) {
 *     return (
 *       <div>
 *         Connected as {status?.username}
 *         <button onClick={() => disconnectGitHub.mutate()}>Disconnect</button>
 *       </div>
 *     );
 *   }
 *
 *   return <button onClick={connectGitHub}>Connect GitHub</button>;
 * }
 * ```
 */
export function useGitHubAuth() {
  const repositoryService = useRepositoryService();
  const queryClient = useQueryClient();

  // Query GitHub connection status
  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['github', 'status'],
    queryFn: async () => {
      const result = await repositoryService.getGitHubStatus();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Mutation for disconnecting GitHub
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const result = await repositoryService.disconnectGitHub();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate and refetch GitHub status
      queryClient.invalidateQueries({ queryKey: ['github', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['github', 'repositories'] });
    },
  });

  // Function to initiate GitHub OAuth flow
  const connectGitHub = useCallback(async () => {
    try {
      // Make an authenticated request to get the authorization URL
      const result = await repositoryService.initiateGitHubAuth();
      if (result.error || !result.data) {
        console.error('Failed to initiate GitHub auth:', result.error);
        return;
      }

      const authUrl = result.data.authUrl;

      // Open in a popup window for better UX
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'GitHub Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for popup close or message
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          // Refetch GitHub status after popup closes
          queryClient.invalidateQueries({ queryKey: ['github', 'status'] });
        }
      }, 500);

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'github-oauth-success') {
          clearInterval(pollTimer);
          popup?.close();
          queryClient.invalidateQueries({ queryKey: ['github', 'status'] });
          window.removeEventListener('message', messageHandler);
        } else if (event.data.type === 'github-oauth-error') {
          clearInterval(pollTimer);
          console.error('GitHub OAuth error:', event.data.message);
          window.removeEventListener('message', messageHandler);
        }
      };

      window.addEventListener('message', messageHandler);

      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('message', messageHandler);
      };
    } catch (error) {
      console.error('Failed to connect GitHub:', error);
    }
  }, [queryClient, repositoryService]);

  return {
    status: status || null,
    isConnected: status?.connected ?? false,
    isLoading,
    error,
    connectGitHub,
    disconnectGitHub: disconnectMutation,
  };
}
