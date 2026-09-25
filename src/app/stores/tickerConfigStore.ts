/**
 * tickerConfigStore.ts — Configurable ticker lists
 * All market data tickers are stored here, editable by the user.
 * No hardcoded tickers should exist in any panel or service file —
 * they should all read from this store.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TickerConfig {
  // US Indices
  usIndices: string[];
  usIndicesNames: Record<string, string>;
  // Indian Indices
  indiaIndices: string[];
  indiaIndicesNames: Record<string, string>;
  // European Indices
  europeIndices: string[];
  europeIndicesNames: Record<string, string>;
  // US Sector ETFs
  sectorEtfs: string[];
  sectorEtfNames: Record<string, string>;
  // Sector constituents mapping (sector ETF -> top constituent tickers)
  sectorConstituents: Record<string, string[]>;
  // Crypto coins (CoinGecko IDs)
  cryptoCoins: string[];
  // India NSE stock list (Yahoo Finance format: TICKER.NS)
  indiaNseStocks: string[];
  // US Top movers fetch count
  topMoversCount: number;
  // Custom user watchlist
  customWatchlist: string[];
}

const DEFAULT_CONFIG: TickerConfig = {
  usIndices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
  usIndicesNames: {
    SPY: 'S&P 500',
    QQQ: 'NASDAQ 100',
    DIA: 'DOW JONES',
    IWM: 'RUSSELL 2K',
    VIX: 'VIX',
  },
  indiaIndices: ['^NSEI', '^BSESN', '^NSEBANK', '^NSEIT', '^NSEMDCP50'],
  indiaIndicesNames: {
    '^NSEI': 'NIFTY 50',
    '^BSESN': 'BSE SENSEX',
    '^NSEBANK': 'NIFTY BANK',
    '^NSEIT': 'NIFTY IT',
    '^NSEMDCP50': 'NIFTY MIDCAP 50',
  },
  europeIndices: ['^STOXX50E', '^GDAXI', '^FCHI', '^FTSE'],
  europeIndicesNames: {
    '^STOXX50E': 'EURO STOXX 50',
    '^GDAXI': 'DAX (Germany)',
    '^FCHI': 'CAC 40 (France)',
    '^FTSE': 'FTSE 100 (UK)',
  },
  sectorEtfs: ['XLK', 'XLV', 'XLF', 'XLE', 'XLY', 'XLI', 'XLC', 'XLP', 'XLU', 'XLB'],
  sectorEtfNames: {
    XLK: 'Technology',
    XLV: 'Healthcare',
    XLF: 'Financials',
    XLE: 'Energy',
    XLY: 'Consumer Disc',
    XLI: 'Industrials',
    XLC: 'Comm Services',
    XLP: 'Consumer Staples',
    XLU: 'Utilities',
    XLB: 'Materials',
  },
  sectorConstituents: {
    XLK: ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'META', 'AMD', 'CRM', 'INTC', 'ACN', 'CSCO'],
    XLV: ['JNJ', 'UNH', 'LLY', 'PFE', 'ABT', 'TMO', 'MRK', 'DHR', 'ABBV', 'BMY'],
    XLF: ['BRK.B', 'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SPGI', 'AXP', 'C'],
    XLE: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'VLO', 'PSX', 'WMB', 'OKE'],
    XLY: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'BKNG', 'TJX', 'ABNB', 'CMG'],
    XLI: ['GE', 'CAT', 'RTX', 'HON', 'BA', 'UPS', 'UNP', 'LMT', 'DE', 'WM'],
    XLC: ['META', 'GOOGL', 'NFLX', 'DIS', 'TMUS', 'VZ', 'T', 'CMCSA', 'CHTR', 'EA'],
    XLP: ['PG', 'KO', 'PEP', 'WMT', 'COST', 'MDLZ', 'PM', 'MO', 'GIS', 'KHC'],
    XLU: ['NEE', 'SO', 'DUK', 'AEP', 'SRE', 'EXC', 'D', 'XEL', 'AEE', 'CNP'],
    XLB: ['LIN', 'APD', 'SHW', 'FCX', 'NEM', 'ECL', 'NUE', 'CTVA', 'DOW', 'PPG'],
  },
  cryptoCoins: [
    'bitcoin',
    'ethereum',
    'solana',
    'binancecoin',
    'ripple',
    'dogecoin',
    'cardano',
    'avalanche-2',
  ],
  // Default NIFTY 50 top stocks (Yahoo Finance .NS suffix)
  indiaNseStocks: [
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
    'HDFCBANK.NS',
    'ICICIBANK.NS',
    'HINDUNILVR.NS',
    'BHARTIARTL.NS',
    'SBIN.NS',
    'BAJFINANCE.NS',
    'KOTAKBANK.NS',
    'LT.NS',
    'AXISBANK.NS',
    'HCLTECH.NS',
    'ASIANPAINT.NS',
    'MARUTI.NS',
    'SUNPHARMA.NS',
    'TITAN.NS',
    'ULTRACEMCO.NS',
    'WIPRO.NS',
    'NESTLEIND.NS',
  ],
  topMoversCount: 20,
  customWatchlist: [],
};

interface TickerConfigStore {
  config: TickerConfig;
  setConfig: (partial: Partial<TickerConfig>) => void;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  resetToDefaults: () => void;
  // Quick accessors
  getDisplayName: (ticker: string) => string;
}

export const useTickerConfigStore = create<TickerConfigStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,

      setConfig: (partial) =>
        set((state) => ({ config: { ...state.config, ...partial } })),

      addToWatchlist: (ticker) =>
        set((state) => ({
          config: {
            ...state.config,
            customWatchlist: state.config.customWatchlist.includes(ticker)
              ? state.config.customWatchlist
              : [...state.config.customWatchlist, ticker],
          },
        })),

      removeFromWatchlist: (ticker) =>
        set((state) => ({
          config: {
            ...state.config,
            customWatchlist: state.config.customWatchlist.filter((t) => t !== ticker),
          },
        })),

      resetToDefaults: () => set({ config: DEFAULT_CONFIG }),

      getDisplayName: (ticker: string) => {
        const { config } = get();
        return (
          config.usIndicesNames[ticker] ||
          config.indiaIndicesNames[ticker] ||
          config.europeIndicesNames[ticker] ||
          config.sectorEtfNames[ticker] ||
          ticker
        );
      },
    }),
    {
      name: 'stockwar-ticker-config-v1',
    }
  )
);
