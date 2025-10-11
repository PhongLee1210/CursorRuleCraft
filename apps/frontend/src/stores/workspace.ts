import type { Workspace } from '@/types/workspace';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type WorkspaceInitError = {
  type: 'fetch_failed' | 'server_error';
  message: string;
  statusCode?: number;
  retryable: boolean;
};

interface WorkspaceState {
  // Current active workspace
  currentWorkspace: Workspace | null;

  // All workspaces available to the user
  workspaces: Workspace[];

  // Loading state (for general operations)
  isLoading: boolean;

  // Initialization state (for workspace setup)
  isInitializing: boolean;

  // Initialization error
  initError: WorkspaceInitError | null;

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (workspaceId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setInitializing: (isInitializing: boolean) => void;
  setInitError: (error: WorkspaceInitError | null) => void;
  reset: () => void;
}

const initialState = {
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  isInitializing: false,
  initError: null,
};

/**
 * Workspace store with persistence
 * Persists the current workspace selection to localStorage
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentWorkspace: (workspace) => {
        set({ currentWorkspace: workspace });
      },

      setWorkspaces: (workspaces) => {
        set({ workspaces });
        // If there's no current workspace, set the first one as current
        set((state) => {
          if (!state.currentWorkspace && workspaces.length > 0) {
            return { currentWorkspace: workspaces[0] };
          }
          return state;
        });
      },

      addWorkspace: (workspace) => {
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        }));
        // If this is the first workspace, set it as current
        set((state) => {
          if (!state.currentWorkspace) {
            return { currentWorkspace: workspace };
          }
          return state;
        });
      },

      updateWorkspace: (workspaceId, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, ...updates } : w
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspaceId
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        }));
      },

      removeWorkspace: (workspaceId) => {
        set((state) => {
          const filteredWorkspaces = state.workspaces.filter((w) => w.id !== workspaceId);
          const newCurrentWorkspace =
            state.currentWorkspace?.id === workspaceId
              ? filteredWorkspaces[0] || null
              : state.currentWorkspace;

          return {
            workspaces: filteredWorkspaces,
            currentWorkspace: newCurrentWorkspace,
          };
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setInitializing: (isInitializing) => {
        set({ isInitializing });
      },

      setInitError: (error) => {
        set({ initError: error });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'workspace-storage', // name of the item in localStorage
      partialize: (state) => ({
        // Only persist the current workspace ID
        currentWorkspaceId: state.currentWorkspace?.id,
      }),
    }
  )
);
