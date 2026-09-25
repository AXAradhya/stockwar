import { create } from 'zustand';

export interface WorkspaceState {
  activeWorkspaceId: string | null;
  openWorkspaces: Array<{
    id: string;
    type: 'stock' | 'sector';
    symbol: string;
    title: string;
  }>;
  openWorkspace: (type: 'stock' | 'sector', symbol: string, title?: string) => void;
  closeWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  openWorkspaces: [],

  openWorkspace: (type, symbol, title) => set((state) => {
    const id = `${type}-${symbol}`;
    const existing = state.openWorkspaces.find(w => w.id === id);
    if (existing) {
      return { activeWorkspaceId: id };
    }
    return {
      openWorkspaces: [...state.openWorkspaces, { id, type, symbol, title: title || symbol }],
      activeWorkspaceId: id
    };
  }),

  closeWorkspace: (id) => set((state) => {
    const nextWorkspaces = state.openWorkspaces.filter(w => w.id !== id);
    let nextActive = state.activeWorkspaceId;
    if (state.activeWorkspaceId === id) {
      nextActive = nextWorkspaces.length > 0 ? nextWorkspaces[nextWorkspaces.length - 1].id : null;
    }
    return {
      openWorkspaces: nextWorkspaces,
      activeWorkspaceId: nextActive
    };
  }),

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id })
}));
