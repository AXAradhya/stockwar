/// <reference types="vite/client" />

declare module '*.css';
declare module 'react-grid-layout/css/styles.css';
declare module 'react-resizable/css/styles.css';

interface ImportMetaEnv {
  readonly VITE_API_PROXY_URL?: string;
  readonly VITE_ALLOW_PUBLIC_PROXIES?: string;
  readonly VITE_DEV_ALLOW_FALLBACKS?: string;
  readonly VITE_API_PROXY_PREFIX?: string;
  readonly VITE_FINNHUB_API_KEY?: string;
  readonly VITE_NEWSAPI_KEY?: string;
  readonly VITE_FRED_API_KEY?: string;
  readonly VITE_EIA_API_KEY?: string;
  readonly VITE_OPENROUTER_KEY?: string;
  readonly VITE_DEFAULT_THEME?: string;
  readonly VITE_DEFAULT_AI_MODEL?: string;
  readonly VITE_DEFAULT_CHART_PANEL_LIMIT?: string;
  readonly VITE_GEMINI_KEY?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
