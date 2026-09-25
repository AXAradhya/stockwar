import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, User } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

interface CongressTrade {
  id: string;
  member: string;
  party: 'R' | 'D' | 'I';
  chamber: 'SENATE' | 'HOUSE';
  state: string;
  ticker: string;
  company: string;
  action: 'PURCHASE' | 'SALE' | 'PARTIAL_SALE';
  amount: string;
  reportDate: string;
  tradeDate: string;
  daysDelay: number;
  committee: string;
  flagged: boolean;
  flagReason?: string;
}

// Mock trade data removed — frontend should not ship randomized mock political trading data.

const PARTY_COLORS: Record<string, string> = { R: '#ff3355', D: '#00ccff', I: '#a78bfa' };
const ACTION_COLORS: Record<string, string> = { PURCHASE: '#00ff88', SALE: '#ff3355', PARTIAL_SALE: '#ffaa00' };

export function CongressionalTradingPanel() {
  // Fallbacks disabled in frontend; require a configured data source or server-side proxy.
  const ALLOW_FALLBACKS = false;
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'FLAGGED' | 'SENATE' | 'HOUSE'>('ALL');
  const [selected, setSelected] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!trades || trades.length === 0) return { totalVolume: 'N/A', flaggedCount: 0, avgDelay: 0, purchases: 0 };
    const flaggedCount = trades.filter(t => t.flagged).length;
    const avgDelay = Math.floor(trades.reduce((a, t) => a + t.daysDelay, 0) / trades.length);
    const purchases = trades.filter(t => t.action === 'PURCHASE').length;
    return { totalVolume: '—', flaggedCount, avgDelay, purchases };
  }, [trades]);
  const region = useUiStore(s => s.region);

  if (region !== 'GLOBAL' && region !== 'AMERICAS') {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ff3355" />
        <span style={{ color: '#ff3355', letterSpacing: 1 }}>REGION NOT SUPPORTED</span>
        <span style={{ textAlign: 'center' }}>Congressional trading data is only available for US/Americas.</span>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ffaa00" />
        <span style={{ color: '#ffaa00', letterSpacing: 1 }}>DATA NOT CONFIGURED</span>
        <span style={{ textAlign: 'center' }}>Congressional trading data source is not configured. Configure a secure backend data source or provide a server-side proxy.</span>
      </div>
    );
  }

  const filtered = trades.filter(t => {
    if (filter === 'FLAGGED') return t.flagged;
    if (filter === 'SENATE') return t.chamber === 'SENATE';
    if (filter === 'HOUSE') return t.chamber === 'HOUSE';
    return true;
  });

  const selectedTrade = trades.find(t => t.id === selected);
  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'TOTAL VOL.', value: stats.totalVolume, color: '#e8e8e8' },
          { label: 'FLAGGED', value: stats.flaggedCount.toString(), color: '#ff3355' },
          { label: 'AVG DELAY', value: `${stats.avgDelay}d`, color: '#ffaa00' },
          { label: 'PURCHASES', value: stats.purchases.toString(), color: '#00ff88' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
            <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['ALL', 'FLAGGED', 'SENATE', 'HOUSE'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 8,
            background: filter === f ? '#1a1a2e' : 'transparent',
            color: filter === f ? (f === 'FLAGGED' ? '#ff3355' : '#00ccff') : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono',
            borderBottom: filter === f ? `2px solid ${f === 'FLAGGED' ? '#ff3355' : '#00ccff'}` : '2px solid transparent',
          }}>{f}</button>
        ))}
      </div>

      {/* Selected trade detail */}
      {selectedTrade?.flagged && selectedTrade.flagReason && (
        <div style={{ padding: '4px 8px', background: 'rgba(255,51,85,0.06)', borderBottom: '1px solid rgba(255,51,85,0.15)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <AlertTriangle size={9} color="#ff3355" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: '#ff8888' }}>{selectedTrade.flagReason}</span>
        </div>
      )}

      {/* Trade list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((trade) => (
          <div
            key={trade.id}
            onClick={() => setSelected(trade.id === selected ? null : trade.id)}
            style={{
              padding: '5px 8px', borderBottom: '1px solid #0a0a12', cursor: 'pointer',
              background: selected === trade.id ? '#0f0f1a' : 'transparent',
              borderLeft: trade.flagged ? '2px solid #ff335544' : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={9} color={PARTY_COLORS[trade.party]} />
                <span style={{ fontSize: 9, color: '#e8e8e8' }}>{trade.member}</span>
                <span style={{ fontSize: 7, color: PARTY_COLORS[trade.party], border: `1px solid ${PARTY_COLORS[trade.party]}33`, padding: '1px 3px' }}>{trade.party}</span>
                {trade.flagged && <AlertTriangle size={8} color="#ff3355" />}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 8, color: ACTION_COLORS[trade.action] }}>
                  {trade.action === 'PURCHASE' ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                </span>
                <span style={{ fontSize: 8, color: ACTION_COLORS[trade.action] }}>{trade.action.replace('_', ' ')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#555' }}>
              <span style={{ color: '#00ccff' }}>{trade.ticker}</span>
              <span>{trade.amount}</span>
              <span style={{ color: '#333' }}>{trade.chamber}</span>
              <span style={{ marginLeft: 'auto', color: trade.daysDelay > 15 ? '#ff8800' : '#333' }}>
                +{trade.daysDelay}d delay
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>HOUSE CLERK · EFTS · QUIVER QUANT</span>
        <span style={{ color: '#a78bfa' }}>● T4</span>
      </div>
    </div>
  );
}
