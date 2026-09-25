import { useState, useCallback, Component, ErrorInfo, ReactNode, Children, isValidElement, cloneElement } from 'react';
import GridLayout from 'react-grid-layout/legacy';
import type { LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

class PanelErrorBoundary extends Component<{ children: ReactNode, panelName: string, refreshKey?: number }, { hasError: boolean, errorMsg: string }> {
  constructor(props: { children: ReactNode, panelName: string, refreshKey?: number }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Panel Error [${this.props.panelName}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center', background: 'rgba(255, 51, 85, 0.05)', color: '#ff3355', fontFamily: 'JetBrains Mono, monospace' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>PANEL CRASHED</div>
          <div style={{ fontSize: 8, opacity: 0.8 }}>{this.state.errorMsg}</div>
        </div>
      );
    }
    const { children, refreshKey } = this.props;
    if (refreshKey !== undefined) {
      return (
        <>
          {Children.map(children, child => 
            isValidElement(child) ? cloneElement(child as any, { refreshKey }) : child
          )}
        </>
      );
    }
    return children;
  }
}

import { PanelWrapper } from './PanelWrapper';
import { MarketsPanel } from '../panels/MarketsPanel';
import { SectorHeatmapPanel } from '../panels/SectorHeatmapPanel';
import { FearGreedPanel } from '../panels/FearGreedPanel';
import { YieldCurvePanel } from '../panels/YieldCurvePanel';
import { ForexPanel } from '../panels/ForexPanel';
import { CryptoPanel } from '../panels/CryptoPanel';
import { ArmedConflictsPanel } from '../panels/ArmedConflictsPanel';
import { NewsPanel } from '../panels/NewsPanel';
import { EconomicCalendarPanel } from '../panels/EconomicCalendarPanel';
import { EarningsCalendarPanel } from '../panels/EarningsCalendarPanel';
import { EnergyComplexPanel } from '../panels/EnergyComplexPanel';
import { GeopoliticalHubsPanel } from '../panels/GeopoliticalHubsPanel';
import { IsraelSirensPanel } from '../panels/IsraelSirensPanel';
import { AIInsightsPanel } from '../panels/AIInsightsPanel';
import { SocialVelocityPanel } from '../panels/SocialVelocityPanel';
import { GithubTrendingPanel } from '../panels/GithubTrendingPanel';
import { MacroIndicatorsPanel } from '../panels/MacroIndicatorsPanel';
import { PentagonPizzaPanel } from '../panels/PentagonPizzaPanel';
import { GoldSilverPanel } from '../panels/GoldSilverPanel';
import { ServiceStatusPanel } from '../panels/ServiceStatusPanel';
import { LayoffsTrackerPanel } from '../panels/LayoffsTrackerPanel';
import { IntelFeedPanel } from '../panels/IntelFeedPanel';
// Phase 2: 10 new panels
import { OptionsFlowPanel } from '../panels/OptionsFlowPanel';
import { AviationTrackerPanel } from '../panels/AviationTrackerPanel';
import { MaritimeTrackerPanel } from '../panels/MaritimeTrackerPanel';
import { DXYCurrencyPanel } from '../panels/DXYCurrencyPanel';
import { GlobalBondsPanel } from '../panels/GlobalBondsPanel';
import { MacroRegimePanel } from '../panels/MacroRegimePanel';
import { IPOPipelinePanel } from '../panels/IPOPipelinePanel';
import { SanctionsPanel } from '../panels/SanctionsPanel';
import { CommoditiesDashboardPanel } from '../panels/CommoditiesDashboardPanel';
import { CongressionalTradingPanel } from '../panels/CongressionalTradingPanel';
// Phase 3: 5 new panels
import { WorldClockPanel } from '../panels/WorldClockPanel';
import { CentralBankWatchPanel } from '../panels/CentralBankWatchPanel';
import { CyberSecurityPanel } from '../panels/CyberSecurityPanel';
import { CrossSourceSignalsPanel } from '../panels/CrossSourceSignalsPanel';
import { IndiaMarketsPanel } from '../panels/IndiaMarketsPanel';
import { usePanelNotifStore } from '../../stores/panelNotifStore';
import { useUiStore } from '../../stores/uiStore';
import { toast } from 'sonner';
import { usePanelCustomizeStore } from '../../stores/panelCustomizeStore';
import { TradingChartPanel } from '../panels/TradingChartPanel';
// Phase 4: New panels
import { LiveGlobePanel } from '../panels/LiveGlobePanel';
import { MilitaryTrackerPanel } from '../panels/MilitaryTrackerPanel';
import { IndiaNewsPanel } from '../panels/IndiaNewsPanel';
import { IndiaBSENSEPanel } from '../panels/IndiaBSENSEPanel';
import { LiveNewsYouTubePanel } from '../panels/LiveNewsYouTubePanel';

