import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fetchYahooMeta } from '../../services/apiServices';
import { fmtNum, fmtPct } from '../../utils/numberFormat';
import { logToTerminal } from '../../stores/logStore';

interface Commodity {
  name: string;
  symbol: string;
  price: number;
  unit: string;
  change: number;
  changePct: number;
  category: 'AGRICULTURE' | 'BASE_METALS' | 'ENERGY' | 'LIVESTOCK';
}

// Yahoo Finance futures symbols for major commodities
const COMMODITY_SYMBOLS: { name: string; symbol: string; unit: string; category: Commodity['category'] }[] = [
  { name: 'Wheat', symbol: 'ZW=F', unit: '/bu', category: 'AGRICULTURE' },
  { name: 'Corn', symbol: 'ZC=F', unit: '/bu', category: 'AGRICULTURE' },
  { name: 'Soybeans', symbol: 'ZS=F', unit: '/bu', category: 'AGRICULTURE' },
  { name: 'Coffee', symbol: 'KC=F', unit: '/lb', category: 'AGRICULTURE' },
  { name: 'Sugar', symbol: 'SB=F', unit: '/lb', category: 'AGRICULTURE' },
  { name: 'Cotton', symbol: 'CT=F', unit: '/lb', category: 'AGRICULTURE' },
  { name: 'Copper', symbol: 'HG=F', unit: '/lb', category: 'BASE_METALS' },
  { name: 'Live Cattle', symbol: 'LE=F', unit: '/cwt', category: 'LIVESTOCK' },
  { name: 'Lean Hogs', symbol: 'HE=F', unit: '/cwt', category: 'LIVESTOCK' },
  { name: 'WTI Crude', symbol: 'CL=F', unit: '/bbl', category: 'ENERGY' },
  { name: 'Brent Crude', symbol: 'BZ=F', unit: '/bbl', category: 'ENERGY' },
  { name: 'Nat Gas', symbol: 'NG=F', unit: '/MMBtu', category: 'ENERGY' },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  AGRICULTURE: { label: 'AGRICULTURE', color: '#00ff88' },
  BASE_METALS: { label: 'BASE METALS', color: '#ffaa00' },
  ENERGY: { label: 'ENERGY', color: '#ff8800' },
  LIVESTOCK: { label: 'LIVESTOCK', color: '#a78bfa' },
};

async function fetchYahooCommodity(symbol: string) {
  const meta = await fetchYahooMeta(symbol);
  return {
    price: meta.regularMarketPrice,
    change: meta.regularMarketChange,
    changePct: meta.regularMarketChangePercent,
  };
}

