export const MONITOR_CONTEXTS = ['FINANCE', 'TECH', 'WORLD', 'COMMODITIES', 'INDIA'] as const;
export type MonitorContext = typeof MONITOR_CONTEXTS[number];

export const REGIONS = ['GLOBAL', 'AMERICAS', 'EUROPE', 'INDIA'] as const;
export type Region = typeof REGIONS[number];

export const PANEL_CATALOG = [
  // MARKETS
  { id: 'markets_overview', label: 'Markets Overview', shortCode: 'MKT', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'sector_heatmap', label: 'Sector Heatmap', shortCode: 'SECT', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'fear_greed', label: 'Fear & Greed Index', shortCode: 'F&G', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'yield_curve', label: 'Yield Curve', shortCode: 'YLD', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'forex', label: 'Forex & Currencies', shortCode: 'FX', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'earnings_cal', label: 'Earnings Calendar', shortCode: 'EARN', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: false },
  { id: 'economic_cal', label: 'Economic Calendar', shortCode: 'ECAL', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  { id: 'macro_indicators', label: 'Macro Indicators', shortCode: 'MCRO', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: false },
  { id: 'gold_silver', label: 'Gold & Precious Metals', shortCode: 'GOLD', category: 'MARKETS', tier: 'free', contexts: ['COMMODITIES', 'FINANCE'], defaultActive: false },
  // INTELLIGENCE
  { id: 'armed_conflicts', label: 'Armed Conflict Events', shortCode: 'CNFL', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: true },
  { id: 'geopolitical_hubs', label: 'Geopolitical Hubs', shortCode: 'GEO', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: true },
  { id: 'israel_sirens', label: 'Israel Sirens (OREF)', shortCode: 'OREF', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: true },
  { id: 'intel_feed', label: 'Intelligence Feed', shortCode: 'INTL', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: false },
  // TECH
  { id: 'ai_insights', label: 'AI Insights', shortCode: 'AI', category: 'TECHNOLOGY', tier: 'free', contexts: ['TECH'], defaultActive: true },
  { id: 'github_trending', label: 'GitHub Trending', shortCode: 'GH', category: 'TECHNOLOGY', tier: 'free', contexts: ['TECH'], defaultActive: true },
  { id: 'service_status', label: 'Service Status', shortCode: 'SVC', category: 'TECHNOLOGY', tier: 'free', contexts: ['TECH'], defaultActive: false },
  { id: 'layoffs', label: 'Layoffs Tracker', shortCode: 'LOFF', category: 'TECHNOLOGY', tier: 'free', contexts: ['TECH'], defaultActive: false },
  // COMMODITIES
  { id: 'energy_complex', label: 'Energy Complex', shortCode: 'NRG', category: 'COMMODITIES', tier: 'free', contexts: ['COMMODITIES'], defaultActive: true },
  // CRYPTO
  { id: 'crypto', label: 'Crypto Prices', shortCode: 'CRPT', category: 'CRYPTO', tier: 'free', contexts: ['FINANCE'], defaultActive: true },
  // NEWS
  { id: 'live_news', label: 'Live News', shortCode: 'NEWS', category: 'NEWS', tier: 'free', contexts: ['FINANCE', 'WORLD', 'TECH'], defaultActive: true },
  { id: 'social_velocity', label: 'Social Velocity', shortCode: 'SOC', category: 'NEWS', tier: 'free', contexts: ['TECH'], defaultActive: true },
  // NOVELTY (clearly labeled, not real financial data)
  { id: 'pentagon_pizza', label: 'Pentagon Pizza Tracker', shortCode: 'PIZA', category: 'NOVELTY', tier: 'free', contexts: ['WORLD'], defaultActive: false },
  // PHASE 2
  { id: 'options_flow', label: 'Options Flow & Dark Pool', shortCode: 'OPT', category: 'MARKETS', tier: 'pro', contexts: ['FINANCE'], defaultActive: false },
  { id: 'aviation_tracker', label: 'Aviation Tracker', shortCode: 'AVN', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: false },
  { id: 'maritime_tracker', label: 'Maritime Tracker (AIS)', shortCode: 'MAR', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD', 'COMMODITIES'], defaultActive: false },
  { id: 'dxy_currency', label: 'DXY & Currency Basket', shortCode: 'DXY', category: 'MARKETS', tier: 'free', contexts: ['FINANCE', 'COMMODITIES'], defaultActive: false },
  { id: 'global_bonds', label: 'Global Bond Yields', shortCode: 'BOND', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: false },
  { id: 'macro_regime', label: 'Macro Regime Detector', shortCode: 'RGM', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: false },
  { id: 'ipo_pipeline', label: 'IPO Pipeline & SPACs', shortCode: 'IPO', category: 'MARKETS', tier: 'free', contexts: ['FINANCE'], defaultActive: false },
  { id: 'sanctions', label: 'Sanctions & Export Controls', shortCode: 'SANC', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD', 'FINANCE'], defaultActive: false },
  { id: 'commodities_dashboard', label: 'Commodities Dashboard', shortCode: 'CMD', category: 'COMMODITIES', tier: 'free', contexts: ['COMMODITIES'], defaultActive: false },
  { id: 'congressional_trading', label: 'Congressional Trading', shortCode: 'CONG', category: 'MARKETS', tier: 'pro', contexts: ['FINANCE'], defaultActive: false },
  // PHASE 3
  { id: 'world_clock', label: 'World Market Clock', shortCode: 'CLK', category: 'MARKETS', tier: 'free', contexts: ['FINANCE', 'COMMODITIES', 'INDIA'], defaultActive: false },
  { id: 'central_bank_watch', label: 'Central Bank Watch', shortCode: 'CBW', category: 'MARKETS', tier: 'free', contexts: ['FINANCE', 'INDIA'], defaultActive: false },
  { id: 'cybersecurity', label: 'Cybersecurity Threats', shortCode: 'CYBR', category: 'TECHNOLOGY', tier: 'free', contexts: ['TECH', 'WORLD'], defaultActive: false },
  { id: 'cross_source_signals', label: 'Cross-Source Signals (AI)', shortCode: 'XSIG', category: 'INTELLIGENCE', tier: 'pro', contexts: ['FINANCE', 'WORLD'], defaultActive: false },
  { id: 'india_markets', label: 'India Markets (NIFTY/BSE)', shortCode: 'IND', category: 'MARKETS', tier: 'free', contexts: ['INDIA'], defaultActive: false },
  // PHASE 4
  { id: 'live_globe', label: 'Live Globe', shortCode: 'GLOBE', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: false },
  { id: 'military_tracker', label: 'Military Tracker', shortCode: 'MIL', category: 'INTELLIGENCE', tier: 'free', contexts: ['WORLD'], defaultActive: false },
  { id: 'india_news', label: 'India Intelligence Hub', shortCode: 'INEWS', category: 'NEWS', tier: 'free', contexts: ['INDIA'], defaultActive: false },
  { id: 'india_bse_nse', label: 'BSE / NSE Live', shortCode: 'BSE', category: 'MARKETS', tier: 'free', contexts: ['INDIA'], defaultActive: false },
  { id: 'live_news_youtube', label: 'Live News (YouTube)', shortCode: 'LIVTV', category: 'NEWS', tier: 'free', contexts: ['WORLD', 'INDIA'], defaultActive: false },
  // TradingView chart panel (multiple instances supported)
  { id: 'tradingview_chart', label: 'TradingView Chart', shortCode: 'TV', category: 'MARKETS', tier: 'free', contexts: ['FINANCE', 'TECH'], defaultActive: false },
] as const;
