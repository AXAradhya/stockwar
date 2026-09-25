import { useState, useEffect, useCallback, useRef } from 'react';
import { logToTerminal } from '../stores/logStore';

export type PanelStatus = 'loading' | 'fresh' | 'stale' | 'error' | 'no_key';

const TIER_INTERVALS: Record<string, number> = {
  T1: 15_000,
  T2: 60_000,
  T3: 300_000,
  T4: 900_000,
};

// Retry configuration
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000; // 1 second

interface UsePanelRefreshOptions {
  panelId: string;
  fetchFn: () => Promise<any>;
  refreshTier?: keyof typeof TIER_INTERVALS;
  manualRefreshRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

interface UsePanelRefreshResult<T> {
  data: T | null;
  status: PanelStatus;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function usePanelRefresh<T = any>({
  panelId,
  fetchFn,
  refreshTier = 'T2',
  manualRefreshRef,
}: UsePanelRefreshOptions): UsePanelRefreshResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<PanelStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus(data ? 'stale' : 'loading');
    setError(null);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await fetchFn();
        if (!mountedRef.current) return;
        setData(result);
        setStatus('fresh');
        // notify UI that panel is healthy
        try { window.dispatchEvent(new CustomEvent('stockwar:panelStatus', { detail: { panelId, status: 'fresh' } })); } catch (e) {}
        setLastUpdated(new Date());
        logToTerminal('INFO', `Panel:${panelId}`, 'Data refreshed successfully');
        return; // Success — exit retry loop
      } catch (e: any) {
        if (!mountedRef.current) return;
        const msg: string = e?.message || 'Unknown error';

        // Retry with exponential backoff if not the last attempt
        if (attempt < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
          logToTerminal('WARN', `Panel:${panelId}`, `Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Last attempt failed — set final error state
        setError(msg);
        const lc = msg.toLowerCase();
        const looksLikeKeyIssue = lc.includes('api key') || lc.includes('not configured') || lc.includes('key not') || lc.includes('not provided') || (lc.includes('add') && lc.includes('key')) || (lc.includes('no') && lc.includes('key'));
        if (looksLikeKeyIssue) {
          setStatus('no_key');
          try { window.dispatchEvent(new CustomEvent('stockwar:panelStatus', { detail: { panelId, status: 'no_key', error: msg } })); } catch (e) {}
        } else {
          setStatus('error');
          try { window.dispatchEvent(new CustomEvent('stockwar:panelStatus', { detail: { panelId, status: 'error', error: msg } })); } catch (e) {}
        }
        logToTerminal('ERROR', `Panel:${panelId}`, msg, e?.stack);
      }
    }
  }, [fetchFn, panelId]);

  // Expose refresh to parent via ref (for PanelWrapper's Refresh button)
  useEffect(() => {
    if (manualRefreshRef) manualRefreshRef.current = refresh;
  }, [refresh, manualRefreshRef]);

  // Listen for global refresh events targeting this panel
  useEffect(() => {
    const handler = (e: CustomEvent<{ panelId?: string }>) => {
      if (!e.detail?.panelId || e.detail.panelId === panelId) {
        refresh();
      }
    };
    window.addEventListener('stockwar:refreshPanel', handler as EventListener);
    return () => window.removeEventListener('stockwar:refreshPanel', handler as EventListener);
  }, [refresh, panelId]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    const interval = TIER_INTERVALS[refreshTier] ?? TIER_INTERVALS.T2;
    const t = setInterval(refresh, interval);
    return () => clearInterval(t);
  }, [refresh, refreshTier]);

  return { data, status, error, lastUpdated, refresh };
}
