/**
 * logStore.ts — Terminal-wide logging system
 * Used by panels, API services, and the circuit breaker to surface
 * errors, warnings, and info events in Settings → Logs tab.
 */

import { create } from 'zustand';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string; // e.g. "Panel:MarketsPanel", "API:Finnhub", "CircuitBreaker:finnhub"
  message: string;
  details?: string; // stack trace, raw API response, etc.
}

interface LogStoreState {
  logs: LogEntry[];
  maxLogs: number;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  exportLogs: () => string;
  getErrors: () => LogEntry[];
  getWarnings: () => LogEntry[];
  getPanelErrors: (panelId: string) => LogEntry[];
  getLogsBySource: (source: string) => LogEntry[];
}

let _logIdCounter = 0;

export const useLogStore = create<LogStoreState>((set, get) => ({
  logs: [],
  maxLogs: 1000,

  addLog: (entry) => {
    set((state) => {
      const newEntry: LogEntry = {
        ...entry,
        id: `log-${Date.now()}-${_logIdCounter++}`,
        timestamp: new Date(),
      };
      const logs = [newEntry, ...state.logs];
      // Trim to max
      if (logs.length > state.maxLogs) {
        logs.splice(state.maxLogs);
      }
      return { logs };
    });
  },

  clearLogs: () => set({ logs: [] }),

  exportLogs: () => {
    const { logs } = get();
    const lines = logs.map(
      (l) =>
        `[${l.timestamp.toISOString()}] [${l.level}] [${l.source}] ${l.message}${
          l.details ? '\n  ' + l.details : ''
        }`
    );
    return lines.join('\n');
  },

  getErrors: () => {
    return get().logs.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL');
  },

  getWarnings: () => {
    return get().logs.filter((l) => l.level === 'WARN');
  },

  getPanelErrors: (panelId: string) => {
    const prefix = `Panel:${panelId}`;
    return get().logs.filter(
      (l) => l.source.startsWith(prefix) && (l.level === 'ERROR' || l.level === 'CRITICAL')
    );
  },

  getLogsBySource: (source: string) => {
    return get().logs.filter((l) => l.source.includes(source));
  },
}));

// ─── Global singleton logger — usable outside React components ────────────────
// Used in apiServices.ts, circuitBreaker.ts, etc.

export function logToTerminal(
  level: LogLevel,
  source: string,
  message: string,
  details?: string
) {
  useLogStore.getState().addLog({ level, source, message, details });
  // Also forward to console for devtools visibility
  const consoleFn =
    level === 'ERROR' || level === 'CRITICAL'
      ? console.error
      : level === 'WARN'
      ? console.warn
      : console.log;
  consoleFn(`[${level}] [${source}] ${message}`, details || '');
}
