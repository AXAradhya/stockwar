import { useState } from 'react';
import React from 'react';
import { Search, ChevronRight, ChevronDown, Layout, Zap, PanelLeftClose, PanelLeft, BookOpen, Activity, Save, Trash2, Lock } from 'lucide-react';
import { PANEL_CATALOG, type MonitorContext } from '../../data/catalog';
import { useAuthStore } from '../../stores/authStore';

const LAYOUTS_STORAGE_KEY = 'stockwar_saved_layouts_v2';

interface SavedLayout { name: string; panels: string[]; saved?: boolean; }

function loadSavedLayouts(): SavedLayout[] {
  try {
    const saved = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [
    {
      name: '📈 Trading War Room',
      panels: [
        'markets_overview', 'sector_heatmap', 'fear_greed', 'yield_curve',
        'options_flow', 'forex', 'earnings_cal', 'macro_indicators',
        'economic_cal', 'crypto', 'gold_silver', 'energy_complex',
        'dxy_currency', 'global_bonds',
      ],
    },
    { name: '🏦 Finance War Room', panels: ['markets_overview', 'sector_heatmap', 'fear_greed', 'yield_curve', 'forex', 'economic_cal'] },
    { name: '💻 Tech Watch', panels: ['markets_overview', 'ai_insights', 'github_trending', 'service_status', 'social_velocity', 'layoffs'] },
    { name: '🌍 World Intel', panels: ['armed_conflicts', 'geopolitical_hubs', 'israel_sirens', 'intel_feed', 'pentagon_pizza', 'live_news'] },
    { name: '📊 Macro Monday', panels: ['macro_indicators', 'yield_curve', 'economic_cal', 'gold_silver', 'forex', 'earnings_cal'] },
  ];
}

interface LeftSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activePanelIds: string[];
  onTogglePanel: (id: string) => void;
  monitorContext: MonitorContext;
  onOpenAI: () => void;
  onOpenPanelSearch: () => void;
  onLoadContextPanels?: (ctx: MonitorContext) => void;
  onAIPrompt?: (prompt: string) => void;
  onOpenAlerts?: () => void;
}

const CATEGORIES = ['MARKETS', 'INTELLIGENCE', 'TECHNOLOGY', 'COMMODITIES', 'CRYPTO', 'NEWS', 'SYSTEM'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  MARKETS: '📈', INTELLIGENCE: '🛡️', TECHNOLOGY: '💻', COMMODITIES: '⛽', CRYPTO: '₿', NEWS: '📰', SYSTEM: '⚙️',
};

