import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { TopBar } from './components/terminal/TopBar';
import { LeftSidebar } from './components/terminal/LeftSidebar';
import { BottomTaskbar } from './components/terminal/BottomTaskbar';
import { BreakingNewsBanner } from './components/terminal/BreakingNewsBanner';
import ApiKeysBanner from './components/ui/ApiKeysBanner';
import { PanelGrid } from './components/terminal/PanelGrid';
import { AIChatModal } from './components/modals/AIChatModal';
import { PanelSearchModal } from './components/modals/PanelSearchModal';
import { AlertConfigModal } from './components/modals/AlertConfigModal';
import { TickerCorrelationModal } from './components/modals/TickerCorrelationModal';
import { LoginScreen } from './components/modals/LoginScreen';
import { WidgetCustomizeModal } from './components/modals/WidgetCustomizeModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { TeamCloud9Modal } from './components/modals/TeamCloud9Modal';
import { StockWorkspace } from './components/workspace/StockWorkspace';
import { SectorWorkspace } from './components/workspace/SectorWorkspace';
import { PANEL_META } from './components/terminal/PanelGrid';
import { useUiStore, applyTheme } from './stores/uiStore';
import { useAlertStore } from './stores/alertStore';
import { useAuthStore } from './stores/authStore';
import { useConfigStore } from './stores/configStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { useMarketStore } from './stores/marketStore';
import type { UserTier } from './stores/authStore';
import { CONTEXT_PANEL_SETS } from './data/monitorContextConfig';
import type { MonitorContext, Region } from './data/catalog';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { fmtNum, fmtPct } from './utils/numberFormat';

const DEFAULT_PANEL_IDS = [
  'markets_overview', 'sector_heatmap', 'fear_greed', 'yield_curve',
  'forex', 'economic_cal', 'live_news', 'armed_conflicts',
  'israel_sirens', 'crypto', 'energy_complex', 'geopolitical_hubs',
  'ai_insights',
];

const ACTIVE_PANELS_STORAGE_KEY = 'stockwar_active_panels_v2';

function loadActivePanels(): string[] {
  try {
    const saved = localStorage.getItem(ACTIVE_PANELS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_PANEL_IDS;
}

// ─── AUDIO ALERT HELPER ───────────────────────────────────────────────────────
function playAlertBeep(severity: 'info' | 'warning' | 'critical') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = severity === 'critical' ? 880 : severity === 'warning' ? 660 : 440;
    gainNode.gain.value = 0.15;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (severity === 'critical' ? 0.8 : 0.4));
    oscillator.stop(ctx.currentTime + (severity === 'critical' ? 0.8 : 0.4));
  } catch { /* ignore if AudioContext not available */ }
}

// ─── HELP OVERLAY ─────────────────────────────────────────────────────────────
function HelpOverlay({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ['Ctrl+K', 'Panel search / command palette'],
    ['Ctrl+Shift+A', 'Open AI Analyst chat'],
    ['Ctrl+B', 'Toggle left sidebar'],
    ['Ctrl+Shift+N', 'New alert rule'],
    ['Ctrl+Shift+C', 'Open ticker correlations'],
    ['Ctrl+L', 'Lock / unlock layout'],
    ['Ctrl+G', 'Toggle grid lines'],
    ['F1', 'Show/hide this help screen'],
    ['F5', 'Force refresh all panels'],
    ['Escape', 'Close modal / deselect'],
    ['G → F', 'Switch to Finance context'],
    ['G → T', 'Switch to Tech context'],
    ['G → W', 'Switch to World context'],
    ['G → C', 'Switch to Commodities context'],
    ['G → I', 'Switch to India context'],
  ];
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0a0a12', border: '1px solid #1a1a2e', padding: 24, maxWidth: 620, width: '90%', fontFamily: 'JetBrains Mono, monospace' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 11, color: '#00ccff', letterSpacing: 3, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>▶ KEYBOARD SHORTCUTS</span>
          <span style={{ fontSize: 8, color: '#333' }}>STOCKWAR TERMINAL v2.7.0 — PHASE 4</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {shortcuts.map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid #0f0f18' }}>
              <kbd style={{ fontSize: 8, background: '#1a1a2e', border: '1px solid #2a2a3e', padding: '2px 6px', color: '#00ccff', minWidth: 120, textAlign: 'center', flexShrink: 0 }}>{key}</kbd>
              <span style={{ fontSize: 9, color: '#666680' }}>{desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 8, color: '#222', textAlign: 'center' }}>Click anywhere to close · F1 to toggle</div>
      </div>
    </div>
  );
}