export function CommoditiesDashboardPanel({ refreshKey }: { refreshKey?: number }) {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'AGRICULTURE' | 'BASE_METALS' | 'ENERGY' | 'LIVESTOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'change' | 'price'>('change');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await Promise.allSettled(
          COMMODITY_SYMBOLS.map(async (c) => {
            try {
              const data = await fetchYahooCommodity(c.symbol);
              return {
                ...c,
                price: data.price,
                change: data.change,
                changePct: data.changePct,
              };
            } catch (e: any) {
              console.warn(`Failed to fetch ${c.symbol}:`, e.message);
              return null;
            }
          })
        );
        
        if (!mounted) return;
        
        const valid = results
          .filter((r): r is PromiseFulfilledResult<Commodity> => r.status === 'fulfilled' && r.value !== null)
          .map(r => r.value);

        if (valid.length === 0) {
          logToTerminal('WARN', 'Panel:Commodities', 'All commodity fetches failed');
          if (mounted) {
            setCommodities([]);
            setLoading(false);
          }
          return;
        }

        setCommodities(valid);
        setLoading(false);
      } catch (e: any) {
        console.error('Failed to load commodities', e);
        if (mounted) {
          setError(e.message || 'Failed to load commodity data');
          setLoading(false);
        }
      }
    };

    loadData();
    const t = setInterval(loadData, 120000); // 2 minute refresh
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshKey]);

  const filtered = commodities.filter(c => filter === 'ALL' || c.category === filter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'change' ? Math.abs(b.changePct) - Math.abs(a.changePct) : b.price - a.price
  );

  // Summary stats
  const gainers = commodities.filter(c => c.changePct > 0).length;
  const losers = commodities.filter(c => c.changePct < 0).length;
  const topMover = commodities.length > 0 ? [...commodities].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0] : null;

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && commodities.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING COMMODITIES...</div>;
  }

  if (error && commodities.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} /> ERROR: {error}
      </div>
    );
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>GAINERS</div>
          <div style={{ fontSize: 15, color: '#00ff88', fontWeight: 700 }}>{gainers}</div>
        </div>
        <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>LOSERS</div>
          <div style={{ fontSize: 15, color: '#ff3355', fontWeight: 700 }}>{losers}</div>
        </div>
        <div style={{ flex: 2, padding: '5px 8px', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>TOP MOVER</div>
          {topMover ? (
            <div style={{ fontSize: 11, color: topMover.changePct >= 0 ? '#00ff88' : '#ff3355', fontWeight: 700 }}>
              {topMover.name} {fmtPct(topMover.changePct, 2)}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#333' }}>—</div>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0, overflowX: 'auto' }}>
        {(['ALL', 'AGRICULTURE', 'BASE_METALS', 'ENERGY', 'LIVESTOCK'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 8px', border: 'none', cursor: 'pointer', fontSize: 8, whiteSpace: 'nowrap',
            background: filter === f ? '#1a1a2e' : 'transparent',
            color: filter === f ? (f === 'ALL' ? '#00ccff' : CATEGORY_LABELS[f]?.color || '#00ccff') : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono',
            borderBottom: filter === f ? `2px solid ${f === 'ALL' ? '#00ccff' : CATEGORY_LABELS[f]?.color || '#00ccff'}` : '2px solid transparent',
          }}>{f.replace('_', ' ')}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setSortBy(s => s === 'change' ? 'price' : 'change')} style={{
          padding: '4px 8px', border: 'none', cursor: 'pointer', fontSize: 8, background: 'transparent',
          color: '#444', letterSpacing: 1, fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap',
        }}>⇅ {sortBy.toUpperCase()}</button>
      </div>

      {/* Column header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 50px', padding: '3px 8px', fontSize: 7, color: '#333', borderBottom: '1px solid #0f0f18', flexShrink: 0 }}>
        <span>COMMODITY</span><span style={{ textAlign: 'right' }}>PRICE</span><span style={{ textAlign: 'right' }}>CHG%</span><span style={{ textAlign: 'right' }}>CAT</span>
      </div>

      {/* Commodity rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No commodity data available. Check network connection.
          </div>
        ) : (
          sorted.map((c) => (
            <div key={c.symbol} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 50px', padding: '4px 8px', fontSize: 9, borderBottom: '1px solid #0a0a12', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#e8e8e8' }}>{c.name}</span>
                <span style={{ fontSize: 7, color: '#333', marginLeft: 4 }}>{c.symbol.replace('=F', '')}</span>
              </div>
              <span style={{ textAlign: 'right', color: '#e8e8e8' }}>{fmtNum(c.price, c.price > 100 ? 0 : 2)}<span style={{ fontSize: 7, color: '#444' }}>{c.unit}</span></span>
              <span style={{ textAlign: 'right', color: c.changePct >= 0 ? '#00ff88' : '#ff3355' }}>
                {fmtPct(c.changePct, 2)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 7, color: CATEGORY_LABELS[c.category]?.color || '#888' }}>
                {c.category === 'BASE_METALS' ? 'METALS' : c.category.slice(0, 4)}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>YAHOO FINANCE FUTURES</span>
        <span style={{ color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
