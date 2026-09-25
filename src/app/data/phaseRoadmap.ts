/**
 * STOCKWAR TERMINAL — 3-PHASE DEVELOPMENT ROADMAP
 * ================================================
 *
 * PHASE 1: Foundation Stability & Panel Excellence  [COMPLETE ✅]
 * ─────────────────────────────────────────────────────────────
 * Goal: Rock-solid foundation, excellent panel UX, live data simulation
 *
 * ✅ 1.1  Fix YieldCurvePanel duplicate key / SVG gradient issue
 * ✅ 1.2  Add sonner toast notification system
 * ✅ 1.3  Add layout persistence to localStorage via PanelGrid
 * ✅ 1.4  Add live market data simulation hook (useLiveData)
 * ✅ 1.5  Enhance ForexPanel — sparklines, spread tracker, DXY
 * ✅ 1.6  Enhance CryptoPanel — mini area charts, dominance bar
 * ✅ 1.7  Enhance EconomicCalendarPanel — live countdown timers
 * ✅ 1.8  Enhance EarningsCalendarPanel — EPS beat/miss bars, expected move
 * ✅ 1.9  Enhance NewsPanel — category tabs, urgency tier coloring
 * ✅ 1.10 Enhance GoldSilverPanel — mini area chart for gold
 * ✅ 1.11 Enhance MacroIndicatorsPanel — trend bars, change indicators
 * ✅ 1.12 Enhance PentagonPizzaPanel — alert flash animation, history chart
 * ✅ 1.13 Enhance SocialVelocityPanel — velocity bars, platform icons
 * ✅ 1.14 Enhance GithubTrendingPanel — language color dots, star trend
 * ✅ 1.15 Enhance LayoffsTrackerPanel — industry breakdown bars
 * ✅ 1.16 Enhance ServiceStatusPanel — latency sparklines, incident detail
 * ✅ 1.17 Add AlertConfigModal — configure price/event alerts per panel
 * ✅ 1.18 Add TickerCorrelationModal — show correlated tickers for any event
 * ✅ 1.19 Improve PanelWrapper — notification badge, alert pulse, context menu refresh
 * ✅ 1.20 Improve LeftSidebar — save layout works (localStorage), preset loads
 * ✅ 1.21 Improve BottomTaskbar — notification badge count, data feed status
 * ✅ 1.22 Improve AIChatModal — richer responses, streaming-style typewriter
 * ✅ 1.23 Add keyboard shortcut on-screen chord indicator
 * ✅ 1.24 Add F5 global refresh with toast feedback
 * ✅ 1.25 Add panel count + tier badge in PanelSearch modal
 *
 * PHASE 2: Intelligence Engine & State Architecture  [COMPLETE ✅]
 * ─────────────────────────────────────────────────────────────
 * Goal: Zustand stores, circuit breakers, advanced alert system, new panels
 *
 * ✅ 2.1  Implement Zustand domain stores (marketStore, alertStore, uiStore, panelNotifStore)
 * ✅ 2.2  Circuit breaker pattern — per-domain data staleness tracking (utils/circuitBreaker.ts)
 * ✅ 2.3  Smart refresh scheduler — viewport-aware panel refresh (hooks/usePanelRefresh.ts)
 * ✅ 2.4  Full alert rule engine — price threshold, event keyword, sentiment (alertStore)
 * ✅ 2.5  Multi-channel alert delivery — in-app banner, toast, bottom taskbar stream
 * ✅ 2.6  Ticker correlation engine — TickerCorrelationModal with co-movement graph
 * ✅ 2.7  Layout save/load from localStorage with named presets (LeftSidebar)
 * ✅ 2.8  Monitor context switcher → loads default panel set per context
 * ✅ 2.9  Full Settings modal — theme, refresh tier, AI model, sound, auto-brief
 * ✅ 2.10 Panel notification badge system from panelNotifStore (PanelWrapper badges)
 * ✅ 2.11 Add 10 new panels:
 *          ✅ Options Flow & Dark Pool (OptionsFlowPanel)
 *          ✅ Aviation Tracker — military + commercial flights (AviationTrackerPanel)
 *          ✅ Maritime Tracker — AIS vessel positions + chokepoints (MaritimeTrackerPanel)
 *          ✅ DXY & Currency Basket (DXYCurrencyPanel)
 *          ✅ Global Bond Yields Comparison (GlobalBondsPanel)
 *          ✅ Macro Regime Detector — recession probability (MacroRegimePanel)
 *          ✅ IPO Pipeline & SPAC Tracker (IPOPipelinePanel)
 *          ✅ Sanctions & Export Control Feed (SanctionsPanel)
 *          ✅ Commodities Dashboard — agriculture, base metals (CommoditiesDashboardPanel)
 *          ✅ Congressional Trading Activity (CongressionalTradingPanel)
 * ✅ 2.12 AI context reads actual live panel data values (alertStore + uiStore integration)
 * ✅ 2.13 AI daily brief auto-generation on startup (App.tsx autoGenerateBrief setting)
 * ✅ 2.14 Keyboard shortcut system with Ctrl+L layout lock, Ctrl+G grid lines
 * ✅ 2.15 Right-click context menu improvements (AI Analyze, AI Generate Brief, Resize presets)
 *
 * PHASE 3: Production Polish & Feature Completeness  [PLANNED]
 * ─────────────────────────────────────────────────────────────
 * Goal: Auth UI, full catalog, performance, export, accessibility
 *
 * ○ 3.1  Authentication UI — Clerk-style login/signup with tier display
 * ○ 3.2  Subscription tier gating — free/pro panel differentiation
 * ○ 3.3  Full 124-panel catalog implementation
 * ○ 3.4  Performance — virtual scrolling for large panel lists
 * ○ 3.5  Performance — memoization, selective re-render optimization
 * ○ 3.6  Data export — panel data to CSV, screenshot to PNG
 * ○ 3.7  Widget embedding — panel iframe embed for external sites
 * ○ 3.8  Advanced search — filter by: sector, region, tier, data freshness
 * ○ 3.9  Panel snapshot — save panel state as image with watermark
 * ○ 3.10 Macro event timeline — scrollable history of significant events
 * ○ 3.11 Backtesting UI — event correlation with historical returns
 * ○ 3.12 MCP server integration — expose panel data to AI tools
 * ○ 3.13 Tauri desktop app wrapper
 * ○ 3.14 Mobile companion layout (read-only, compressed panels)
 * ○ 3.15 Full accessibility audit (WCAG 2.1 AA compliance)
 * ○ 3.16 Sentry error monitoring integration
 * ○ 3.17 PostHog analytics integration
 */

export const PHASE_ROADMAP = {
  phase1: { name: 'Foundation Stability & Panel Excellence', status: 'COMPLETE' as const, tasks: 25 },
  phase2: { name: 'Intelligence Engine & State Architecture', status: 'COMPLETE' as const, tasks: 15 },
  phase3: { name: 'Production Polish & Feature Completeness', status: 'IN_PROGRESS' as const, tasks: 17 },
};
