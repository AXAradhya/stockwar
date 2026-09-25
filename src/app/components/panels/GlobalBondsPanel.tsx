import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchGlobalBonds } from '../../services/apiServices';
import { fmtNum, roundTo } from '../../utils/numberFormat';
import { logToTerminal } from '../../stores/logStore';

interface BondYieldItem {
  country: string;
  code: string;
  flagEmoji: string;
  y2: number | null;
  y10: number | null;
  y30: number | null;
}

interface EnrichedItem extends BondYieldItem {
  rating: string;
  spread10Y: number | null;
}

const RATING_MAP: Record<string, string> = {
  US: 'AA+', DE: 'AAA', GB: 'AA', JP: 'A+', IT: 'BBB', FR: 'AA-', CA: 'AAA', AU: 'AAA',
};

const RATING_COLORS: Record<string, string> = {
  AAA: '#00ff88', 'AA+': '#00ff88', AA: '#00ff88', 'AA-': '#66ffaa',
  'A+': '#ffaa00', A: '#ffaa00', 'A-': '#ffaa00',
  'BBB+': '#ff8800', BBB: '#ff8800', 'BBB-': '#ff8800',
};

interface Props {
  refreshKey?: number;
}

function getYield(b: BondYieldItem, key: 'y2' | 'y10' | 'y30'): number | null {
  return key === 'y2' ? b.y2 : key === 'y10' ? b.y10 : b.y30;
}

// use shared fmtNum/roundTo for safe numeric formatting

const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

