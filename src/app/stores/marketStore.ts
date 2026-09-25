import { create } from 'zustand';

export interface LiveQuote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  high: number;
  low: number;
  lastUpdated: Date;
  flash?: 'up' | 'down' | null;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
}

export interface DomainHealth {
  market: CircuitBreakerState;
  crypto: CircuitBreakerState;
  intel: CircuitBreakerState;
  news: CircuitBreakerState;
  commodities: CircuitBreakerState;
  forex: CircuitBreakerState;
}

const defaultCB = (): CircuitBreakerState => ({
  state: 'closed', failures: 0, lastFailure: null, lastSuccess: new Date(),
});

interface MarketStoreState {
  quotes: Record<string, LiveQuote>;
  domainHealth: DomainHealth;
  lastGlobalRefresh: Date | null;
  // Actions
  updateQuote: (ticker: string, data: Partial<LiveQuote>) => void;
  setQuotes: (quotes: Record<string, LiveQuote>) => void;
  recordSuccess: (domain: keyof DomainHealth) => void;
  recordFailure: (domain: keyof DomainHealth) => void;
  setGlobalRefreshed: () => void;
}

export const useMarketStore = create<MarketStoreState>((set) => ({
  quotes: {},
  domainHealth: {
    market: defaultCB(),
    crypto: defaultCB(),
    intel: defaultCB(),
    news: defaultCB(),
    commodities: defaultCB(),
    forex: defaultCB(),
  },
  lastGlobalRefresh: null,

  updateQuote: (ticker, data) =>
    set((state) => ({
      quotes: {
        ...state.quotes,
        [ticker]: {
          ...state.quotes[ticker],
          ...data,
          lastUpdated: new Date(),
        } as LiveQuote,
      },
    })),

  setQuotes: (quotes) => set({ quotes }),

  recordSuccess: (domain) =>
    set((state) => ({
      domainHealth: {
        ...state.domainHealth,
        [domain]: {
          state: 'closed',
          failures: 0,
          lastFailure: state.domainHealth[domain].lastFailure,
          lastSuccess: new Date(),
        },
      },
    })),

  recordFailure: (domain) =>
    set((state) => {
      const current = state.domainHealth[domain];
      const failures = current.failures + 1;
      const newState = failures >= 5 ? 'open' : 'closed';
      return {
        domainHealth: {
          ...state.domainHealth,
          [domain]: {
            state: newState,
            failures,
            lastFailure: new Date(),
            lastSuccess: current.lastSuccess,
          },
        },
      };
    }),

  setGlobalRefreshed: () => set({ lastGlobalRefresh: new Date() }),
}));
