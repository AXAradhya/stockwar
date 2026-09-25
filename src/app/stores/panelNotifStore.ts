import { create } from 'zustand';

export interface PanelBadge {
  panelId: string;
  count: number;
  severity: 'info' | 'warning' | 'critical';
  lastMessage: string;
}

interface PanelNotifStoreState {
  badges: Record<string, PanelBadge>;
  // Actions
  setPanelBadge: (panelId: string, badge: Omit<PanelBadge, 'panelId'>) => void;
  clearPanelBadge: (panelId: string) => void;
  incrementBadge: (panelId: string, severity: PanelBadge['severity'], message: string) => void;
}

// Start with no pre-seeded badges (production-safe)
const INITIAL_BADGES: Record<string, PanelBadge> = {};

export const usePanelNotifStore = create<PanelNotifStoreState>((set) => ({
  badges: INITIAL_BADGES,

  setPanelBadge: (panelId, badge) =>
    set((state) => ({
      badges: { ...state.badges, [panelId]: { ...badge, panelId } },
    })),

  clearPanelBadge: (panelId) =>
    set((state) => {
      const next = { ...state.badges };
      delete next[panelId];
      return { badges: next };
    }),

  incrementBadge: (panelId, severity, message) =>
    set((state) => {
      const existing = state.badges[panelId];
      return {
        badges: {
          ...state.badges,
          [panelId]: {
            panelId,
            count: (existing?.count || 0) + 1,
            severity,
            lastMessage: message,
          },
        },
      };
    }),
}));