const LAYOUT_STORAGE_KEY = 'stockwar_panel_layouts_v2';

// Panel registry
const PANEL_COMPONENTS: Record<string, React.ComponentType> = {
  markets_overview: MarketsPanel,
  sector_heatmap: SectorHeatmapPanel,
  fear_greed: FearGreedPanel,
  yield_curve: YieldCurvePanel,
  forex: ForexPanel,
  crypto: CryptoPanel,
  armed_conflicts: ArmedConflictsPanel,
  live_news: NewsPanel,
  economic_cal: EconomicCalendarPanel,
  earnings_cal: EarningsCalendarPanel,
  energy_complex: EnergyComplexPanel,
  geopolitical_hubs: GeopoliticalHubsPanel,
  israel_sirens: IsraelSirensPanel,
  ai_insights: AIInsightsPanel,
  social_velocity: SocialVelocityPanel,
  github_trending: GithubTrendingPanel,
  macro_indicators: MacroIndicatorsPanel,
  pentagon_pizza: PentagonPizzaPanel,
  gold_silver: GoldSilverPanel,
  service_status: ServiceStatusPanel,
  layoffs: LayoffsTrackerPanel,
  intel_feed: IntelFeedPanel,
  // Phase 2
  options_flow: OptionsFlowPanel,
  aviation_tracker: AviationTrackerPanel,
  maritime_tracker: MaritimeTrackerPanel,
  dxy_currency: DXYCurrencyPanel,
  global_bonds: GlobalBondsPanel,
  macro_regime: MacroRegimePanel,
  ipo_pipeline: IPOPipelinePanel,
  sanctions: SanctionsPanel,
  commodities_dashboard: CommoditiesDashboardPanel,
  congressional_trading: CongressionalTradingPanel,
  // Phase 3
  world_clock: WorldClockPanel,
  central_bank_watch: CentralBankWatchPanel,
  cybersecurity: CyberSecurityPanel,
  cross_source_signals: CrossSourceSignalsPanel,
  india_markets: IndiaMarketsPanel,
  // Phase 4
  live_globe: LiveGlobePanel,
  military_tracker: MilitaryTrackerPanel,
  india_news: IndiaNewsPanel,
  india_bse_nse: IndiaBSENSEPanel,
  live_news_youtube: LiveNewsYouTubePanel,
};

