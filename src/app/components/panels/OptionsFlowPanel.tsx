import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, BarChart2, AlertTriangle } from 'lucide-react';
import { useLogStore } from '../../stores/logStore';

interface OptionsFlow {
  id: string;
  ticker: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  premium: number;
  size: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  flag: 'SWEEP' | 'BLOCK' | 'DARK_POOL' | 'UNUSUAL';
  timestamp: string;
}

const FLAG_COLORS: Record<string, string> = {
  SWEEP: '#ff3355',
  BLOCK: '#ffaa00',
  DARK_POOL: '#a78bfa',
  UNUSUAL: '#00ccff',
};

const FLAG_LABELS: Record<string, string> = {
  SWEEP: '⚡ SWEEP',
  BLOCK: '█ BLOCK',
  DARK_POOL: '◈ DARK',
  UNUSUAL: '★ UNUSUAL',
};

export function OptionsFlowPanel({ refreshKey }: { refreshKey?: number }) {
  const [flows, setFlows] = useState<OptionsFlow[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CALL' | 'PUT'>('ALL');
  const [topStats, setTopStats] = useState({ bullishPct: 0, totalPremium: 0, sweeps: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useLogStore();

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      // Options flow data requires a premium API (Unusual Whales, Cheddar Flow, Polygon.io, etc.)
      // No free API available for real-time options flow data
      if (mounted) {
        setLoading(false);
        setError('OPTIONS_FLOW_API_REQUIRED');
      }
    };

    loadData();
    const t = setInterval(loadData, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshKey]);

  const filtered = filter === 'ALL' ? flows : flows.filter(f => f.type === filter);

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (error === 'OPTIONS_FLOW_API_REQUIRED') {
    return (
      <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <AlertTriangle size={24} color="#ffaa00" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 11, color: '#ffaa00', marginBottom: 8, fontWeight: 'bold' }}>OPTIONS FLOW API REQUIRED</div>
        <div style={{ fontSize: 9, color: '#666', lineHeight: 1.5, maxWidth: 280 }}>
          Real-time options flow data requires a premium API subscription.
          <br/><br/>
          Supported providers:
          <br/>• Unusual Whales
          <br/>• Tradytics
          <br/>• Polygon.io
          <br/><br/>
          Configure your API key in Settings → API Keys
        </div>
      </div>
    );
  }

  if (loading && flows.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING OPTIONS FLOW...</div>;
  }

  if (error && flows.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9 }}>ERROR: {error}</div>;
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top stats bar */}
      <div style={{ display: 'flex', gap: 1, borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'BULL FLOW', value: `${topStats.bullishPct}%`, color: '#00ff88', icon: <TrendingUp size={9} /> },
          { label: 'BEAR FLOW', value: `${100 - topStats.bullishPct}%`, color: '#ff3355', icon: <TrendingDown size={9} /> },
          { label: 'PREMIUM', value: `$${topStats.totalPremium}M`, color: '#ffaa00', icon: <BarChart2 size={9} /> },
          { label: 'SWEEPS', value: topStats.sweeps.toString(), color: '#ff3355', icon: <Zap size={9} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', background: '#09090f', borderRight: '1px solid #1a1a2e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#444', fontSize: 8, marginBottom: 2 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['ALL', 'CALL', 'PUT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
              background: filter === f ? '#1a1a2e' : 'transparent',
              color: filter === f ? (f === 'CALL' ? '#00ff88' : f === 'PUT' ? '#ff3355' : '#00ccff') : '#444',
              letterSpacing: 1, fontFamily: 'JetBrains Mono',
              borderBottom: filter === f ? `2px solid ${f === 'CALL' ? '#00ff88' : f === 'PUT' ? '#ff3355' : '#00ccff'}` : '2px solid transparent',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Column header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px 70px 80px', padding: '3px 8px', fontSize: 8, color: '#333', borderBottom: '1px solid #0f0f18', flexShrink: 0 }}>
        <span>TICKER / TYPE</span><span style={{ textAlign: 'right' }}>STRIKE</span><span style={{ textAlign: 'right' }}>EXPIRY</span><span style={{ textAlign: 'right' }}>PREM</span><span style={{ textAlign: 'right' }}>SIZE</span><span style={{ textAlign: 'right' }}>FLAG</span>
      </div>

      {/* Flow list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No options flow data available.<br/>
            Configure an options data API in Settings.
          </div>
        ) : (
          filtered.map((flow, i) => (
            <div
              key={flow.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px 70px 80px',
                padding: '4px 8px', fontSize: 9,
                borderBottom: '1px solid #0a0a12',
                background: i === 0 ? 'rgba(0,204,255,0.03)' : 'transparent',
                animation: i === 0 ? 'fadeIn 0.3s' : 'none',
              }}
            >
              <div>
                <span style={{ color: '#e8e8e8', marginRight: 6 }}>{flow.ticker}</span>
                <span style={{ color: flow.type === 'CALL' ? '#00ff88' : '#ff3355', fontSize: 8 }}>
                  {flow.type}
                </span>
              </div>
              <span style={{ textAlign: 'right', color: '#888' }}>${flow.strike}</span>
              <span style={{ textAlign: 'right', color: '#666' }}>{flow.expiry}</span>
              <span style={{ textAlign: 'right', color: '#ffaa00' }}>${flow.premium}</span>
              <span style={{ textAlign: 'right', color: '#888' }}>{flow.size.toLocaleString()}</span>
              <span style={{ textAlign: 'right', color: FLAG_COLORS[flow.flag], fontSize: 8 }}>
                {FLAG_LABELS[flow.flag]}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>DARK POOL + OPTIONS SWEEP DETECTOR</span>
        <span style={{ color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