export function LeftSidebar({
  collapsed,
  onToggleCollapse,
  activePanelIds,
  onTogglePanel,
  monitorContext,
  onOpenAI,
  onOpenPanelSearch,
  onLoadContextPanels,
  onAIPrompt,
  onOpenAlerts,
}: LeftSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<string[]>(['MARKETS', 'INTELLIGENCE', 'TECHNOLOGY']);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(loadSavedLayouts);
  const [saveInputVisible, setSaveInputVisible] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const { user } = useAuthStore();
  const userTier = user?.tier || 'FREE';
  const canAccessPro = userTier === 'PRO' || userTier === 'ENTERPRISE';

  const toggleCat = (cat: string) =>
    setExpandedCats(v => v.includes(cat) ? v.filter(c => c !== cat) : [...v, cat]);

  const filtered = PANEL_CATALOG.filter(p =>
    !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.shortCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveLayout = () => {
    if (!newLayoutName.trim()) return;
    const layout: SavedLayout = { name: newLayoutName.trim(), panels: [...activePanelIds] };
    const next = [...savedLayouts, layout];
    setSavedLayouts(next);
    try { localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setNewLayoutName('');
    setSaveInputVisible(false);
  };

  const handleLoadLayout = (layout: SavedLayout) => {
    // Add all panels in the layout that aren't already active
    layout.panels.forEach(id => {
      if (!activePanelIds.includes(id)) onTogglePanel(id);
    });
  };

  const handleDeleteLayout = (name: string) => {
    const next = savedLayouts.filter(l => l.name !== name);
    setSavedLayouts(next);
    try { localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const W = collapsed ? 48 : 220;

  return (
    <div style={{
      width: W,
      minWidth: W,
      maxWidth: W,
      background: '#0a0a12',
      borderRight: '1px solid #1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease',
      overflow: 'hidden',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      color: '#e8e8e8',
    }}>
      {/* Toggle button */}
      <button
        onClick={onToggleCollapse}
        style={{
          height: 32, width: '100%', background: '#0d0d18',
          border: 'none', borderBottom: '1px solid #1a1a2e',
          cursor: 'pointer', color: '#666680',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: collapsed ? 0 : '0 10px',
        }}
      >
        {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {collapsed ? (
        /* Icon-only mode */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0' }}>
          <button onClick={onOpenPanelSearch} title="Panel Search" style={iconBtnStyle}>
            <Search size={14} />
          </button>
          <button onClick={onOpenAI} title="AI Assistant" style={{ ...iconBtnStyle, color: '#00ccff' }}>
            <Zap size={14} />
          </button>
          <button title="Layouts" style={iconBtnStyle}>
            <Layout size={14} />
          </button>
          <button title="Activity" style={iconBtnStyle}>
            <Activity size={14} />
          </button>
          <button title="Panel Library" style={iconBtnStyle}>
            <BookOpen size={14} />
          </button>
        </div>
      ) : (
        /* Full sidebar */
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Search */}
          <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid #1a1a2e' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0d0d18', border: '1px solid #1a1a2e',
              padding: '4px 8px',
            }}>
              <Search size={10} color="#666680" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search panels..."
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Panel Library */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SectionHeader label={`PANEL LIBRARY (${activePanelIds.length} ACTIVE)`} />
            {CATEGORIES.map(cat => {
              const panels = filtered.filter(p => p.category === cat);
              if (!panels.length) return null;
              const isExpanded = expandedCats.includes(cat);
              const activeCount = panels.filter(p => activePanelIds.includes(p.id)).length;
              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCat(cat)}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none',
                      padding: '4px 8px',
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: '#666680', cursor: 'pointer', fontSize: 9,
                      letterSpacing: 1,
                    }}
                  >
                    {isExpanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                    {CATEGORY_ICONS[cat]} {cat}
                    {activeCount > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: 7, color: '#00ff88', border: '1px solid #00ff8833', padding: '0 3px' }}>
                        {activeCount}
                      </span>
                    )}
                  </button>
                  {isExpanded && panels.map(p => {
                    const isActive = activePanelIds.includes(p.id);
                    const isLocked = p.tier === 'pro' && !canAccessPro;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onTogglePanel(p.id)}
                        title={isLocked ? 'PRO tier required' : p.label}
                        style={{
                          width: '100%', textAlign: 'left',
                          background: isActive ? 'rgba(0,204,255,0.06)' : 'transparent',
                          border: 'none',
                          padding: '4px 8px 4px 22px',
                          display: 'flex', alignItems: 'center', gap: 6,
                          color: isLocked ? '#3a3a4a' : isActive ? '#00ccff' : '#888',
                          cursor: isLocked ? 'not-allowed' : 'pointer', fontSize: 10,
                          opacity: isLocked ? 0.5 : 1,
                        }}
                      >
                        <span style={{
                          width: 6, height: 6, borderRadius: 0,
                          background: isLocked ? '#2a2a2a' : isActive ? '#00ff88' : '#333',
                          flexShrink: 0,
                        }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {p.label}
                        </span>
                        {isLocked
                          ? <Lock size={8} color="#ffaa00" style={{ flexShrink: 0 }} />
                          : p.tier === 'pro' && <span style={{ marginLeft: 'auto', fontSize: 8, color: '#ffaa00' }}>PRO</span>
                        }
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Monitor Presets */}
            <SectionHeader label="SAVED LAYOUTS" />
            {savedLayouts.map(l => (
              <div key={l.name} style={{ display: 'flex', alignItems: 'center', padding: '2px 8px 2px 12px', gap: 4 }}>
                <button
                  onClick={() => handleLoadLayout(l)}
                  style={{
                    flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                    padding: '3px 0', color: '#666680', cursor: 'pointer', fontSize: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Layout size={9} color="#333" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 7, color: '#333' }}>{l.panels.length}p</span>
                </button>
                <button onClick={() => handleDeleteLayout(l.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 2 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff3355'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#333'; }}>
                  <Trash2 size={8} />
                </button>
              </div>
            ))}

            {saveInputVisible ? (
              <div style={{ padding: '4px 8px', display: 'flex', gap: 4 }}>
                <input
                  value={newLayoutName}
                  onChange={e => setNewLayoutName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveLayout()}
                  placeholder="Layout name..."
                  autoFocus
                  style={{
                    flex: 1, background: '#0d0d18', border: '1px solid #1a1a2e',
                    color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 5px',
                    outline: 'none',
                  }}
                />
                <button onClick={handleSaveLayout} style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', color: '#00ff88', cursor: 'pointer', fontSize: 9, padding: '0 6px' }}>
                  <Save size={9} />
                </button>
              </div>
            ) : (
              <button onClick={() => setSaveInputVisible(true)} style={{
                width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                padding: '4px 12px', color: '#00ccff', cursor: 'pointer', fontSize: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Save size={9} /> Save Current Layout
              </button>
            )}

            {/* Quick Actions */}
            <SectionHeader label="QUICK ACTIONS" />
            {[
              { label: 'Open AI Analyst', icon: '▶', onClick: onOpenAI },
              { label: 'Panel Search (Ctrl+K)', icon: '▶', onClick: onOpenPanelSearch },
              { label: `Load ${monitorContext} Panels`, icon: '▶', onClick: () => onLoadContextPanels?.(monitorContext) },
              { label: 'New Alert Rule', icon: '▶', onClick: () => onOpenAlerts?.() },
            ].map(a => (
              <button key={a.label} style={{
                width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none',
                padding: '4px 12px', color: '#666680',
                cursor: 'pointer', fontSize: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }} onClick={a.onClick}>
                <span style={{ color: '#00ccff' }}>{a.icon}</span> {a.label}
              </button>
            ))}
          </div>

          {/* AI Quick Bar */}
          <div style={{
            borderTop: '1px solid #1a1a2e',
            padding: 8,
            background: '#0d0d18',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 9, color: '#00ccff', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⬡ ASK THE ANALYST
            </div>
            {[
              "What's moving markets today?",
              'Analyze geopolitical risk',
              'Generate morning brief',
              'Show oil price signals',
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => onAIPrompt ? onAIPrompt(prompt) : onOpenAI()}
                style={{
                  width: '100%', background: 'transparent',
                  border: '1px solid #1a1a2e', padding: '4px 7px',
                  color: '#555', cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 3,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e8e8e8'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#00ccff44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a2e'; }}
              >
                <span>{prompt}</span>
                <span style={{ color: '#00ccff', fontSize: 9 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 8px 4px',
      fontSize: 9, color: '#444', letterSpacing: 2,
      borderTop: '1px solid #1a1a2e',
      fontWeight: 700,
    }}>
      {label}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  cursor: 'pointer', color: '#666680',
  width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};