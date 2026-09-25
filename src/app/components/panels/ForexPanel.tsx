import { useState, useEffect } from 'react';
import { fetchForexRates } from '../../services/apiServices';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

// Region → currency pair relevance map
const REGION_PAIRS: Record<string, string[]> = {
  AMERICAS: ['EUR/USD', 'GBP/USD', 'USD/CAD', 'USD/BRL', 'USD/MXN'],
  EUROPE: ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'USD/CHF'],
  ASIA: ['USD/JPY', 'USD/CNH', 'USD/KRW', 'AUD/USD', 'AUD/JPY', 'NZD/USD'],
  AFRICA: ['USD/ZAR'],
  'MIDDLE EAST': ['EUR/USD', 'USD/JPY'],
  INDIA: ['USD/INR'],
  OCEANIA: ['AUD/USD', 'NZD/USD'],
  GLOBAL: [],
};

function isPairHighlighted(pair: string, region: string): boolean {
  if (region === 'GLOBAL') return false;
  const regionPairs = REGION_PAIRS[region] || [];
  return regionPairs.includes(pair);
}

// use fmtNum/fmtPct helpers for safe formatting

export function ForexPanel({ refreshKey }: { refreshKey?: number }) {
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { region } = useUiStore();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchForexRates();
        if (mounted) {
          setPairs(data);
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (e: any) {
        console.error('Forex fetch failed', e);
        if (mounted) {
          setError(e.message || 'Failed to fetch forex rates');
          setLoading(false);
        }
      }
    };
    load();
    // Open ExchangeRate-API updates hourly; refresh every 30 minutes
    const refresh = setInterval(load, 1800000);
    return () => { mounted = false; clearInterval(refresh); };
  }, [refreshKey]);

  const displayPairs = region === 'GLOBAL'
    ? pairs
    : [...pairs.filter(p => isPairHighlighted(p.pair, region)), ...pairs.filter(p => !isPairHighlighted(p.pair, region))];

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && pairs.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING FOREX RATES...</div>;
  }

  if (error && pairs.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} /> ERROR: {error}
      </div>
    );
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '4px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 8, color: '#444', letterSpacing: 1 }}>FOREX</span>
        <span style={{ fontSize: 9, color: '#666' }}>
          {region !== 'GLOBAL' ? `FILTERED: ${region}` : 'GLOBAL'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 7, color: '#444' }}>
          {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* Column Headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '76px 40px 1fr 80px',
        padding: '3px 8px',
        borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span>PAIR</span>
        <span>DIR</span>
        <span style={{ textAlign: 'center' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayPairs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No forex data available. Check network connection.
          </div>
        ) : (
          displayPairs.map(p => {
            const up = parseFloat(p.changePct as string) >= 0;
            const color = up ? '#00ff88' : '#ff3355';
            const highlighted = isPairHighlighted(p.pair, region);
            return (
              <div
                key={p.pair}
                style={{
                  display: 'grid', gridTemplateColumns: '76px 40px 1fr 80px',
                  alignItems: 'center', padding: '4px 8px',
                  borderBottom: '1px solid #0f0f18',
                  borderLeft: highlighted ? '2px solid #00ccff' : '2px solid transparent',
                  background: highlighted ? 'rgba(0,204,255,0.04)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 10, color: highlighted ? '#e8e8e8' : '#00ccff', letterSpacing: 0.3 }}>{p.pair}</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {up
                    ? <TrendingUp size={10} color={color} />
                    : <TrendingDown size={10} color={color} />}
                </div>
                <span style={{ fontSize: 11, color: '#e8e8e8', textAlign: 'center' }}>
                  {fmtNum(parseFloat(p.price as string), p.pair.includes('JPY') || p.pair.includes('KRW') ? 2 : p.pair.includes('CNH') ? 4 : 4)}
                </span>
                <span style={{ fontSize: 9, color, textAlign: 'right' }}>
                  {fmtPct(parseFloat(p.changePct as string), 3)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 12, fontSize: 7, color: '#333',
      }}>
        <span>SRC: open.er-api.com</span>
        <span>DELAY: ~60min (free tier)</span>
        <span style={{ marginLeft: 'auto' }}>
          <span style={{ color: '#00ff88' }}>●</span> LIVE
        </span>
      </div>
    </div>
  );
}