export const PANEL_META: Record<string, { title: string; shortCode: string; category: string; tier?: 'free' | 'pro' }> = {
  markets_overview: { title: 'Markets Overview', shortCode: 'MKT', category: 'MARKETS' },
  sector_heatmap: { title: 'Sector Heatmap', shortCode: 'SECT', category: 'MARKETS' },
  fear_greed: { title: 'Fear & Greed Index', shortCode: 'F&G', category: 'MARKETS' },
  yield_curve: { title: 'US Yield Curve', shortCode: 'YLD', category: 'MARKETS' },
  forex: { title: 'Forex & Currencies', shortCode: 'FX', category: 'MARKETS' },
  crypto: { title: 'Crypto Prices', shortCode: 'CRPT', category: 'CRYPTO' },
  armed_conflicts: { title: 'Armed Conflict Events', shortCode: 'CNFL', category: 'INTELLIGENCE' },
  live_news: { title: 'Live News', shortCode: 'NEWS', category: 'NEWS' },
  economic_cal: { title: 'Economic Calendar', shortCode: 'ECAL', category: 'MARKETS' },
  earnings_cal: { title: 'Earnings Calendar', shortCode: 'EARN', category: 'MARKETS' },
  energy_complex: { title: 'Energy Complex', shortCode: 'NRG', category: 'COMMODITIES' },
  geopolitical_hubs: { title: 'Geopolitical Hubs', shortCode: 'GEO', category: 'INTELLIGENCE' },
  israel_sirens: { title: 'Israel Sirens (OREF)', shortCode: 'OREF', category: 'INTELLIGENCE' },
  ai_insights: { title: 'AI Insights', shortCode: 'AI', category: 'TECHNOLOGY' },
  social_velocity: { title: 'Social Velocity', shortCode: 'SOC', category: 'NEWS' },
  github_trending: { title: 'GitHub Trending', shortCode: 'GH', category: 'TECHNOLOGY' },
  macro_indicators: { title: 'Macro Indicators', shortCode: 'MCRO', category: 'MARKETS' },
  pentagon_pizza: { title: 'Pentagon Pizza Tracker', shortCode: 'PIZA', category: 'SYSTEM' },
  gold_silver: { title: 'Gold & Precious Metals', shortCode: 'GOLD', category: 'MARKETS' },
  service_status: { title: 'Service Status', shortCode: 'SVC', category: 'TECHNOLOGY' },
  layoffs: { title: 'Layoffs Tracker', shortCode: 'LOFF', category: 'TECHNOLOGY' },
  intel_feed: { title: 'Intelligence Feed', shortCode: 'INTL', category: 'INTELLIGENCE' },
  // Phase 2
  options_flow: { title: 'Options Flow & Dark Pool', shortCode: 'OPT', category: 'MARKETS', tier: 'pro' },
  aviation_tracker: { title: 'Aviation Tracker', shortCode: 'AVN', category: 'INTELLIGENCE' },
  maritime_tracker: { title: 'Maritime Tracker (AIS)', shortCode: 'MAR', category: 'INTELLIGENCE' },
  dxy_currency: { title: 'DXY & Currency Basket', shortCode: 'DXY', category: 'MARKETS' },
  global_bonds: { title: 'Global Bond Yields', shortCode: 'BOND', category: 'MARKETS' },
  macro_regime: { title: 'Macro Regime Detector', shortCode: 'RGM', category: 'MARKETS' },
  ipo_pipeline: { title: 'IPO Pipeline & SPACs', shortCode: 'IPO', category: 'MARKETS' },
  sanctions: { title: 'Sanctions & Export Controls', shortCode: 'SANC', category: 'INTELLIGENCE' },
  commodities_dashboard: { title: 'Commodities Dashboard', shortCode: 'CMD', category: 'COMMODITIES' },
  congressional_trading: { title: 'Congressional Trading', shortCode: 'CONG', category: 'MARKETS', tier: 'pro' },
  // Phase 3
  world_clock: { title: 'World Market Clock', shortCode: 'CLK', category: 'MARKETS' },
  central_bank_watch: { title: 'Central Bank Watch', shortCode: 'CBW', category: 'MARKETS' },
  cybersecurity: { title: 'Cybersecurity Threats', shortCode: 'CYBR', category: 'TECHNOLOGY' },
  cross_source_signals: { title: 'Cross-Source Signals', shortCode: 'XSIG', category: 'INTELLIGENCE', tier: 'pro' },
  india_markets: { title: 'India Markets (NIFTY/BSE)', shortCode: 'IND', category: 'MARKETS' },
  // Phase 4
  live_globe: { title: 'Live Globe', shortCode: 'GLOBE', category: 'INTELLIGENCE' },
  military_tracker: { title: 'Military Tracker', shortCode: 'MIL', category: 'INTELLIGENCE' },
  india_news: { title: 'India Intelligence Hub', shortCode: 'INEWS', category: 'NEWS' },
  india_bse_nse: { title: 'BSE / NSE Live', shortCode: 'BSE', category: 'MARKETS' },
  live_news_youtube: { title: 'Live News (YouTube)', shortCode: 'LIVTV', category: 'NEWS' },
};

type GridItem = { i: string; x: number; y: number; w: number; h: number };

