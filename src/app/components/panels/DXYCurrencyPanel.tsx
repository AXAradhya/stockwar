import { useState, useEffect } from 'react';
import { fetchDXYCurrency, fetchForexRates } from '../../services/apiServices';
import { fmtNum, fmtPct, roundTo } from '../../utils/numberFormat';
import { useUiStore } from '../../stores/uiStore';
import { AlertTriangle } from 'lucide-react';

interface CurrencyData {
  pair: string;
  price: number;
  change: number;
  changePct: number;
  weight?: number;
}

export function DXYCurrencyPanel({ refreshKey }: { refreshKey?: number }) {
  const [components, setComponents] = useState<CurrencyData[]>([]);
  const [basket, setBasket] = useState<CurrencyData[]>([]);
  const [dxyValue, setDxyValue] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [tab, setTab] = useState<'DXY' | 'BASKET'>('DXY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const region = useUiStore(s => s.region);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dxyData, forexData] = await Promise.all([
          fetchDXYCurrency(),
          fetchForexRates(),
        ]);
        
        if (!mounted) return;
        
        // Map DXY basket
        const dxyComponents = dxyData.basket
          .filter((b: any) => b.weight > 0)
          .map((b: any) => ({
            pair: `USD/${b.currency}`,
            price: parseFloat(b.rate),
            change: 0,
            changePct: 0,
            weight: b.weight,
          }));
        
        // Map full basket from forex rates
        const fullBasket = forexData.map((f: any) => ({
          pair: f.pair,
          price: parseFloat(f.price),
          change: 0,
          changePct: 0,
        }));
        
        // Approximate DXY from inverse EUR weight (since EUR is the dominant component)
        // This is a rough approximation — real DXY requires premium data
        const eurRate = dxyData.basket.find((b: any) => b.currency === 'EUR')?.rate;
        const approxDXY = eurRate ? roundTo(50.14348112 * Math.pow(1 / parseFloat(eurRate), 0.576), 2) : null;
        
        setComponents(dxyComponents);
        setBasket(fullBasket);
        setDxyValue(approxDXY);
        setLastUpdated(new Date());
        setLoading(false);
        
      } catch (e: any) {
        console.error('Failed to load currency data', e);
        if (mounted) {
          setError(e.message || 'Failed to load currency data');
          setLoading(false);
        }
      }
    };

    loadData();
    const t = setInterval(loadData, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshKey, region]);

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && components.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING CURRENCY DATA...</div>;
  }

  if (error && components.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} /> ERROR: {error}
      </div>
    );
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* DXY Hero */}
      <div style={{ padding: '8px 10px', background: '#09090f', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 2 }}>US DOLLAR INDEX (DXY)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 26, color: '#e8e8e8', fontWeight: 700 }}>
                {dxyValue ? fmtNum(dxyValue, 2) : '—'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#333' }}>SOURCE</div>
            <div style={{ fontSize: 9, color: '#666' }}>open.er-api.com</div>
            <div style={{ fontSize: 7, color: '#444', marginTop: 2 }}>{lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Note about history */}
      <div style={{ padding: '4px 10px', fontSize: 8, color: '#333', borderBottom: '1px solid #1a1a2e' }}>
        Real-time rates via free exchange API. Intraday DXY history requires Alpha Vantage or FRED data.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['DXY', 'BASKET'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
            background: tab === t ? '#1a1a2e' : 'transparent', color: tab === t ? '#00ccff' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono', borderBottom: tab === t ? '2px solid #00ccff' : '2px solid transparent',
          }}>
            {t === 'DXY' ? 'DXY COMPONENTS' : 'CURRENCY BASKET'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(tab === 'DXY' ? components : basket).length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No currency data available. Check network connection.
          </div>
        ) : (
          (tab === 'DXY' ? components : basket).map((c) => (
            <div key={c.pair} style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderBottom: '1px solid #0a0a12', gap: 6 }}>
              {tab === 'DXY' && c.weight && (
                <div style={{ width: 28, flexShrink: 0 }}>
                  <div style={{ height: 3, background: '#0f0f18', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${c.weight}%`, background: '#00ccff' }} />
                  </div>
                  <div style={{ fontSize: 7, color: '#333', marginTop: 1, textAlign: 'center' }}>{c.weight}%</div>
                </div>
              )}
              <span style={{ flex: 1, fontSize: 9, color: '#e8e8e8' }}>{c.pair}</span>
              <span style={{ fontSize: 10, color: '#e8e8e8', minWidth: 70, textAlign: 'right' }}>
                {fmtNum(c.price, tab === 'DXY' ? 4 : 2)}
              </span>
              <span style={{ fontSize: 8, color: '#444', marginLeft: 6, minWidth: 30, textAlign: 'right' }}>
                {fmtPct(c.changePct, 2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>EXCHANGE RATES — FREE API</span>
        <span style={{ color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
