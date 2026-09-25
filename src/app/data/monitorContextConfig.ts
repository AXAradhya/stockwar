/**
 * Monitor context → default panel set mapping
 * Each context provides the ideal panel set for that trading focus.
 */

export type MonitorContext = 'FINANCE' | 'TECH' | 'WORLD' | 'COMMODITIES' | 'INDIA';

export const CONTEXT_PANEL_SETS: Record<MonitorContext, string[]> = {
  FINANCE: [
    'markets_overview',
    'sector_heatmap',
    'fear_greed',
    'yield_curve',
    'forex',
    'economic_cal',
    'earnings_cal',
    'macro_indicators',
    'gold_silver',
    'global_bonds',
    'dxy_currency',
    'macro_regime',
    'live_news',
    'options_flow',
    'ipo_pipeline',
    'central_bank_watch',
    'world_clock',
    'cross_source_signals',
  ],
  TECH: [
    'markets_overview',
    'ai_insights',
    'github_trending',
    'service_status',
    'social_velocity',
    'layoffs',
    'options_flow',
    'ipo_pipeline',
    'sector_heatmap',
    'earnings_cal',
    'live_news',
    'cybersecurity',
    'cross_source_signals',
  ],
  WORLD: [
    'armed_conflicts',
    'geopolitical_hubs',
    'israel_sirens',
    'intel_feed',
    'pentagon_pizza',
    'aviation_tracker',
    'maritime_tracker',
    'sanctions',
    'live_news',
    'energy_complex',
    'gold_silver',
    'cybersecurity',
    'cross_source_signals',
    'world_clock',
  ],
  COMMODITIES: [
    'energy_complex',
    'gold_silver',
    'commodities_dashboard',
    'dxy_currency',
    'forex',
    'maritime_tracker',
    'sanctions',
    'macro_regime',
    'global_bonds',
    'markets_overview',
    'central_bank_watch',
    'world_clock',
  ],
  INDIA: [
    'india_bse_nse',        // Dedicated BSE/NSE deep dive — FIRST, most important
    'india_markets',        // IndiaMarketsPanel (indices + stocks + macro)
    'india_news',           // Indian news (NDTV, ET, LiveMint, PIB)
    'live_news_youtube',    // Live YouTube news (NDTV/Republic/TimesNow)
    'live_globe',           // Globe centered on India
    'forex',                // USD/INR & USDINR pairs highlighted
    'gold_silver',          // India gold market (major cultural asset)
    'crypto',               // Crypto in India
    'ipo_pipeline',         // Indian IPOs
    'world_clock',          // IST prominent
    'central_bank_watch',   // RBI & G10 central banks
    'military_tracker',     // India defense / LAC / regional security
  ],
};

export const CONTEXT_DESCRIPTIONS: Record<MonitorContext, string> = {
  FINANCE: 'Stock markets, economic data, bonds, derivatives',
  TECH: 'AI, semiconductors, startups, developer activity',
  WORLD: 'Geopolitics, conflicts, diplomacy, military intelligence',
  COMMODITIES: 'Energy, metals, agriculture, supply chains',
  INDIA: 'Nifty50, Sensex, INR, RBI policy, IPO pipeline, India macro',
};

export const CONTEXT_COLORS: Record<MonitorContext, string> = {
  FINANCE: '#00ff88',
  TECH: '#00ccff',
  WORLD: '#ff3355',
  COMMODITIES: '#ffaa00',
  INDIA: '#FF9933',
};

export const CONTEXT_FLAGS: Record<MonitorContext, string> = {
  FINANCE: '💹',
  TECH: '💻',
  WORLD: '🌐',
  COMMODITIES: '⛽',
  INDIA: '🇮🇳',
};