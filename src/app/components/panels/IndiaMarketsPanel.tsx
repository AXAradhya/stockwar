import { useState, useEffect } from 'react';
import { fetchIndiaMarkets } from '../../services/apiServices';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useUiStore } from '../../stores/uiStore';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

const INDIA_MACRO = [
  { label: 'RBI Repo Rate', value: '6.50%', change: '0.00%', note: 'Unchanged since Feb 2023' },
  { label: 'CPI Inflation', value: '4.85%', change: '-0.30%', note: 'Within RBI 4% ± 2% target band' },
  { label: 'USD/INR', value: '83.51', change: '+0.12%', note: 'Near 5-year low range' },
  { label: 'Forex Reserves', value: '$641B', change: '-0.2%', note: '9-month import cover' },
  { label: 'GDP Growth Q3', value: '8.4%', change: '+0.4%', note: 'Beats 6.5% estimate' },
];

const TOP_STOCKS = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', sector: 'Conglomerate', price: 2942, change: 18.5, changePct: 0.63 },
  { ticker: 'TCS', name: 'Tata Consultancy Svcs', sector: 'IT', price: 3812, change: -24.0, changePct: -0.63 },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', price: 1518, change: 12.3, changePct: 0.82 },
  { ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT', price: 1432, change: -8.6, changePct: -0.60 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', price: 1128, change: 9.4, changePct: 0.84 },
  { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', price: 264, change: 3.2, changePct: 1.23 },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC', price: 6893, change: -45.2, changePct: -0.65 },
];

const SECTOR_COLORS: Record<string, string> = {
  IT: '#00ccff', Banking: '#00ff88', Energy: '#ffaa00',
  NBFC: '#a78bfa', Conglomerate: '#fb923c',
};

export function IndiaMarketsPanel() {
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'INDICES' | 'STOCKS' | 'MACRO'>('INDICES');
  const region = useUiStore(s => s.region);

  if (region !== 'GLOBAL' && region !== 'ASIA' && region !== 'INDIA') {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ff3355" />
        <span style={{ color: '#ff3355', letterSpacing: 1 }}>REGION NOT SUPPORTED</span>
        <span style={{ textAlign: 'center' }}>India Markets data is only available in INDIA, ASIA, or GLOBAL views.</span>
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchIndiaMarkets();
        if (mounted) {
          const mapped = (data || []).map((idx: any) => ({
            ...idx,
            exchange: idx.symbol === 'SENSEX' ? 'BSE' : 'NSE',
            history: [],
          }));
          setIndices(mapped);
          setLoading(false);
          if (!mapped || mapped.length === 0) setError('India market data unavailable');
          else setError(null);
        }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 300000);
    return () => { mounted = false; clearInterval(t); };
  }, []);


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ padding: '4px 8px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🇮🇳</span>
        <span style={{ fontSize: 10, color: '#FF9933', letterSpacing: 2 }}>INDIA MARKETS</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, color: '#444' }}>NSE/BSE · IST {loading ? '⟳' : '✓'}</span>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e' }}>
        {(['INDICES', 'STOCKS', 'MACRO'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 10px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: tab === t ? '#1a1a2e' : 'transparent',
            color: tab === t ? '#FF9933' : '#555',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', letterSpacing: 1,
          }}>{t}</button>
        ))}
      </div>

      {tab === 'INDICES' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16, color: '#444', fontSize: 9 }}>FETCHING NSE/BSE DATA...</div>
          ) : indices.map(idx => {
            const up = idx.changePct >= 0;
            const color = up ? '#00ff88' : '#ff3355';
            return (
              <div key={idx.symbol} style={{ padding: '6px 8px', borderBottom: '1px solid #0f0f18' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#e8e8e8' }}>{idx.name}</span>
                      <span style={{ fontSize: 7, color: '#444' }}>{idx.exchange}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {up ? <TrendingUp size={8} color={color} /> : <TrendingDown size={8} color={color} />}
                      <span style={{ fontSize: 8, color }}>{fmtPct(idx.changePct)}</span>
                    </div>
                  </div>
                  <div style={{ width: 60, height: 22 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={idx.history}>
                        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 70 }}>
                    <div style={{ fontSize: 12, color: '#e8e8e8' }}>{fmtNum(idx.price)}</div>
                    <div style={{ fontSize: 8, color }}>{idx.change >= 0 ? '+' : ''}{fmtNum(idx.change, 2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'STOCKS' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '68px 1fr 72px 58px', padding: '2px 8px', borderBottom: '1px solid #1a1a2e', fontSize: 7, color: '#333', letterSpacing: 1 }}>
            <span>TICKER</span><span>COMPANY</span>
            <span style={{ textAlign: 'right' }}>PRICE ₹</span>
            <span style={{ textAlign: 'right' }}>CHG%</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {TOP_STOCKS.map(s => {
              const up = s.changePct >= 0;
              const color = up ? '#00ff88' : '#ff3355';
              const sColor = SECTOR_COLORS[s.sector] || '#666680';
              return (
                <div key={s.ticker} style={{ display: 'grid', gridTemplateColumns: '68px 1fr 72px 58px', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #0f0f18', borderLeft: `2px solid ${sColor}44` }}>
                  <span style={{ fontSize: 9, color: '#FF9933' }}>{s.ticker}</span>
                  <div>
                    <div style={{ fontSize: 8, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 7, color: sColor }}>{s.sector}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>{fmtNum(s.price)}</span>
                  <span style={{ fontSize: 9, color, textAlign: 'right' }}>{fmtPct(s.changePct)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'MACRO' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {INDIA_MACRO.map(m => (
            <div key={m.label} style={{ padding: '7px 8px', borderBottom: '1px solid #0f0f18' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 8, color: '#666680', flex: 1 }}>{m.label}</span>
                <span style={{ fontSize: 11, color: '#e8e8e8' }}>{m.value}</span>
                <span style={{ fontSize: 8, color: m.change.startsWith('+') ? '#00ff88' : m.change.startsWith('-') ? '#ff3355' : '#ffaa00' }}>{m.change}</span>
              </div>
              <div style={{ fontSize: 7, color: '#444', marginTop: 2 }}>{m.note}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>SRC: Yahoo Finance · RBI · NSE/BSE</span>
        <span style={{ marginLeft: 'auto', color: '#FF9933' }}>🇮🇳 INDIA</span>
      </div>
    </div>
  );
}
