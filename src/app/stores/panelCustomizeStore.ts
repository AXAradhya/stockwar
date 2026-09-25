import { create } from 'zustand';

export interface PanelCustomization {
  accentColor?: string;
  chartType?: 'line' | 'bar' | 'area' | 'candlestick';
  refreshInterval?: number; // seconds
  compactMode?: boolean;
  showVolume?: boolean;
  showChange?: boolean;
  dataSource?: string;
  // chart panels
  chartSymbol?: string;
  // market panels
  selectedIndices?: string[];
  // news panels
  sourceFilter?: string[];
  severityFilter?: string[];
  regionFilter?: string;
  // background tint
  bgTint?: string;
  opacity?: number;
  // LiveNewsYouTube panel
  youtubeChannels?: { name: string; id: string; category: string }[];
  // Pinned state
  isPinned?: boolean;
}

interface PanelCustomizeStore {
  customizations: Record<string, PanelCustomization>;
  setCustomization: (panelId: string, custom: Partial<PanelCustomization>) => void;
  resetCustomization: (panelId: string) => void;
  getCustomization: (panelId: string) => PanelCustomization;
}

const STORAGE_KEY = 'stockwar_panel_custom_v1';

function loadCustomizations(): Record<string, PanelCustomization> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

export const usePanelCustomizeStore = create<PanelCustomizeStore>((set, get) => ({
  customizations: loadCustomizations(),

  setCustomization: (panelId, custom) => {
    set(state => {
      const next = {
        ...state.customizations,
        [panelId]: { ...state.customizations[panelId], ...custom },
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return { customizations: next };
    });
  },

  resetCustomization: (panelId) => {
    set(state => {
      const next = { ...state.customizations };
      delete next[panelId];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return { customizations: next };
    });
  },

  getCustomization: (panelId) => {
    return get().customizations[panelId] || {};
  },
}));