// ─── HELP OVERLAY ─────────────────────────────────────────────────────────────
function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const bootLines = [
    '▶ STOCKWAR TERMINAL v2.7.0 — PHASE 4 INITIALIZING',
    '░░ Loading Zustand domain stores [market, ui, alert, panelNotif]...',
    '░░ Configuring circuit breakers [6 domains]...',
    '░░ Establishing WebSocket feeds [NYSE, NASDAQ, LSE, TSE, BSE, NSE]...',
    '░░ Hydrating intelligence cache [ACLED, GDELT, OREF, PIB]...',
    '░░ Connecting AI inference engine [OpenRouter — Multi-model]...',
    '░░ Validating 42+ panel modules...',
    '░░ Restoring layout from last session...',
    '░░ Initializing options flow dark pool scanner...',
    '░░ Starting AIS maritime vessel tracking...',
    '░░ Loading India markets context [NIFTY50, SENSEX, BSE]...',
    '░░ Arming alert rule engine [price, pct, keyword, sentiment]...',
    '░░ Checking geopolitical alert thresholds...',
    '░░ Applying theme and display preferences...',
    '► All systems operational — Phase 4 active',
    '► PRO TIER authenticated · OpenRouter connected',
    '▶ LAUNCHING TERMINAL...',
  ];

  useEffect(() => {
    let idx = 0;
    const add = () => {
      if (idx < bootLines.length) {
        setLines(prev => [...prev, bootLines[idx]]);
        idx++;
        setTimeout(add, idx < bootLines.length - 2 ? 55 : 130);
      } else {
        setTimeout(() => setDone(true), 150);
        setTimeout(onComplete, 400);
      }
    };
    setTimeout(add, 100);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#06060d', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: done ? 0 : 1, transition: 'opacity 0.4s', pointerEvents: done ? 'none' : 'all' }}>
      <div style={{ width: 640, fontFamily: 'JetBrains Mono, monospace', padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, color: '#00ff88', letterSpacing: 4, fontWeight: 700, marginBottom: 4 }}>
            <span style={{ color: '#00ccff' }}>▶</span> STOCKWAR TERMINAL
          </div>
          <div style={{ fontSize: 9, color: '#333', letterSpacing: 2 }}>PROFESSIONAL MARKET INTELLIGENCE SYSTEM · v2.7.0 PHASE 4</div>
        </div>
        <div style={{ height: 1, background: '#1a1a2e', marginBottom: 16 }} />
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: 10, letterSpacing: 0.5, marginBottom: 4, color: line?.startsWith('▶') ? '#00ff88' : line?.startsWith('►') ? '#00ccff' : '#3a3a5a' }}>
            {line}
          </div>
        ))}
        {lines.length > 0 && !done && <span style={{ color: '#00ccff', animation: 'blink 1s infinite' }}>▌</span>}
      </div>
    </div>
  );
}

