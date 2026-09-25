import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Palette, RefreshCw, BarChart2, Eye, Database, Tv } from 'lucide-react';
import { usePanelCustomizeStore } from '../../stores/panelCustomizeStore';
import { toast } from 'sonner';

interface WidgetCustomizeModalProps {
  open: boolean;
  onClose: () => void;
  panelId: string;
  panelTitle: string;
  panelCategory: string;
}

const ACCENT_COLORS = [
  { name: 'Cyber Green', value: '#00ff88' },
  { name: 'Terminal Blue', value: '#00ccff' },
  { name: 'Alert Red', value: '#ff3355' },
  { name: 'Amber', value: '#ffaa00' },
  { name: 'Purple', value: '#a78bfa' },
  { name: 'India Orange', value: '#FF9933' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'White', value: '#e8e8e8' },
  { name: 'Steel', value: '#94a3b8' },
];

const BG_TINTS = [
  { name: 'Dark (Default)', value: '#0d0d18' },
  { name: 'Deep Blue', value: '#080c1a' },
  { name: 'Dark Green', value: '#081208' },
  { name: 'Dark Red', value: '#180808' },
  { name: 'Midnight Purple', value: '#100818' },
  { name: 'India (Saffron Hint)', value: '#180e06' },
];

const CHART_TYPES = ['line', 'bar', 'area', 'candlestick'] as const;
const REFRESH_INTERVALS = [5, 10, 15, 30, 60, 120, 300];

const NEWS_SOURCES = ['Reuters', 'Bloomberg', 'AP', 'IDF', 'SEC', 'ECB', 'Morgan Stanley', 'NDTV', 'Economic Times', 'LiveMint'];
const SEVERITY_OPTS = ['critical', 'high', 'medium', 'low'];
const INDICES_GLOBAL = ['SPX', 'NDX', 'DJI', 'RUT', 'VIX', 'FTSE', 'DAX', 'NIKKEI'];
const INDICES_INDIA = ['NIFTY50', 'SENSEX', 'BANKNIFTY', 'NIFTY500', 'MIDCAP'];

// Category-specific options
function getCategoryOptions(category: string, panelId: string) {
  const isMarket = ['MARKETS', 'CRYPTO', 'COMMODITIES'].includes(category);
  const isNews = category === 'NEWS' && panelId !== 'live_news_youtube';
  const isIndia = category === 'INDIA';
  const isYouTube = panelId === 'live_news_youtube';
  return { isMarket, isNews, isIndia, isYouTube };
}

const S: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#0a0a12', border: '1px solid #1a1a2e', width: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 0 60px rgba(0,200,255,0.08)' },
  header: { padding: '8px 14px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  section: { padding: '8px 14px 4px', fontSize: 8, color: '#444', letterSpacing: 2, borderBottom: '1px solid #0f0f18', display: 'flex', alignItems: 'center', gap: 6 },
  row: { padding: '8px 14px', borderBottom: '1px solid #0a0a12', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 10, color: '#888' },
  sublabel: { fontSize: 8, color: '#333', marginTop: 2 },
  select: { background: '#0d0d18', border: '1px solid #1a1a2e', color: '#00ccff', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 6px', cursor: 'pointer' },
  footer: { padding: '10px 14px', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btn: { background: '#0d0d18', border: '1px solid #1a1a2e', padding: '6px 14px', color: '#e8e8e8', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 },
  btnGreen: { background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', padding: '6px 14px', color: '#00ff88', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 },
  btnRed: { background: 'rgba(255,51,85,0.08)', border: '1px solid #ff335522', padding: '6px 14px', color: '#ff3355', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 },
};

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 30, height: 15, background: value ? '#00ff8822' : '#1a1a2e', border: `1px solid ${value ? '#00ff88' : '#333'}`, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 'calc(100% - 12px)' : '2px', width: 10, height: 10, background: value ? '#00ff88' : '#333', transition: 'left 0.2s' }} />
    </div>
  );
}

