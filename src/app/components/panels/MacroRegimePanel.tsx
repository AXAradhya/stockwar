import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { fetchMacroRegimeIndicators, fetchRecessionHistory } from '../../services/apiServices';
import { fmtNum, roundTo } from '../../utils/numberFormat';
import { logToTerminal } from '../../stores/logStore';

type Regime = 'EXPANSION' | 'SLOWDOWN' | 'CONTRACTION' | 'RECOVERY';
type Signal = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

interface Indicator {
  name: string;
  value: string;
  signal: Signal;
  source: string;
  description: string;
}

interface HistoryPoint {
  t: string;
  prob: number;
  threshold: number;
}

const REGIME_CONFIG: Record<Regime, { color: string; bg: string; icon: any; desc: string }> = {
  EXPANSION: { color: '#00ff88', bg: 'rgba(0,255,136,0.08)', icon: <TrendingUp size={12} />, desc: 'Growth accelerating, risk-on favored' },
  SLOWDOWN: { color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', icon: <Minus size={12} />, desc: 'Growth decelerating, monitor closely' },
  CONTRACTION: { color: '#ff3355', bg: 'rgba(255,51,85,0.08)', icon: <TrendingDown size={12} />, desc: 'Economic contraction in progress' },
  RECOVERY: { color: '#00ccff', bg: 'rgba(0,204,255,0.08)', icon: <TrendingUp size={12} />, desc: 'Recovery phase — early cycle opportunity' },
};

function sigColor(s: Signal) {
  return s === 'BULLISH' ? '#00ff88' : s === 'BEARISH' ? '#ff3355' : '#ffaa00';
}

interface Props {
  refreshKey?: number;
}

export function MacroRegimePanel({ refreshKey }: Props = {}) {
  const [recessionProb, setRecessionProb] = useState<number | null>(null);
  const [regime, setRegime] = useState<Regime>('SLOWDOWN');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'REGIME' | 'INDICATORS'>('REGIME');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [indData, histData] = await Promise.allSettled([
          fetchMacroRegimeIndicators(),
          fetchRecessionHistory(60),
        ]);
        if (!mounted) return;

        const real: Indicator[] = [];

        if (indData.status === 'fulfilled') {
          const d = indData.value;

          if (d.yield10Y != null && d.yield2Y != null) {
            const spread = roundTo(d.yield10Y - d.yield2Y, 2);
            const sig: Signal = (spread ?? 0) < 0 ? 'BEARISH' : (spread ?? 0) < 0.5 ? 'NEUTRAL' : 'BULLISH';
            const desc = (spread ?? 0) < 0 ? 'Inverted — recession risk elevated' : (spread ?? 0) < 0.5 ? 'Flat — monitor closely' : 'Normal slope';
            real.push({ name: 'Yield Curve (10Y-2Y)', value: (spread != null ? `${spread > 0 ? '+' : ''}${fmtNum(spread, 2)}%` : '—'), signal: sig, source: 'FRED', description: desc });
          }

          if (d.joblessClaims != null) {
            const sig: Signal = d.joblessClaims > 280000 ? 'BEARISH' : d.joblessClaims > 230000 ? 'NEUTRAL' : 'BULLISH';
            real.push({ name: 'Initial Jobless Claims', value: `${fmtNum(d.joblessClaims / 1000, 0)}K`, signal: sig, source: 'FRED', description: 'Weekly initial claims' });
          }

          if (d.consumerSentiment != null) {
            const sig: Signal = d.consumerSentiment < 65 ? 'BEARISH' : d.consumerSentiment < 75 ? 'NEUTRAL' : 'BULLISH';
            real.push({ name: 'Consumer Sentiment', value: fmtNum(d.consumerSentiment, 1), signal: sig, source: 'FRED', description: 'University of Michigan index' });
          }

          if (d.creditSpreads != null) {
            const sig: Signal = d.creditSpreads > 2.0 ? 'BEARISH' : d.creditSpreads > 1.2 ? 'NEUTRAL' : 'BULLISH';
            real.push({ name: 'Credit Spreads (IG)', value: `${fmtNum(d.creditSpreads, 2)}%`, signal: sig, source: 'FRED', description: 'ICE BofA IG OAS' });
          }

          if (d.recessionProbability != null) {
            setRecessionProb(d.recessionProbability);
            const p = d.recessionProbability;
            if (p > 60) setRegime('CONTRACTION');
            else if (p > 35) setRegime('SLOWDOWN');
            else if (p > 15) setRegime('RECOVERY');
            else setRegime('EXPANSION');
          }
        } else {
          logToTerminal('WARN', 'Panel:MacroRegime', String(indData.reason));
        }

        real.push({ name: 'ISM Manufacturing', value: '—', signal: 'NEUTRAL', source: 'API Required', description: 'ISM PMI requires subscription' });
        real.push({ name: 'Conference Board LEI', value: '—', signal: 'NEUTRAL', source: 'API Required', description: 'LEI requires subscription' });
        real.push({ name: 'Freight Index', value: '—', signal: 'NEUTRAL', source: 'API Required', description: 'CASS freight requires subscription' });

        setIndicators(real);

        if (histData.status === 'fulfilled') {
          setHistory(histData.value.map((h: any) => ({ t: h.date.slice(0, 7), prob: h.value, threshold: 50 })));
        }
      } catch (e: any) {
        if (mounted) {
          setError(e.message);
          logToTerminal('ERROR', 'Panel:MacroRegime', e.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  const bearishCount = indicators.filter(i => i.signal === 'BEARISH').length;
  const rc = REGIME_CONFIG[regime];
  const S: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && !indicators.length) {
    return <div style={{ ...S, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#444' }}>LOADING...</div>;
  }

  if (error && !indicators.length) {
    return <div style={{ ...S, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ff3355', padding: 16 }}>ERROR: {error}</div>;
  }

  const probColor = recessionProb != null ? (recessionProb >= 50 ? '#ff3355' : recessionProb >= 35 ? '#ffaa00' : '#00ff88') : '#444';
  const probText = recessionProb != null ? `${fmtNum(recessionProb, 0)}%` : '—';

  return (
    <div style={{ ...S, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Regime banner */}
      <div style={{ padding: '8px 10px', background: rc.bg, borderBottom: '1px solid ' + rc.color + '33', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 2, marginBottom: 2 }}>CURRENT MACRO REGIME</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: rc.color }}>{rc.icon}</span>
              <span style={{ fontSize: 18, color: rc.color, fontWeight: 700, letterSpacing: 2 }}>{regime}</span>
            </div>
            <div style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{rc.desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>12-MO RECESSION PROB</div>
            <div style={{ fontSize: 28, color: probColor, fontWeight: 700 }}>{probText}</div>
          </div>
        </div>
      </div>

      {/* Probability chart */}
      {history.length > 0 && (
        <div style={{ height: 60, borderBottom: '1px solid #1a1a2e', padding: '4px 0', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3355" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff3355" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fill: '#333', fontSize: 7 }} axisLine={false} tickLine={false} interval={11} />
              <ReferenceLine y={50} stroke="#ff335544" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="prob" stroke="#ff3355" fill="url(#recGrad)" strokeWidth={1.5} dot={false} />
              <Tooltip contentStyle={{ background: '#0d0d18', border: '1px solid #1a1a2e', fontFamily: 'JetBrains Mono', fontSize: 9 }} formatter={(v: any) => [`${fmtNum(Number(v), 1)}%`, 'Prob']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bearish signal count */}
      {bearishCount >= 3 && (
        <div style={{ padding: '4px 8px', background: 'rgba(255,51,85,0.06)', borderBottom: '1px solid rgba(255,51,85,0.15)', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <AlertTriangle size={9} color="#ff3355" />
          <span style={{ fontSize: 9, color: '#ff8888' }}>{bearishCount} of {indicators.length} indicators signaling contraction</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['REGIME', 'INDICATORS'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9, background: tab === t ? '#1a1a2e' : 'transparent', color: tab === t ? '#00ccff' : '#444', letterSpacing: 1, fontFamily: 'JetBrains Mono', borderBottom: tab === t ? '2px solid #00ccff' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'REGIME' ? (
          <div style={{ padding: 8 }}>
            {(['EXPANSION', 'SLOWDOWN', 'CONTRACTION', 'RECOVERY'] as Regime[]).map((r) => (
              <div key={r} onClick={() => setRegime(r)} style={{ padding: '6px 8px', marginBottom: 2, cursor: 'pointer', background: regime === r ? REGIME_CONFIG[r].bg : '#09090f', border: '1px solid ' + (regime === r ? REGIME_CONFIG[r].color + '44' : '#1a1a2e'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: REGIME_CONFIG[r].color }}>{REGIME_CONFIG[r].icon}</span>
                  <div>
                    <div style={{ fontSize: 9, color: REGIME_CONFIG[r].color, fontWeight: 600 }}>{r}</div>
                    <div style={{ fontSize: 8, color: '#444' }}>{REGIME_CONFIG[r].desc}</div>
                  </div>
                </div>
                {regime === r && <span style={{ fontSize: 8, color: REGIME_CONFIG[r].color }}>◉ ACTIVE</span>}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {indicators.map((ind) => {
              const sc = sigColor(ind.signal);
              return (
                <div key={ind.name} style={{ padding: '5px 8px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: '#e8e8e8' }}>{ind.name}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#e8e8e8' }}>{ind.value}</span>
                      <span style={{ fontSize: 7, letterSpacing: 1, padding: '1px 4px', color: sc, border: '1px solid ' + sc + '44' }}>{ind.signal}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 8, color: '#444', lineHeight: 1.4 }}>{ind.description}</span>
                    <span style={{ fontSize: 7, color: '#555' }}>{ind.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>FRED · REAL-TIME INDICATORS</span>
        <span style={{ color: '#ffaa00' }}>● T3</span>
      </div>
    </div>
  );
}
