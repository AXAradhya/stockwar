import React from 'react';
import { useConfigStore } from '../../stores/configStore';

interface Props {
  onOpenSettings?: () => void;
}

export function ApiKeysBanner({ onOpenSettings }: Props) {
  const apiKeys = useConfigStore(state => state.apiKeys);
  const openRouterKeys = useConfigStore(state => state.openRouterKeys);
  const proxy = import.meta.env.VITE_API_PROXY_URL || '';

  const missing: string[] = [];
  if (!apiKeys.finnhub && !proxy) missing.push('Finnhub');
  if (!apiKeys.newsApi && !proxy) missing.push('NewsAPI');
  if (!apiKeys.fred && !proxy) missing.push('FRED');

  const hasOpenRouter = Array.isArray(openRouterKeys) && openRouterKeys.length > 0;

  if (missing.length === 0) return null;

  return (
    <div style={{ background: '#1a0f0f', borderBottom: '1px solid #2b1a1a', color: '#f0e6d8', padding: '6px 10px', fontSize: 11, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ color: '#ffd28a', fontWeight: 700, letterSpacing: 1 }}>API KEYS</div>
      <div style={{ color: '#e6e6e6' }}>{missing.join(', ')} missing — add them in Settings or configure a BYOK proxy via VITE_API_PROXY_URL.</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
        {proxy ? <div style={{ color: '#8ff' }}>Proxy: configured</div> : <div style={{ color: '#ff8a8a' }}>Proxy: not configured</div>}
        {hasOpenRouter ? <div style={{ color: '#8ff' }}>OpenRouter keys present</div> : null}
        {onOpenSettings ? (
          <button onClick={onOpenSettings} style={{ background: 'transparent', border: '1px solid #333', color: '#e8e8e8', padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
            Open Settings
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ApiKeysBanner;
