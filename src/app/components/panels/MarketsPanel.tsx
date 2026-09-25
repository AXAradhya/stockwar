import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { fetchMarketIndices, fetchTopMovers } from '../../services/apiServices';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUiStore } from '../../stores/uiStore';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

export function MarketsPanel({ refreshKey }: { refreshKey?: number }) {
  const [liveIndices, setLiveIndices] = useState<any[]>([]);
  const [liveMovers, setLiveMovers] = useState<any[]>([]);
  const prevMovers = useRef<Record<string, number>>({});
  const { openWorkspace } = useWorkspaceStore();
  const [flashedMovers, setFlashedMovers] = useState<Record<string, 'up' | 'down' | null>>({});
  const [sparklineData, setSparklineData] = useState<Record<string, { v: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const region = useUiStore(s => s.region);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [indices, movers] = await Promise.all([
          fetchMarketIndices(region),
          fetchTopMovers(),
        ]);
        if (!mounted) return;
        setLiveIndices(indices);
        setLoading(false);
        setError(null);
        
        // Sparkline data: will be populated via future historical endpoint
        // No fake data generated here

        // handle flashes
        const newFlashes: Record<string, 'up' | 'down' | null> = {};
        const updatedMovers = movers.map((m: { ticker: string; price: number; name?: string; change?: number; changePct?: number; volume?: string }) => {
          const oldPrice = prevMovers.current[m.ticker] || m.price;
          const dir = m.price > oldPrice ? 'up' : 'down';
          prevMovers.current[m.ticker] = m.price;
          if (m.price !== oldPrice) newFlashes[m.ticker] = dir;
          return m;
        });
        
        setLiveMovers(updatedMovers);
        setFlashedMovers(prev => ({ ...prev, ...newFlashes }));
        
        setTimeout(() => {
          if (mounted) setFlashedMovers({});
        }, 500);

      } catch (e: any) {
        console.error('Failed to load market data', e);
        if (mounted) {
          setError(e.message || 'Failed to load market indices');
          setLoading(false);
        }
      }
    };
    loadData();
    const t = setInterval(loadData, 60000); // 1 minute refresh
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [region, refreshKey]);

  if (loading && liveIndices.length === 0) {
    return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING MARKETS...</div>;
  }

  if (error && liveIndices.length === 0) {
    return <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}>ERROR: {error}</div>;
  }

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Index Grid */}
      <div style={{
        padding: '3px 0',
        borderBottom: '1px solid #1a1a2e',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
      }}>
        {liveIndices.filter(m => m && m.price != null && !isNaN(m.price)).map(m => {
          const up = (m.change ?? 0) >= 0;
          const color = m.ticker === 'VIX' ? (up ? '#ff3355' : '#00ff88') : (up ? '#00ff88' : '#ff3355');
          return (
            <div key={m.ticker} style={{ padding: '3px 6px', borderRight: '1px solid #1a1a2e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#555', letterSpacing: 1 }}>
                  {m.ticker}
                </span>
                <div style={{ width: 44, height: 14 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData[m.ticker] || []}>
                      <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#e8e8e8', letterSpacing: 0.3 }}>
                {fmtNum(m.price, 2)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {up ? <TrendingUp size={7} color={color} /> : <TrendingDown size={7} color={color} />}
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color }}>{fmtPct(m.changePct)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Movers header */}
      <div style={{
        padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 6,
        borderBottom: '1px solid #1a1a2e',
        background: '#0f0f1a',
      }}>
        <Activity size={9} color="#666680" />
        <span style={{ fontSize: 8, color: '#444', letterSpacing: 1, fontFamily: 'JetBrains Mono' }}>TOP MOVERS</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, color: '#333', fontFamily: 'JetBrains Mono' }}>
          LIVE ● {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Movers table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 72px 58px 58px',
        padding: '2px 8px',
        fontFamily: 'JetBrains Mono', fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span>TICK</span>
        <span>NAME</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
        <span style={{ textAlign: 'right' }}>VOL</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {liveMovers.filter(s => s && s.price != null).map(s => {
          const up = (s.change ?? 0) >= 0;
          const color = up ? '#00ff88' : '#ff3355';
          const flash = flashedMovers[s.ticker];
          return (
            <div key={s.ticker} style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 72px 58px 58px',
              alignItems: 'center',
              padding: '4px 8px',
              borderBottom: '1px solid #0f0f18',
              gap: 4,
              background: flash === 'up'
                ? 'rgba(0,255,136,0.07)'
                : flash === 'down'
                ? 'rgba(255,51,85,0.07)'
                : 'transparent',
              transition: 'background 0.5s',
              cursor: 'pointer',
            }}
            onClick={() => openWorkspace('stock', s.ticker, s.name)}
            >
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00ccff', letterSpacing: 0.3 }}>
                {s.ticker}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>
                {fmtNum(s.price)}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color, textAlign: 'right' }}>
                {fmtPct(s.changePct)}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#444', textAlign: 'right' }}>
                {s.volume}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