const DEFAULT_LAYOUTS: Record<string, GridItem> = {
  markets_overview: { i: 'markets_overview', x: 0, y: 0, w: 4, h: 9 },
  sector_heatmap: { i: 'sector_heatmap', x: 4, y: 0, w: 3, h: 6 },
  fear_greed: { i: 'fear_greed', x: 7, y: 0, w: 2, h: 9 },
  yield_curve: { i: 'yield_curve', x: 9, y: 0, w: 3, h: 5 },
  forex: { i: 'forex', x: 4, y: 6, w: 3, h: 7 },
  economic_cal: { i: 'economic_cal', x: 9, y: 5, w: 3, h: 8 },
  live_news: { i: 'live_news', x: 0, y: 9, w: 4, h: 8 },
  armed_conflicts: { i: 'armed_conflicts', x: 4, y: 13, w: 4, h: 7 },
  israel_sirens: { i: 'israel_sirens', x: 8, y: 13, w: 2, h: 7 },
  crypto: { i: 'crypto', x: 10, y: 13, w: 2, h: 8 },
  energy_complex: { i: 'energy_complex', x: 0, y: 17, w: 4, h: 6 },
  geopolitical_hubs: { i: 'geopolitical_hubs', x: 4, y: 20, w: 4, h: 7 },
  pentagon_pizza: { i: 'pentagon_pizza', x: 8, y: 21, w: 4, h: 8 },
  ai_insights: { i: 'ai_insights', x: 0, y: 23, w: 4, h: 7 },
  social_velocity: { i: 'social_velocity', x: 4, y: 27, w: 4, h: 6 },
  github_trending: { i: 'github_trending', x: 8, y: 29, w: 4, h: 7 },
  macro_indicators: { i: 'macro_indicators', x: 8, y: 36, w: 4, h: 8 },
  earnings_cal: { i: 'earnings_cal', x: 0, y: 30, w: 8, h: 6 },
  gold_silver: { i: 'gold_silver', x: 0, y: 36, w: 4, h: 9 },
  service_status: { i: 'service_status', x: 4, y: 33, w: 4, h: 8 },
  layoffs: { i: 'layoffs', x: 8, y: 44, w: 4, h: 8 },
  intel_feed: { i: 'intel_feed', x: 0, y: 45, w: 6, h: 9 },
  // Phase 2 defaults
  options_flow: { i: 'options_flow', x: 6, y: 45, w: 6, h: 9 },
  aviation_tracker: { i: 'aviation_tracker', x: 0, y: 54, w: 4, h: 9 },
  maritime_tracker: { i: 'maritime_tracker', x: 4, y: 54, w: 4, h: 9 },
  dxy_currency: { i: 'dxy_currency', x: 8, y: 54, w: 4, h: 9 },
  global_bonds: { i: 'global_bonds', x: 0, y: 63, w: 4, h: 10 },
  macro_regime: { i: 'macro_regime', x: 4, y: 63, w: 4, h: 10 },
  ipo_pipeline: { i: 'ipo_pipeline', x: 8, y: 63, w: 4, h: 10 },
  sanctions: { i: 'sanctions', x: 0, y: 73, w: 4, h: 9 },
  commodities_dashboard: { i: 'commodities_dashboard', x: 4, y: 73, w: 4, h: 9 },
  congressional_trading: { i: 'congressional_trading', x: 8, y: 73, w: 4, h: 9 },
  // Phase 3
  world_clock: { i: 'world_clock', x: 0, y: 82, w: 3, h: 10 },
  central_bank_watch: { i: 'central_bank_watch', x: 3, y: 82, w: 4, h: 10 },
  cybersecurity: { i: 'cybersecurity', x: 7, y: 82, w: 5, h: 10 },
  cross_source_signals: { i: 'cross_source_signals', x: 0, y: 92, w: 6, h: 10 },
  india_markets: { i: 'india_markets', x: 6, y: 92, w: 6, h: 10 },
  // Phase 4
  live_globe: { i: 'live_globe', x: 0, y: 102, w: 4, h: 10 },
  military_tracker: { i: 'military_tracker', x: 4, y: 102, w: 4, h: 10 },
  india_news: { i: 'india_news', x: 8, y: 102, w: 4, h: 10 },
  india_bse_nse: { i: 'india_bse_nse', x: 0, y: 112, w: 6, h: 10 },
  live_news_youtube: { i: 'live_news_youtube', x: 6, y: 112, w: 6, h: 10 },
};

function loadLayouts(): Record<string, GridItem> {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) return { ...DEFAULT_LAYOUTS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_LAYOUTS };
}