export function WidgetCustomizeModal({ open, onClose, panelId, panelTitle, panelCategory }: WidgetCustomizeModalProps) {
  const { getCustomization, setCustomization, resetCustomization } = usePanelCustomizeStore();
  const [local, setLocal] = useState(getCustomization(panelId));
  const { isMarket, isNews, isYouTube } = getCategoryOptions(panelCategory, panelId);

  useEffect(() => {
    if (open) setLocal(getCustomization(panelId));
  }, [open, panelId]);

  if (!open) return null;

  const update = (k: keyof typeof local, v: unknown) => setLocal(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setCustomization(panelId, local);
    toast.success(`Widget customized: ${panelTitle}`);
    onClose();
  };

  const handleReset = () => {
    resetCustomization(panelId);
    setLocal({});
    toast.info(`Reset to defaults: ${panelTitle}`);
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontSize: 10, color: '#00ccff', letterSpacing: 2 }}>⚙ CUSTOMIZE WIDGET</div>
            <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>{panelTitle.toUpperCase()} · {panelCategory}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* APPEARANCE */}
          <div style={S.section}><Palette size={9} /> APPEARANCE</div>

          {/* Accent Color */}
          <div style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={S.label}>Accent Color</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ACCENT_COLORS.map(c => (
                <div
                  key={c.value}
                  onClick={() => update('accentColor', c.value)}
                  title={c.name}
                  style={{
                    width: 24, height: 24,
                    background: c.value,
                    border: local.accentColor === c.value ? `2px solid white` : '2px solid transparent',
                    cursor: 'pointer',
                    outline: local.accentColor === c.value ? `1px solid ${c.value}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
              {/* Custom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 8, color: '#444' }}>Custom:</span>
                <input
                  type="color"
                  value={local.accentColor || '#00ff88'}
                  onChange={e => update('accentColor', e.target.value)}
                  style={{ width: 24, height: 24, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Background Tint */}
          <div style={S.row}>
            <div>
              <div style={S.label}>Background Tint</div>
              <div style={S.sublabel}>Panel background color</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {BG_TINTS.map(b => (
                <div
                  key={b.value}
                  onClick={() => update('bgTint', b.value)}
                  title={b.name}
                  style={{ width: 18, height: 18, background: b.value, border: local.bgTint === b.value ? '2px solid #fff' : '1px solid #333', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>

          {/* Compact Mode */}
          <div style={S.row}>
            <div>
              <div style={S.label}>Compact Mode</div>
              <div style={S.sublabel}>Reduce padding and font sizes</div>
            </div>
            <Toggle value={!!local.compactMode} onToggle={() => update('compactMode', !local.compactMode)} />
          </div>

          {/* DATA */}
          <div style={S.section}><RefreshCw size={9} /> DATA & REFRESH</div>

          {/* Refresh Interval */}
          <div style={S.row}>
            <div>
              <div style={S.label}>Refresh Interval</div>
              <div style={S.sublabel}>How often data updates</div>
            </div>
            <select
              value={local.refreshInterval || 15}
              onChange={e => update('refreshInterval', Number(e.target.value))}
              style={S.select}
            >
              {REFRESH_INTERVALS.map(v => (
                <option key={v} value={v}>{v}s — {v < 60 ? 'Real-time' : v < 120 ? 'Near-RT' : 'Periodic'}</option>
              ))}
            </select>
          </div>

          {/* Show Volume */}
          <div style={S.row}>
            <div style={S.label}>Show Volume / Volume Bars</div>
            <Toggle value={local.showVolume !== false} onToggle={() => update('showVolume', !local.showVolume)} />
          </div>

          {/* Show Change % */}
          <div style={S.row}>
            <div style={S.label}>Show Change %</div>
            <Toggle value={local.showChange !== false} onToggle={() => update('showChange', !local.showChange)} />
          </div>

          {/* CHART OPTIONS — market panels */}
          {isMarket && (
            <>
              <div style={S.section}><BarChart2 size={9} /> CHART</div>
              {/* TradingView chart symbol for chart panels */}
              {panelId.startsWith('tradingview_chart') && (
                <div style={S.row}>
                  <div>
                    <div style={S.label}>Chart Symbol</div>
                    <div style={S.sublabel}>Enter ticker (e.g. AAPL or NSE:RELIANCE)</div>
                  </div>
                  <input
                    value={(local as any).chartSymbol || ''}
                    onChange={e => update('chartSymbol', e.target.value)}
                    placeholder="AAPL"
                    style={{ ...S.select, width: 160 }}
                  />
                </div>
              )}
              <div style={S.row}>
                <div style={S.label}>Chart Type</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {CHART_TYPES.map(ct => (
                    <button
                      key={ct}
                      onClick={() => update('chartType', ct)}
                      style={{
                        ...S.btn,
                        background: local.chartType === ct ? 'rgba(0,255,136,0.1)' : '#0d0d18',
                        color: local.chartType === ct ? '#00ff88' : '#666',
                        border: `1px solid ${local.chartType === ct ? '#00ff8844' : '#1a1a2e'}`,
                        padding: '3px 8px', gap: 0,
                      }}
                    >{ct.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={S.label}>Active Indices</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[...INDICES_GLOBAL, ...INDICES_INDIA].map(idx => {
                    const selected = (local.selectedIndices || INDICES_GLOBAL).includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const cur = local.selectedIndices || INDICES_GLOBAL;
                          update('selectedIndices', selected ? cur.filter(i => i !== idx) : [...cur, idx]);
                        }}
                        style={{
                          ...S.btn,
                          background: selected ? 'rgba(0,200,255,0.1)' : '#0d0d18',
                          color: selected ? '#00ccff' : '#555',
                          border: `1px solid ${selected ? '#00ccff33' : '#1a1a2e'}`,
                          padding: '2px 7px', gap: 0, fontSize: 8,
                        }}
                      >{idx}</button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* NEWS OPTIONS */}
          {isNews && (
            <>
              <div style={S.section}><Eye size={9} /> NEWS FILTERS</div>
              <div style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={S.label}>News Sources</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {NEWS_SOURCES.map(src => {
                    const selected = !(local.sourceFilter) || local.sourceFilter.includes(src);
                    return (
                      <button key={src} onClick={() => {
                        const cur = local.sourceFilter || NEWS_SOURCES;
                        update('sourceFilter', selected ? cur.filter(s => s !== src) : [...cur, src]);
                      }} style={{ ...S.btn, background: selected ? 'rgba(0,255,136,0.08)' : '#0d0d18', color: selected ? '#00ff88' : '#444', border: `1px solid ${selected ? '#00ff8822' : '#1a1a2e'}`, padding: '2px 7px', gap: 0, fontSize: 8 }}>
                        {src}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={S.label}>Severity Filter</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {SEVERITY_OPTS.map(s => {
                    const colors: Record<string, string> = { critical: '#ff3355', high: '#ffaa00', medium: '#00ccff', low: '#666680' };
                    const selected = !(local.severityFilter) || local.severityFilter.includes(s);
                    return (
                      <button key={s} onClick={() => {
                        const cur = local.severityFilter || SEVERITY_OPTS;
                        update('severityFilter', selected ? cur.filter(x => x !== s) : [...cur, s]);
                      }} style={{ ...S.btn, background: selected ? `${colors[s]}18` : '#0d0d18', color: selected ? colors[s] : '#444', border: `1px solid ${selected ? `${colors[s]}33` : '#1a1a2e'}`, padding: '3px 8px', gap: 0 }}>
                        {s.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* YOUTUBE OPTIONS */}
          {isYouTube && (
            <>
              <div style={S.section}><Tv size={9} /> YOUTUBE CHANNELS</div>
              <div style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={S.label}>Custom Channels</div>
                <div style={S.sublabel}>Provide YouTube Video ID (e.g. mHKFBNoWHx0)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {(local.youtubeChannels || []).map((ch, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 4 }}>
                      <input value={ch.name} onChange={e => {
                        const newCh = [...(local.youtubeChannels || [])];
                        newCh[idx].name = e.target.value;
                        update('youtubeChannels', newCh);
                      }} placeholder="Name" style={{ ...S.select, flex: 1 }} />
                      <input value={ch.id} onChange={e => {
                        const newCh = [...(local.youtubeChannels || [])];
                        newCh[idx].id = e.target.value;
                        update('youtubeChannels', newCh);
                      }} placeholder="Video ID" style={{ ...S.select, width: 80 }} />
                      <select value={ch.category} onChange={e => {
                        const newCh = [...(local.youtubeChannels || [])];
                        newCh[idx].category = e.target.value;
                        update('youtubeChannels', newCh);
                      }} style={{ ...S.select, width: 80 }}>
                        <option value="GLOBAL">GLOBAL</option>
                        <option value="INDIA">INDIA</option>
                        <option value="FINANCE">FINANCE</option>
                      </select>
                      <button onClick={() => {
                        const newCh = [...(local.youtubeChannels || [])];
                        newCh.splice(idx, 1);
                        update('youtubeChannels', newCh);
                      }} style={{ ...S.btnRed, padding: '3px 6px' }}><X size={9} /></button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newCh = [...(local.youtubeChannels || []), { name: 'New Channel', id: '', category: 'GLOBAL' }];
                    update('youtubeChannels', newCh);
                  }} style={{ ...S.btn, marginTop: 4, alignSelf: 'flex-start' }}>+ Add Channel</button>
                </div>
              </div>
            </>
          )}

          {/* DATA SOURCE */}
          <div style={S.section}><Database size={9} /> DATA SOURCE</div>
          <div style={S.row}>
            <div>
              <div style={S.label}>Primary Data Source</div>
              <div style={S.sublabel}>Select API preference</div>
            </div>
            <select value={local.dataSource || 'auto'} onChange={e => update('dataSource', e.target.value)} style={S.select}>
              <option value="auto">Auto (Best Available)</option>
              <option value="realtime">Real-Time (Premium)</option>
              <option value="delayed">15-min Delayed</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button onClick={handleReset} style={S.btnRed}>
            <RotateCcw size={11} /> RESET DEFAULTS
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={S.btn}>CANCEL</button>
            <button onClick={handleSave} style={S.btnGreen}>
              <Save size={11} /> SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