export function GlobalBondsPanel({ refreshKey }: Props = {}) {
  const [yieldsData, setYieldsData] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maturity, setMaturity] = useState<'y2' | 'y10' | 'y30'>('y10');
  const [sortBy, setSortBy] = useState<'yield' | 'spread' | 'country'>('yield');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const raw = await fetchGlobalBonds();
      const usy10 = raw.find(b => b.code === 'US')?.y10 || 0;
      const enriched: EnrichedItem[] = raw.map(b => ({
        ...b,
        rating: RATING_MAP[b.code] || '—',
        spread10Y: b.y10 != null ? (b.code === 'US' ? 0 : roundTo(b.y10 - usy10, 2)) : null,
      }));
      setYieldsData(enriched);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch bond yields');
      logToTerminal('ERROR', 'Panel:GlobalBonds', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  // Loading
  if (loading && yieldsData.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444' }}>Loading sovereign bond yields via FRED…</div>;
  }
  // Error, no cached data
  if (error && yieldsData.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355' }}>
        ERROR: {error}
      </div>
    );
  }

  const usEntry = yieldsData.find(b => b.code === 'US');
  const usY10 = usEntry?.y10 ?? null;
  const usY2 = usEntry?.y2 ?? null;
  const isInverted = usY2 != null && usY10 != null ? usY2 > usY10 : false;

  const sorted = [...yieldsData].sort((a, b) => {
    if (sortBy === 'yield') return (getYield(b, 'y10') ?? -Infinity) - (getYield(a, 'y10') ?? -Infinity);
    if (sortBy === 'spread') return (a.spread10Y ?? -Infinity) - (b.spread10Y ?? -Infinity);
    return a.country.localeCompare(b.country);
  });

  const chartData = sorted
    .filter(b => getYield(b, maturity) != null)
    .slice(0, 8)
    .map(b => ({
      name: b.code,
      value: getYield(b, maturity) ?? 0,
      emoji: b.flagEmoji,
    }));

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 1 }}>US 10Y</div>
          <div style={{ fontSize: 15, color: '#e8e8e8', fontWeight: 700 }}>{fmtNum(usY10, 2)}%</div>
        </div>
        <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 1 }}>2/10 SPREAD</div>
          <div style={{ fontSize: 15, color: isInverted ? '#ff3355' : '#00ff88', fontWeight: 700 }}>
            {usY2 != null && usY10 != null ? fmtNum(usY2 - usY10, 2) : '—'}%
          </div>
        </div>
        <div style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 1 }}>CURVE</div>
          <div style={{ fontSize: 11, color: isInverted ? '#ff3355' : '#00ff88', fontWeight: 700 }}>
            {usY2 != null ? (isInverted ? '⚠ INVERTED' : '✓ NORMAL') : '—'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '5px 8px', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 1 }}>TRACKING</div>
          <div style={{ fontSize: 15, color: '#00ccff', fontWeight: 700 }}>{yieldsData.length}</div>
        </div>
      </div>

      {/* Maturity selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {([
          ['y10', '10Y'],
          ['y2', '2Y'],
          ['y30', '30Y'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMaturity(key)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
            background: maturity === key ? '#1a1a2e' : 'transparent', color: maturity === key ? '#ffaa00' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono', borderBottom: maturity === key ? '2px solid #ffaa00' : '2px solid transparent',
          }}>{label} YIELD</button>
        ))}
      </div>

      {/* Mini bar chart */}
      {chartData.length > 0 && (
        <div style={{ height: 60, padding: '4px 0', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#444', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 7, fill: '#333' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0d0d18', border: '1px solid #1a1a2e', fontFamily: 'JetBrains Mono', fontSize: 9 }} formatter={(v: any) => [`${fmtNum(Number(v), 2)}%`, 'Yield']} labelStyle={{ color: '#00ccff' }} />
              <Bar dataKey="value" radius={0}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 8 ? '#ff3355' : entry.value > 4 ? '#ffaa00' : '#00ccff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Yields table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 55px 55px 55px 65px 40px', padding: '3px 8px', fontSize: 7, color: '#333', borderBottom: '1px solid #0f0f18', flexShrink: 0 }}>
        <span onClick={() => setSortBy('country')} style={{ cursor: 'pointer', color: sortBy === 'country' ? '#00ccff' : '#333' }}>COUNTRY</span>
        <span style={{ textAlign: 'right' }}>2Y</span>
        <span style={{ textAlign: 'right' }}>10Y</span>
        <span style={{ textAlign: 'right' }}>30Y</span>
        <span onClick={() => setSortBy('spread')} style={{ textAlign: 'right', cursor: 'pointer', color: sortBy === 'spread' ? '#00ccff' : '#333' }}>SPREAD</span>
        <span style={{ textAlign: 'right' }}>RTG</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map((b) => (
          <div key={b.code} style={{ display: 'grid', gridTemplateColumns: '1fr 55px 55px 55px 65px 40px', padding: '4px 8px', fontSize: 9, borderBottom: '1px solid #0a0a12', alignItems: 'center' }}>
            <div>
              <span style={{ marginRight: 5 }}>{b.flagEmoji}</span>
              <span style={{ color: '#e8e8e8' }}>{b.code}</span>
            </div>
            <span style={{ textAlign: 'right', color: b.y2 != null && usY2 != null && b.y2 > usY2 ? '#ff3355' : '#888' }}>{fmtNum(b.y2, 2)}</span>
            <span style={{ textAlign: 'right', color: '#e8e8e8', fontWeight: maturity === 'y10' ? 600 : 400 }}>{fmtNum(b.y10, 2)}</span>
            <span style={{ textAlign: 'right', color: '#888' }}>{fmtNum(b.y30, 2)}</span>
            <span style={{ textAlign: 'right', color: b.code === 'US' ? '#999' : (b.spread10Y || 0) > 0 ? '#ff8800' : '#00ff88' }}>
              {b.code === 'US' ? '—' : `${(b.spread10Y ?? 0) > 0 ? '+' : ''}${fmtNum(b.spread10Y, 2)}%`}
            </span>
            <span style={{ textAlign: 'right', color: RATING_COLORS[b.rating] || '#888', fontSize: 8 }}>{b.rating}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>FRED · SOVEREIGN YIELDS</span>
        <span style={{ color: '#00ff88' }}>● T2</span>
      </div>
    </div>
  );
}
