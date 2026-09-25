import { useState, useEffect } from 'react';
import { fetchEarningsCalendar } from '../../services/apiServices';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { logToTerminal } from '../../stores/logStore';

const SECTOR_COLORS: Record<string, string> = {
  JPM: '#00ccff', WFC: '#00ccff', C: '#00ccff', GS: '#00ccff', MS: '#00ccff',
  NFLX: '#ff3355', TSLA: '#ff3355', META: '#00ff88', AMZN: '#ffaa00',
  AAPL: '#a78bfa', NVDA: '#00ff88',
};

import { fmtNum } from '../../utils/numberFormat';

function calcExpectedMove(epsEst: string, price: number = 100): string {
  const eps = parseFloat(epsEst.replace(/[$B]/g, ''));
  if (isNaN(eps)) return '±4-8%';
  const pct = Math.max(3, Math.min(15, eps * 2));
  return `±${fmtNum(pct, 0)}-${fmtNum(pct * 1.5, 0)}%`;
}

// Determine region from ticker suffix
function getTickerRegion(ticker: string): string {
  if (ticker.endsWith('.NS') || ticker.endsWith('.BO')) return 'INDIA';
  if (ticker.endsWith('.L') || ticker.endsWith('.PA') || ticker.endsWith('.FR') || ticker.endsWith('.DE') || ticker.endsWith('.AS') || ticker.endsWith('.MI')) return 'EUROPE';
  return 'AMERICAS';
}

interface Props {
  refreshKey?: number;
  region?: string;
}

export function EarningsCalendarPanel({ refreshKey, region }: Props = {}) {
  const [tab, setTab] = useState<'upcoming' | 'reported'>('upcoming');
  const [selected, setSelected] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const data = await fetchEarningsCalendar();
        if (!mounted) return;
        const mapped = (data || []).map((e: any) => ({
          ticker: e.symbol,
          name: e.name || e.symbol,
          date: e.date,
          time: 'After Hours',
          eps_est: e.epsEst ? `$${e.epsEst}` : '—',
          eps_act: null,
          beat: null,
          revenue_est: e.revEst || '—',
          region: getTickerRegion(e.symbol),
        }));
        setEarnings(mapped);
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Failed to fetch earnings');
          logToTerminal('ERROR', 'Panel:EarningsCalendar', e.message || String(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Filter by region if specified
  const display = earnings.filter(e => {
    if (e.beat !== null) return false; // Only show upcoming
    if (!region || region === 'GLOBAL') return true;
    return e.region === region;
  });

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && earnings.length === 0) {
    return <div style={{ ...s, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#444' }}>LOADING EARNINGS...</div>;
  }

  if (error && earnings.length === 0) {
    return <div style={{ ...s, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ff3355', padding: 16 }}>ERROR: {error}</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e' }}>
        {(['upcoming', 'reported'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '5px 14px', border: 'none',
              borderRight: '1px solid #1a1a2e',
              background: tab === t ? '#1a1a2e' : 'transparent',
              color: tab === t ? '#00ccff' : '#555',
              cursor: 'pointer', fontSize: 9, fontFamily: 'JetBrains Mono',
              letterSpacing: 1, textTransform: 'uppercase',
              borderBottom: tab === t ? '1px solid #00ccff' : '1px solid transparent',
            }}
          >{t === 'reported' ? `REPORTED (0)` : `UPCOMING (${display.length})`}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={9} color="#444" />
          <span style={{ fontSize: 8, color: '#444' }}>Q1 2026</span>
        </div>
        {region && region !== 'GLOBAL' && (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 7, color: '#00ccff' }}>● {region}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '52px 1fr 70px 70px 70px',
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span>TICKER</span>
        <span>COMPANY</span>
        <span style={{ textAlign: 'right' }}>EPS EST</span>
        {tab === 'upcoming' ? (
          <span style={{ textAlign: 'right' }}>EXP MOVE</span>
        ) : (
          <span style={{ textAlign: 'right' }}>EPS ACT</span>
        )}
        <span style={{ textAlign: 'right' }}>REV EST</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {display.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#444' }}>
            {region && region !== 'GLOBAL' ? `No earnings scheduled for ${region}.` : 'No earnings scheduled.'}
          </div>
        )}
        {display.map(e => {
          const accentColor = SECTOR_COLORS[e.ticker] || '#666680';
          const isSelected = selected === e.ticker;
          return (
            <div key={e.ticker}>
              <div
                onClick={() => setSelected(isSelected ? null : e.ticker)}
                style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr 70px 70px 70px',
                  alignItems: 'center', padding: '5px 8px',
                  borderBottom: '1px solid #0f0f18',
                  borderLeft: `2px solid ${accentColor}55`,
                  cursor: 'pointer',
                  background: isSelected ? '#12121e' : 'transparent',
                }}
              >
                <div>
                  <span style={{ fontSize: 10, color: accentColor, letterSpacing: 0.5 }}>{e.ticker}</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
                    <span style={{ fontSize: 7, color: '#444' }}>{e.date}</span>
                    <span style={{ fontSize: 7, color: e.time === 'Pre-Market' ? '#00ff88' : '#ffaa00' }}>
                      {e.time === 'Pre-Market' ? '◇ PRE' : '◆ AH'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>{e.eps_est}</span>
                {tab === 'upcoming' ? (
                  <span style={{ fontSize: 8, color: '#666680', textAlign: 'right' }}>
                    {calcExpectedMove(e.eps_est)}
                  </span>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    {e.eps_act && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <span style={{ fontSize: 10, color: e.beat ? '#00ff88' : '#ff3355' }}>
                          {e.eps_act}
                        </span>
                        <div style={{
                          fontSize: 7, padding: '0 3px',
                          background: e.beat ? 'rgba(0,255,136,0.12)' : 'rgba(255,51,85,0.12)',
                          color: e.beat ? '#00ff88' : '#ff3355',
                          display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                          {e.beat ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                          {e.beat ? 'BEAT' : 'MISS'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <span style={{ fontSize: 9, color: '#666680', textAlign: 'right' }}>{e.revenue_est}</span>
              </div>

              {isSelected && (
                <div style={{
                  padding: '6px 8px 6px 22px',
                  borderBottom: '1px solid #1a1a2e',
                  background: 'rgba(0,204,255,0.03)',
                }}>
                  <div style={{ fontSize: 8, color: '#666680', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>EPS EST: <span style={{ color: '#e8e8e8' }}>{e.eps_est}</span></span>
                    {e.eps_act && <span>ACTUAL: <span style={{ color: e.beat ? '#00ff88' : '#ff3355' }}>{e.eps_act}</span></span>}
                    <span>REV EST: <span style={{ color: '#e8e8e8' }}>{e.revenue_est}</span></span>
                    {tab === 'upcoming' && (
                      <span style={{ color: '#ffaa00' }}>
                        OPTIONS IMPLIED MOVE: {calcExpectedMove(e.eps_est)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
      }}>
        <span>◇ PRE-MARKET</span>
        <span>◆ AFTER-HOURS</span>
        <span style={{ marginLeft: 'auto' }}>SRC: SEC/EARNINGS WHISPERS</span>
      </div>
    </div>
  );
}
