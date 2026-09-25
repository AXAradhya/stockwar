import { useState, useEffect } from 'react';
import { fetchGoldSilver, fetchYahooChart } from '../../services/apiServices';
import { logToTerminal } from '../../stores/logStore';
import { fmtNum, fmtPct, roundTo } from '../../utils/numberFormat';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import TradingViewWidget from '../ui/TradingViewWidget';
import { TrendingUp, TrendingDown } from 'lucide-react';

const GOLD_CONTEXT = [
  { label: 'Real Rates', note: 'Treasury yields minus inflation expectations. Negative real rates correlate with gold strength.' },
  { label: 'USD Strength', note: 'A stronger USD creates a headwind for USD-denominated gold.' },
  { label: 'Central Bank Policy', note: 'Global central bank gold purchases reached multi-decade highs in 2024–2025.' },
  { label: 'Geopolitical Risk', note: 'Safe-haven flows into gold escalate during major armed conflicts.' },
  { label: 'Inflation Expectations', note: 'Gold is a classic hedge when CPI exceeds central bank targets.' },
];

// using fmtNum from shared utils

interface HistoryPoint {
  d: string;
  v: number;
}
async function fetchYahooHistory(symbol: string, range: string): Promise<HistoryPoint[]> {
  const result: any = await fetchYahooChart(symbol, range);
  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  return timestamps.map((t, i) => ({
    d: new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    v: closes[i],
  })).filter((p: HistoryPoint) => p.v != null);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const raw = payload[0]?.value;
    const v = Number(raw);
    return (
      <div style={{ background: '#0d0d18', border: '1px solid #1a1a2e', padding: '3px 6px', fontFamily: 'JetBrains Mono', fontSize: 8, color: '#00ccff' }}>
        {isFinite(v) ? `$${fmtNum(v, 2)}` : '—'}
      </div>
    );
  }
  return null;
};

interface Props {
  refreshKey?: number;
}

export function GoldSilverPanel({ refreshKey }: Props = {}) {
  const [metals, setMetals] = useState<any[]>([]);
  const [goldHistory, setGoldHistory] = useState<HistoryPoint[]>([]);
  const [tab, setTab] = useState<'chart' | 'drivers'>('chart');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [data, hist] = await Promise.allSettled([
          fetchGoldSilver(),
          fetchYahooHistory('GC=F', '1mo'),
        ]);
        if (!mounted) return;

        if (data.status === 'fulfilled') {
          setMetals(data.value);
        } else {
          logToTerminal('WARN', 'Panel:GoldSilver', `Prices fetch failed: ${data.reason}`);
        }

        if (hist.status === 'fulfilled') {
          setGoldHistory(hist.value);
        } else {
          logToTerminal('WARN', 'Panel:GoldSilver', `History fetch failed: ${hist.reason}`);
        }
      } catch (e: any) {
        logToTerminal('ERROR', 'Panel:GoldSilver', e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const t = setInterval(load, 300000);
    return () => { mounted = false; clearInterval(t); };
  }, [refreshKey]);

  const gold = metals[0];
  const silver = metals[1];
  const gsrRatio = gold && silver && silver.price > 0 ? roundTo(gold.price / silver.price, 1) : null;
  const miniHistory = goldHistory.slice(-7);

  if (loading && !gold) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#444' }}>
        FETCHING METALS DATA...
      </div>
    );
  }

  if (!gold || !silver) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ff3355' }}>
        METALS DATA UNAVAILABLE — CHECK API KEYS
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Gold Hero */}
      <div style={{
        padding: '6px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 7, color: '#444', letterSpacing: 1 }}>GOLD SPOT</div>
          <div style={{ fontSize: 18, color: '#f59e0b' }}>${fmtNum(gold?.price || 0)}</div>
          <div style={{ fontSize: 8, color: (gold?.changePct || 0) >= 0 ? '#00ff88' : '#ff3355', display: 'flex', alignItems: 'center', gap: 2 }}>
            {(gold?.changePct || 0) >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {(gold?.changePct || 0) >= 0 ? '+' : ''}{fmtPct(gold?.changePct || 0, 3)}
          </div>
        </div>
        <div style={{ flex: 1, height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={miniHistory.length > 0 ? miniHistory : []}>
              <defs key="gold-mini-defs">
                <linearGradient id="goldGradPanel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area key="gold-mini-area" type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={1.5} fill="url(#goldGradPanel)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7, color: '#444' }}>G/S RATIO</div>
          <div style={{ fontSize: 12, color: '#ffaa00' }}>{gsrRatio ?? '—'}</div>
          <div style={{ fontSize: 7, color: '#444' }}>SILVER</div>
          <div style={{ fontSize: 10, color: '#e8e8e8' }}>${fmtNum(silver?.price || 0)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e' }}>
        {(['chart', 'drivers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 10px', border: 'none',
            borderRight: '1px solid #1a1a2e',
            background: tab === t ? '#1a1a2e' : 'transparent',
            color: tab === t ? '#f59e0b' : '#555',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
            letterSpacing: 1, textTransform: 'uppercase',
          }}>{t === 'chart' ? '30D CHART' : 'DRIVERS'}</button>
        ))}
      </div>

      {tab === 'chart' ? (
        <>
          {/* 30D Chart */}
          <div style={{ flex: 1, padding: '4px 0' }}>
            {goldHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={goldHistory} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs key="gold-full-defs">
                    <linearGradient id="goldGradFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis key="x-axis" dataKey="d" tick={{ fill: '#333', fontSize: 7 }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis key="y-axis" domain={['auto', 'auto']} tick={{ fill: '#333', fontSize: 7 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: any) => {
                      const n = Number(v);
                      return isFinite(n) ? `$${fmtNum(n, 0)}` : '—';
                  }} />
                  <Tooltip key="tooltip" content={<CustomTooltip />} />
                  <Area key="area" type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={1.5} fill="url(#goldGradFull)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: '100%' }}>
                <TradingViewWidget symbol="OANDA:XAUUSD" height="100%" />
              </div>
            )}
          </div>

          {/* Other metals row */}
          <div style={{ borderTop: '1px solid #1a1a2e', display: 'flex' }}>
            {metals.slice(1).map(m => {
              const up = m.changePct >= 0;
              return (
                <div key={m.symbol} style={{
                  flex: 1, padding: '4px 8px',
                  borderRight: '1px solid #1a1a2e', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 7, color: '#444' }}>{m.name.split(' ')[0].toUpperCase()}</div>
                  <div style={{ fontSize: 10, color: '#e8e8e8' }}>
                    {m.symbol === 'GSR' ? fmtNum(m.price, 1) : `$${fmtNum(m.price)}`}
                  </div>
                  <div style={{ fontSize: 8, color: up ? '#00ff88' : '#ff3355' }}>
                    {fmtPct(m.changePct, 2)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '4px 8px', fontSize: 8, color: '#444', letterSpacing: 1, borderBottom: '1px solid #1a1a2e' }}>
            GOLD PRICE CONTEXT
          </div>
          {GOLD_CONTEXT.map(d => (
            <div key={d.label} style={{
              padding: '5px 8px', borderBottom: '1px solid #0f0f18',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: '#e8e8e8', flex: 1 }}>{d.label}</span>
              </div>
              <div style={{ fontSize: 8, color: '#444', lineHeight: 1.4 }}>{d.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