interface PanelGridProps {
  activePanelIds: string[];
  onRemovePanel: (id: string) => void;
  gridWidth: number;
  onOpenAlerts?: (panelId: string) => void;
  onOpenCorrelation?: (ticker?: string) => void;
  onAIAnalyze?: (panelTitle: string) => void;
  onCustomizePanel?: (panelId: string) => void;
  onGenerateBrief?: (panelId: string) => void;
  monitorContext?: string;
}

export function PanelGrid({ activePanelIds, onRemovePanel, gridWidth, onOpenAlerts, onOpenCorrelation, onAIAnalyze, onCustomizePanel, onGenerateBrief, monitorContext }: PanelGridProps) {
  const [layouts, setLayouts] = useState<Record<string, GridItem>>(loadLayouts);
  const [maximized, setMaximized] = useState<string | null>(null);
  const { badges, clearPanelBadge } = usePanelNotifStore();
  const { gridLinesVisible } = useUiStore();
  const { getCustomization } = usePanelCustomizeStore();

  // ── Export Utilities ──────────────────────────────────────────────────────
  const handleExportCSV = useCallback((panelId: string, title: string) => {
    const meta = PANEL_META[panelId];
    const rows = [
      ['Panel', 'Generated At', 'Category', 'Short Code'],
      [title, new Date().toISOString(), meta?.category || '', meta?.shortCode || ''],
      [],
      ['Note', 'For live data exports connect your API keys in Settings and use the panel-specific download buttons.'],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockwar_${panelId}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`✓ Exported: ${title}`, { duration: 2000 });
  }, []);

  const handleSnapshot = useCallback((panelId: string, title: string) => {
    const el = document.querySelector(`[data-panel-id="${panelId}"]`) as HTMLElement;
    if (!el) { toast.error('Snapshot failed: panel not found'); return; }
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(el, { backgroundColor: '#0d0d18', scale: 2 }).then(canvas => {
        const a = document.createElement('a');
        a.download = `stockwar_${panelId}_${Date.now()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        toast.success(`📸 Snapshot saved: ${title}`, { duration: 2000 });
      });
    }).catch(() => {
      // Fallback: use CSS screenshot via clipboard
      toast.info('Install html2canvas for PNG snapshots. CSV export is available now.', { duration: 4000 });
    });
  }, []);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayouts(prev => {
      const next = { ...prev };
      newLayout.forEach(l => {
        next[l.i] = { i: l.i, x: l.x, y: l.y, w: l.w, h: l.h };
      });
      try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleResetLayout = useCallback(() => {
    setLayouts({ ...DEFAULT_LAYOUTS });
    try { localStorage.removeItem(LAYOUT_STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const handlePanelResize = useCallback((id: string, size: 'small' | 'medium' | 'large') => {
    setLayouts(prev => {
      const current = prev[id] || { i: id, x: 0, y: 9999, w: 4, h: 7 };
      let w = 4, h = 7;
      if (size === 'small') { w = 2; h = 4; }
      else if (size === 'medium') { w = 4; h = 7; }
      else if (size === 'large') { w = 6; h = 9; }
      
      const next = { ...prev, [id]: { ...current, w, h } };
      try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handlePanelMinimize = useCallback((id: string) => {
    setLayouts(prev => {
      const current = prev[id] || { i: id, x: 0, y: 9999, w: 4, h: 7 };
      const next = { ...prev, [id]: { ...current, h: 1 } };
      try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const currentLayouts: GridItem[] = activePanelIds.map(id =>
    layouts[id] || { i: id, x: 0, y: 9999, w: 4, h: 7 }
  );

  const COLS = 12;
  const ROW_HEIGHT = 40;

  // Maximized panel overlay
  if (maximized && activePanelIds.includes(maximized)) {
    const meta = PANEL_META[maximized];
    const Component = PANEL_COMPONENTS[maximized];
      if (meta && Component) {
      return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#0a0a0f' }}>
          <PanelWrapper
            id={maximized}
            title={meta.title}
            shortCode={meta.shortCode}
            category={meta.category}
            tier={meta.tier}
            onClose={() => { setMaximized(null); onRemovePanel(maximized); }}
            onMaximize={() => setMaximized(null)}
            onOpenAlerts={() => onOpenAlerts?.(maximized)}
            onOpenCorrelation={onOpenCorrelation}
            onAIAnalyze={onAIAnalyze}
            onCustomize={() => onCustomizePanel?.(maximized)}
            onGenerateBrief={() => onGenerateBrief?.(maximized)}
            isMaximized={true}
            badge={badges[maximized]}
            onClearBadge={() => clearPanelBadge(maximized)}
          >
            <Component />
          </PanelWrapper>
        </div>
      );
    }
  }

  return (
    <div style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
      {/* Grid overlay lines */}
      {gridLinesVisible && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100,
          backgroundImage: `repeating-linear-gradient(90deg, rgba(0,204,255,0.04) 0px, rgba(0,204,255,0.04) 1px, transparent 1px, transparent ${gridWidth / 12}px)`,
        }} />
      )}

      {/* Layout reset button */}
      {activePanelIds.length > 0 && (
        <div style={{ position: 'absolute', bottom: 36, right: 8, zIndex: 50, display: 'flex', gap: 4 }}>
          <button
            onClick={handleResetLayout}
            title="Reset panel layout to default"
            style={{
              background: '#0d0d18', border: '1px solid #1a1a2e',
              color: '#333', cursor: 'pointer', fontSize: 7,
              fontFamily: 'JetBrains Mono', padding: '3px 6px', letterSpacing: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00ccff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#333'; }}
          >
            RESET LAYOUT
          </button>
        </div>
      )}

      <GridLayout
        layout={currentLayouts as any}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={gridWidth}
        onLayoutChange={handleLayoutChange as any}
        draggableHandle=".drag-handle"
        draggableCancel="button, input, textarea, select, a, .no-drag, [data-panel-menu], .drag-handle *"
        margin={[2, 2]}
        containerPadding={[4, 4]}
        isResizable={true}
        isDraggable={true}
        resizeHandles={['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w'] as any}
      >
        {activePanelIds.map(id => {
          const isChart = id.startsWith('tradingview_chart');
          let meta = PANEL_META[id];
          let Component: any = PANEL_COMPONENTS[id];

          if (isChart) {
            const local = getCustomization(id);
            const symbol = (local as any).chartSymbol;
            meta = { title: symbol ? `Chart — ${symbol}` : 'Trading Chart', shortCode: 'TV', category: 'MARKETS' };
            Component = TradingChartPanel as any;
          }

          if (!meta || !Component) return null;

          return (
            <div key={id} data-panel-id={id} style={{ overflow: 'hidden' }}>
              <PanelWrapper
                id={id}
                title={meta.title}
                shortCode={meta.shortCode}
                category={meta.category}
                tier={meta.tier}
                onClose={() => onRemovePanel(id)}
                onMaximize={() => setMaximized(maximized === id ? null : id)}
                onOpenAlerts={() => onOpenAlerts?.(id)}
                onOpenCorrelation={onOpenCorrelation}
                onAIAnalyze={onAIAnalyze}
                onCustomize={() => onCustomizePanel?.(id)}
                onGenerateBrief={() => onGenerateBrief?.(id)}
                onResize={(size) => handlePanelResize(id, size)}
                onMinimize={() => handlePanelMinimize(id)}
                isMaximized={maximized === id}
                dragHandle="drag-handle"
                badge={badges[id]}
                onClearBadge={() => clearPanelBadge(id)}
                onExportData={() => handleExportCSV(id, meta.title)}
                onSnapshot={() => handleSnapshot(id, meta.title)}
              >
                <PanelErrorBoundary panelName={meta.title}>
                  {isChart ? <Component panelId={id} /> : <Component />}
                </PanelErrorBoundary>
              </PanelWrapper>
            </div>
          );
        })}
      </GridLayout>

      {activePanelIds.length === 0 && (
        <div style={{
          height: 400, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', color: '#1a1a2e',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#0f0f1a' }}>▶</div>
          <div style={{ fontSize: 12, letterSpacing: 4, marginBottom: 8 }}>NO PANELS ACTIVE</div>
          <div style={{ fontSize: 10, color: '#111' }}>Press Ctrl+K to open panel search</div>
        </div>
      )}
    </div>
  );
}