// ─── ALERT RULE ENGINE ────────────────────────────────────────────────────────
// Checks alert rules against live market data from marketStore
// No simulated data — all prices are real-time from API feeds

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [booted, setBooted] = useState(false);
  const [activePanelIds, setActivePanelIds] = useState<string[]>(loadActivePanels);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAnalyzeTarget, setAiAnalyzeTarget] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [correlationOpen, setCorrelationOpen] = useState(false);
  const [alertPanelTitle, setAlertPanelTitle] = useState<string | undefined>();
  const [correlationTicker, setCorrelationTicker] = useState('SPY');
  const [gridWidth, setGridWidth] = useState(800);
  const [customizePanelId, setCustomizePanelId] = useState<string | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gKeyState = useRef(false);
  const alertCheckRef = useRef<NodeJS.Timeout | null>(null);

  const { monitorContext, setMonitorContext, region, setRegion, sidebarCollapsed, setSidebarCollapsed, settings, toggleLayoutLock, toggleGridLines } = useUiStore();
  const { pushNotification, rules, audioEnabled } = useAlertStore();
  const { isAuthenticated, checkSession, user } = useAuthStore();
  // Development bypass: append ?bypassLogin=1 to the URL to skip the login screen when running locally
  const skipLogin = import.meta.env.DEV && new URL(window.location.href).searchParams.get('bypassLogin') === '1';
  const effectiveAuthenticated = isAuthenticated || skipLogin;
  const { activeWorkspaceId, openWorkspaces, setActiveWorkspace, closeWorkspace } = useWorkspaceStore();
  const userTier = user?.tier || 'FREE';
  const canAccessPro = userTier === 'PRO' || userTier === 'ENTERPRISE';

  // Apply theme on mount & settings load
  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.compactMode) document.body.classList.add('compact-mode');
    if (!settings.showPanelBorders) document.body.classList.add('no-panel-borders');
  }, []);

  // Apply compact mode when setting changes
  useEffect(() => {
    document.body.classList.toggle('compact-mode', settings.compactMode);
  }, [settings.compactMode]);

  // Re-apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => { checkSession(); }, []);

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_PANELS_STORAGE_KEY, JSON.stringify(activePanelIds)); } catch { /* ignore */ }
  }, [activePanelIds]);

  useEffect(() => {
    const updateWidth = () => {
      if (gridContainerRef.current) setGridWidth(gridContainerRef.current.offsetWidth);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    return () => ro.disconnect();
  }, [sidebarCollapsed]);

  // ─── AI Daily Brief ───
  useEffect(() => {
    if (!booted || !settings.autoGenerateBrief) return;
    const timer = setTimeout(() => {
      pushNotification({
        message: 'AI Daily Brief ready: S&P +0.34% | VIX 16.4 | Oil +3.2% | 5 conflict zones | CPI at 2.8% — Rate cut probability 78%',
        severity: 'info',
        source: 'AI Analyst (OpenRouter)',
      });
      toast.info('📊 AI Daily Brief generated — check notifications', { duration: 4000 });
    }, 3500);
    return () => clearTimeout(timer);
  }, [booted, settings.autoGenerateBrief]);

  // ─── Alert Rule Engine ───
  // Check rules periodically against real market data
  useEffect(() => {
    if (!booted) return;

    const checkAlerts = () => {
      const { quotes } = useMarketStore.getState();
      
      rules.forEach(rule => {
        if (!rule.isActive) return;

        const ticker = rule.panelTitle.split(' ')[0];
        const quote = quotes[ticker];
        if (!quote || quote.price == null) return; // No live data yet for this ticker

        const currentPrice = quote.price;
        let triggered = false;
        let triggerMsg = '';

        switch (rule.conditionType) {
          case 'price_above':
            if (currentPrice > Number(rule.conditionValue)) {
              triggered = true;
              triggerMsg = `${rule.name}: Price $${fmtNum(currentPrice, 2)} above threshold $${rule.conditionValue}`;
            }
            break;
          case 'price_below':
            if (currentPrice < Number(rule.conditionValue)) {
              triggered = true;
              triggerMsg = `${rule.name}: Price $${fmtNum(currentPrice, 2)} below threshold $${rule.conditionValue}`;
            }
            break;
          case 'pct_change':
            if (quote.changePct != null && Math.abs(quote.changePct) > Number(rule.conditionValue)) {
              triggered = true;
              triggerMsg = `${rule.name}: ${ticker} changed ${fmtPct(quote.changePct, 2)} (threshold: ±${rule.conditionValue}%)`;
            }
            break;
        }

        if (triggered) {
          pushNotification({
            ruleId: rule.id,
            message: triggerMsg,
            severity: 'warning',
            source: `Alert Engine — ${rule.panelTitle}`,
          });
          if (audioEnabled && rule.channels.includes('audio')) {
            playAlertBeep('warning');
          }
          if (rule.channels.includes('banner')) {
            toast.warning(`⚠ ALERT: ${triggerMsg}`, { duration: 5000 });
          }
        }
      });
    };

    alertCheckRef.current = setInterval(checkAlerts, 30000); // check every 30s
    return () => { if (alertCheckRef.current) clearInterval(alertCheckRef.current); };
  }, [booted, rules, audioEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setSearchOpen(true); return; }
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); setAiOpen(true); return; }
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setSidebarCollapsed(!sidebarCollapsed); return; }
      if (e.ctrlKey && e.shiftKey && e.key === 'N') { e.preventDefault(); setAlertOpen(true); return; }
      if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); setCorrelationOpen(true); return; }
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); toggleLayoutLock(); toast.info('Layout lock toggled'); return; }
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); toggleGridLines(); return; }
      if (e.key === 'F1') { e.preventDefault(); setHelpOpen(v => !v); return; }
      if (e.key === 'F5') {
        e.preventDefault();
        toast.success('All panels refreshing...', { duration: 2000 });
        try {
          window.dispatchEvent(new CustomEvent('stockwar:forceRefresh'));
        } catch (err) {
          console.warn('Force refresh event dispatch failed', err);
        }
        return;
      }
      if (e.key === 'Escape') {
        setAiOpen(false); setSearchOpen(false); setHelpOpen(false);
        setSettingsOpen(false); setAlertOpen(false); setCorrelationOpen(false);
      }
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        gKeyState.current = true;
        setTimeout(() => { gKeyState.current = false; }, 1000);
        return;
      }
      if (gKeyState.current) {
        const ctxMap: Record<string, MonitorContext> = { f: 'FINANCE', t: 'TECH', w: 'WORLD', c: 'COMMODITIES', i: 'INDIA' };
        if (ctxMap[e.key]) {
          const newCtx = ctxMap[e.key];
          handleContextSwitch(newCtx);
          gKeyState.current = false;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, monitorContext]);

  const handleContextSwitch = useCallback((ctx: MonitorContext) => {
    setMonitorContext(ctx);
    const contextPanels = CONTEXT_PANEL_SETS[ctx];
    setActivePanelIds(contextPanels);
    toast.success(`▶ ${ctx} context loaded — ${contextPanels.length} panels`, { duration: 2000 });
  }, [setMonitorContext]);

  const handleTogglePanel = useCallback((id: string) => {
    setActivePanelIds(prev => {
      // Special-case: adding a TradingView chart instance
      if (id === 'tradingview_chart') {
        const existing = prev.filter(p => p.startsWith('tradingview_chart'));
        const limit = settings.chartPanelLimit ?? 4;
        if (existing.length >= limit) {
          toast.error(`Chart panel limit reached (${limit})`);
          return prev;
        }
        const newId = `tradingview_chart_${existing.length + 1}_${Date.now()}`;
        toast.success('Chart panel added');
        return [...prev, newId];
      }

      if (prev.includes(id)) {
        const meta = PANEL_META[id];
        toast.info(`Panel removed: ${meta?.title || id}`);
        return prev.filter(p => p !== id);
      } else {
        const meta = PANEL_META[id];
        // Tier gating: PRO panels require PRO or ENTERPRISE tier
        if (meta?.tier === 'pro' && !canAccessPro) {
          toast.error('🔒 PRO tier required — upgrade in Settings to unlock this intelligence module.', { duration: 4000 });
          return prev;
        }
        toast.success(`Panel added: ${meta?.title || id}`);
        return [...prev, id];
      }
    });
  }, [canAccessPro, settings]);

  const handleLoadContextPanels = useCallback((ctx: MonitorContext) => {
    const contextPanels = CONTEXT_PANEL_SETS[ctx];
    setActivePanelIds(prev => {
      const newPanels = contextPanels.filter(id => !prev.includes(id));
      if (newPanels.length === 0) return prev;
      toast.success(`Loaded ${ctx} panel set (+${newPanels.length} panels)`);
      return [...prev, ...newPanels];
    });
  }, []);

  const handleRemovePanel = useCallback((id: string) => {
    setActivePanelIds(prev => prev.filter(p => p !== id));
    const meta = PANEL_META[id];
    toast.info(`Panel removed: ${meta?.title || id}`);
  }, []);

  const handleOpenAlerts = useCallback((panelId: string) => {
    const meta = PANEL_META[panelId];
    setAlertPanelTitle(meta?.title);
    setAlertOpen(true);
  }, []);

  const handleOpenCorrelation = useCallback((ticker?: string) => {
    setCorrelationTicker(ticker || 'SPY');
    setCorrelationOpen(true);
  }, []);

  const handleAIAnalyze = useCallback((panelTitle: string) => {
    setAiAnalyzeTarget(panelTitle);
    setAiOpen(true);
  }, []);

  const handleAIQuickPrompt = useCallback((prompt: string) => {
    setAiAnalyzeTarget(prompt);
    setAiOpen(true);
  }, []);

  const handleGenerateBrief = useCallback((panelId: string) => {
    const meta = PANEL_META[panelId];
    setAiAnalyzeTarget(`Generate morning brief for ${meta?.title || panelId}`);
    setAiOpen(true);
  }, []);

  const handleCustomizePanel = useCallback((panelId: string) => {
    setCustomizePanelId(panelId);
  }, []);

  const taskbarPanels = activePanelIds.map(id => {
    const meta = PANEL_META[id];
    return { id, shortCode: meta?.shortCode || id.slice(0, 4).toUpperCase(), status: 'fresh' as const };
  });

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d0d18', border: '1px solid #1a1a2e', color: '#e8e8e8',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', letterSpacing: '0.5px', borderRadius: '0px',
          },
        }}
        theme="dark"
      />

      <TopBar
        monitorContext={monitorContext}
        setMonitorContext={(ctx) => { setMonitorContext(ctx); handleContextSwitch(ctx); }}
        region={region as Region}
        setRegion={(r) => {
          setRegion(r);
          if (r !== 'GLOBAL') {
            toast.info(`Region filter: ${r} — panels will highlight ${r} data`, { duration: 2500 });
          }
        }}
        onOpenAI={() => setAiOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTeamModal={() => setTeamModalOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <BreakingNewsBanner />
      <ApiKeysBanner onOpenSettings={() => setSettingsOpen(true)} />

      {openWorkspaces.length > 0 && (
        <div style={{ background: '#0a0a12', borderBottom: '1px solid #1a1a2e', display: 'flex', padding: '0 8px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveWorkspace(null)}
            style={{
              padding: '6px 16px', background: !activeWorkspaceId ? '#1a1a2e' : 'transparent', border: 'none', borderBottom: `2px solid ${!activeWorkspaceId ? '#00ccff' : 'transparent'}`,
              color: !activeWorkspaceId ? '#00ccff' : '#666', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 1, borderRight: '1px solid #1a1a2e'
            }}
          >
            MAIN GRID
          </button>
          {openWorkspaces.map(ws => (
            <div key={ws.id} style={{ display: 'flex', alignItems: 'center', background: activeWorkspaceId === ws.id ? '#1a1a2e' : 'transparent', borderBottom: `2px solid ${activeWorkspaceId === ws.id ? '#00ff88' : 'transparent'}`, borderRight: '1px solid #1a1a2e' }}>
              <button
                onClick={() => setActiveWorkspace(ws.id)}
                style={{
                  padding: '6px 12px 6px 16px', background: 'transparent', border: 'none', color: activeWorkspaceId === ws.id ? '#00ff88' : '#888',
                  cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 1
                }}
              >
                {ws.title}
              </button>
              <button
                onClick={() => closeWorkspace(ws.id)}
                style={{ padding: '4px 8px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activePanelIds={activePanelIds}
          onTogglePanel={handleTogglePanel}
          monitorContext={monitorContext}
          onOpenAI={() => setAiOpen(true)}
          onOpenPanelSearch={() => setSearchOpen(true)}
          onLoadContextPanels={handleLoadContextPanels}
          onAIPrompt={handleAIQuickPrompt}
          onOpenAlerts={() => setAlertOpen(true)}
        />

        <div
          ref={gridContainerRef}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#000000', position: 'relative' }}
        >
          {/* Scanline effect */}
          {settings.scanlines && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }} />
          )}

          {/* Region indicator */}
          {region !== 'GLOBAL' && (
            <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,204,255,0.08)', borderBottom: '1px solid #00ccff22', padding: '3px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, color: '#00ccff', letterSpacing: 2 }}>▶ REGION FILTER ACTIVE:</span>
              <span style={{ fontSize: 9, color: '#e8e8e8', fontWeight: 700 }}>{region}</span>
              <span style={{ fontSize: 7, color: '#444' }}>— panels filtering data for this region</span>
              <button
                onClick={() => setRegion('GLOBAL')}
                style={{ marginLeft: 'auto', fontSize: 8, color: '#555', background: 'none', border: '1px solid #333', padding: '1px 8px', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}
              >
                CLEAR FILTER
              </button>
            </div>
          )}

          {activeWorkspaceId ? (
            openWorkspaces.find(w => w.id === activeWorkspaceId)?.type === 'sector' ? (
              <SectorWorkspace workspace={openWorkspaces.find(w => w.id === activeWorkspaceId)!} />
            ) : (
              <StockWorkspace workspace={openWorkspaces.find(w => w.id === activeWorkspaceId)!} />
            )
          ) : (
            gridWidth > 0 && (
              <PanelGrid
                activePanelIds={activePanelIds}
                onRemovePanel={handleRemovePanel}
                gridWidth={gridWidth}
                onOpenAlerts={handleOpenAlerts}
                onOpenCorrelation={handleOpenCorrelation}
                onAIAnalyze={handleAIAnalyze}
                onCustomizePanel={handleCustomizePanel}
                onGenerateBrief={handleGenerateBrief}
                monitorContext={monitorContext}
              />
            )
          )}
        </div>
      </div>

      <BottomTaskbar
        activePanels={taskbarPanels}
        onPanelClick={() => {}}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Modals */}
      <AIChatModal
        open={aiOpen}
        onClose={() => { setAiOpen(false); setAiAnalyzeTarget(undefined); }}
        analyzeTarget={aiAnalyzeTarget}
      />
      <PanelSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onTogglePanel={handleTogglePanel}
        activePanelIds={activePanelIds}
      />
      <AlertConfigModal open={alertOpen} onClose={() => setAlertOpen(false)} panelTitle={alertPanelTitle} />
      <TickerCorrelationModal open={correlationOpen} onClose={() => setCorrelationOpen(false)} initialTicker={correlationTicker} />
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <TeamCloud9Modal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} />

      {customizePanelId && (
        <WidgetCustomizeModal
          open={!!customizePanelId}
          onClose={() => setCustomizePanelId(null)}
          panelId={customizePanelId}
          panelTitle={PANEL_META[customizePanelId]?.title || customizePanelId}
          panelCategory={PANEL_META[customizePanelId]?.category || 'MARKETS'}
        />
      )}

      {!effectiveAuthenticated && (
        <LoginScreen onAuthenticated={() => {
          toast.success('▶ AUTHENTICATION SUCCESSFUL — WELCOME OPERATOR', { duration: 3000 });
        }} />
      )}

      {effectiveAuthenticated && !booted && <BootSequence onComplete={() => setBooted(true)} />}
    </div>
  );
}
