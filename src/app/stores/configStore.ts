/**
 * configStore.ts — Terminal API key configuration
 * Supports multiple OpenRouter keys with task routing, Gemini, and all data providers.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logToTerminal } from '../stores/logStore';

export interface OpenRouterKey {
  id: string;
  label: string;
  value: string;
  status: 'active' | 'inactive';
  lastTested: number | null;
}

interface ConfigState {
  apiKeys: {
    finnhub: string;
    newsApi: string;
    openRouter: string;
    fred: string;
    eia: string;
  };
  setApiKey: (service: keyof ConfigState['apiKeys'], key: string) => void;
  initFromEnv: () => void;

  // Multiple OpenRouter keys with task routing
  openRouterKeys: OpenRouterKey[];
  addOpenRouterKey: (label: string, value: string) => void;
  removeOpenRouterKey: (id: string) => void;
  updateOpenRouterKey: (id: string, partial: Partial<OpenRouterKey>) => void;
  setOpenRouterKeyStatus: (id: string, status: OpenRouterKey['status']) => void;
  taskRouting: Record<string, string>;
  setTaskRouting: (routing: Record<string, string>) => void;

  // Gemini fallback
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  geminiEnabled: boolean;
  setGeminiEnabled: (enabled: boolean) => void;
}

function makeId() {
  return `key-${Date.now()}-${Math.floor(Date.now() / 1000)}`;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      apiKeys: {
        finnhub: '',
        newsApi: '',
        openRouter: '',
        fred: '',
        eia: '',
      },
      setApiKey: (service, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [service]: key },
        })),

      // OpenRouter multi-key management
      openRouterKeys: [],
      addOpenRouterKey: (label, value) =>
        set((state) => ({
          openRouterKeys: [
            ...state.openRouterKeys,
            { id: makeId(), label, value, status: 'active', lastTested: null },
          ],
        })),
      removeOpenRouterKey: (id) =>
        set((state) => ({
          openRouterKeys: state.openRouterKeys.filter((k) => k.id !== id),
        })),
      updateOpenRouterKey: (id, partial) =>
        set((state) => ({
          openRouterKeys: state.openRouterKeys.map((k) =>
            k.id === id ? { ...k, ...partial } : k
          ),
        })),
      setOpenRouterKeyStatus: (id, status) =>
        set((state) => ({
          openRouterKeys: state.openRouterKeys.map((k) =>
            k.id === id ? { ...k, status } : k
          ),
        })),

      // Task-based API routing
      taskRouting: {},
      setTaskRouting: (routing) =>
        set((state) => ({
          taskRouting: { ...state.taskRouting, ...routing },
        })),

      // Gemini configuration
      geminiKey: '',
      setGeminiKey: (key) => set({ geminiKey: key }),
      geminiEnabled: false,
      setGeminiEnabled: (enabled) => set({ geminiEnabled: enabled }),

      initFromEnv: () => {
        const current = get();
        
        // Merge env-provided API keys (check both _API_KEY and _KEY variants)
        const envKeys = {
          finnhub: (import.meta.env.VITE_FINNHUB_API_KEY as string) || (import.meta.env.VITE_FINNHUB_KEY as string) || '',
          newsApi: (import.meta.env.VITE_NEWSAPI_KEY as string) || (import.meta.env.VITE_NEWS_API_KEY as string) || '',
          fred: (import.meta.env.VITE_FRED_API_KEY as string) || (import.meta.env.VITE_FRED_KEY as string) || '',
          eia: (import.meta.env.VITE_EIA_API_KEY as string) || (import.meta.env.VITE_EIA_KEY as string) || '',
        };
        const merged = { ...current.apiKeys };
        (Object.keys(envKeys) as Array<keyof typeof envKeys>).forEach((k) => {
          if (!current.apiKeys[k] && envKeys[k]) merged[k] = envKeys[k];
        });
        set({ apiKeys: merged });

        // Startup validation: warn if important API keys are missing and no proxy is configured.
        const proxyConfigured = Boolean(import.meta.env.VITE_API_PROXY_URL);
        const allowPublic = (import.meta.env.VITE_ALLOW_PUBLIC_PROXIES as string) === '1';
        if (!proxyConfigured && !allowPublic) {
          if (!merged.finnhub) logToTerminal('ERROR', 'Config:init', 'Missing Finnhub API key and no API proxy configured. Add VITE_FINNHUB_API_KEY or configure VITE_API_PROXY_URL.');
          if (!merged.newsApi) logToTerminal('WARN', 'Config:init', 'NewsAPI key missing and no API proxy configured; live news will be empty.');
          if (!merged.fred) logToTerminal('WARN', 'Config:init', 'FRED API key missing and no API proxy configured; macro data may be incomplete.');
        }

        // Seed OpenRouter from env if no keys configured yet
        const envOrKey = (import.meta.env.VITE_OPENROUTER_KEY as string) || (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '';
        if (envOrKey) {
          const keys = envOrKey.split(',').map(s => s.trim()).filter(Boolean);
          if (keys.length > 0 && current.openRouterKeys.length === 0) {
            set({
              openRouterKeys: keys.map((k, i) => ({ id: makeId(), label: `env-${i+1}`, value: k, status: 'active', lastTested: null })),
            });
          }
        }

        const envGemini = (import.meta.env.VITE_GEMINI_KEY as string) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
        if (envGemini && !current.geminiKey) {
          set({ geminiKey: envGemini, geminiEnabled: true });
        }
      },
    }),
    {
      name: 'stockwar-config-v2',
      onRehydrateStorage: () => (state) => {
        if (state) state.initFromEnv();
      },
    }
  )
);
