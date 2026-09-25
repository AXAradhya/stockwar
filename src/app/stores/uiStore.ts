import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonitorContext, Region } from '../data/catalog';

export interface UiSettings {
	theme: string;
	compactMode: boolean;
	showPanelBorders: boolean;
	autoGenerateBrief: boolean;
	aiModel: string;
	openrouterApiKey?: string;

	// Limit for how many TradingView chart panels a user can add
	chartPanelLimit?: number;

	// UI toggles used in Settings
	scanlines?: boolean;
	showTimestamps?: boolean;
	panelAnimations?: boolean;
	refreshTier?: 'T1' | 'T2' | 'T3';
}

interface UiState {
	monitorContext: MonitorContext;
	setMonitorContext: (c: MonitorContext) => void;
	region: Region;
	setRegion: (r: Region) => void;
	sidebarCollapsed: boolean;
	setSidebarCollapsed: (v: boolean) => void;
	settings: UiSettings;
	updateSettings: (patch: Partial<UiSettings>) => void;
	toggleLayoutLock: () => void;
	toggleGridLines: () => void;
	gridLinesVisible: boolean;
	setGridLinesVisible: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
	persist(
		(set, get) => ({
			monitorContext: 'FINANCE',
			setMonitorContext: (c: MonitorContext) => set({ monitorContext: c }),

			region: 'GLOBAL',
			setRegion: (r: Region) => set({ region: r }),

			sidebarCollapsed: false,
			setSidebarCollapsed: (v: boolean) => set({ sidebarCollapsed: v }),

			settings: {
				theme: (import.meta.env.VITE_DEFAULT_THEME as any) || 'terminal-dark',
				compactMode: false,
				showPanelBorders: true,
				autoGenerateBrief: false,
				aiModel: (import.meta.env.VITE_DEFAULT_AI_MODEL as any) || 'meta-llama/llama-3.3-8b-instruct:free',
				openrouterApiKey: import.meta.env.VITE_OPENROUTER_KEY || '',
				chartPanelLimit: Number(import.meta.env.VITE_DEFAULT_CHART_PANEL_LIMIT) || 4,
				scanlines: false,
				showTimestamps: true,
				panelAnimations: true,
				refreshTier: 'T2',
			},

			updateSettings: (patch: Partial<UiSettings>) => set((state) => ({ settings: { ...state.settings, ...patch } })),

			toggleLayoutLock: () => {
				// Layout lock not implemented fully yet — placeholder for UI hook
				set((s) => ({ settings: { ...s.settings, compactMode: !s.settings.compactMode } }));
			},

				toggleGridLines: () => {
					set((s) => ({ gridLinesVisible: !s.gridLinesVisible }));
				},

				gridLinesVisible: false,
				setGridLinesVisible: (v: boolean) => set({ gridLinesVisible: v }),
		}),
		{
			name: 'stockwar-ui-v1',
			// Hydrate without special onRehydrate
		}
	)
);

// Simple theme applicator used by App.tsx
export function applyTheme(theme: string) {
	try {
		// Normalize theme to either dark or light classes for legacy codepaths
		const isDark = typeof theme === 'string' && theme.toLowerCase().includes('dark');
		document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
		if (isDark) {
			document.body.classList.add('theme-dark');
			document.body.classList.remove('theme-light');
		} else {
			document.body.classList.add('theme-light');
			document.body.classList.remove('theme-dark');
		}
	} catch (e) {
		// ignore on SSR or missing DOM
	}
}

export default useUiStore;
