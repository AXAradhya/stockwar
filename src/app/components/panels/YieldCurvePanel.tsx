import { useState, useEffect, useId } from 'react';
import { fetchYieldCurve } from '../../services/apiServices';
import { AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Area } from 'recharts';
import { fmtNum, roundTo } from '../../utils/numberFormat';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#0d0d18', border: '1px solid #1a1a2e', padding: '4px 8px', fontFamily: 'JetBrains Mono', fontSize: 9 }}>
        <div style={{ color: '#666680' }}>{label}</div>
        <div style={{ color: '#00ccff' }}>{fmtNum(payload[0].value, 2)}%</div>
      </div>
    );
  }
  return null;
};

export function YieldCurvePanel() {
  const uid = useId();
  const gradientId = `yieldGrad-${uid.replace(/:/g, '')}`;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await fetchYieldCurve();
        if (mounted) { setData(d); setLoading(false); setError(null); }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 3600000); // FRED updates daily
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING YIELD CURVE (FRED)...</div>;
  if (error) return (
    <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}>
      <div>⚠ YIELD CURVE DATA UNAVAILABLE</div>
      <div style={{ marginTop: 6, color: '#444', fontSize: 8 }}>{error}</div>
      <div style={{ marginTop: 8, color: '#00ccff', fontSize: 8 }}>Add FRED API key in Settings → API Keys</div>
    </div>
  );
  if (data.length < 2) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>INSUFFICIENT DATA</div>;

  const tenY = data.find(d => d.maturity === '10Y');
  const twoY = data.find(d => d.maturity === '2Y');
  const thirtyY = data.find(d => d.maturity === '30Y');
  const spread_10_2 = tenY && twoY ? roundTo(tenY.yield - twoY.yield, 2) : null;
  const spreadText = spread_10_2 != null ? `${spread_10_2 >= 0 ? '+' : ''}${fmtNum(spread_10_2, 2)}%` : 'N/A';
  const isInverted = tenY && twoY ? tenY.yield < twoY.yield : false;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
      <div style={{ display: 'flex', gap: 12, padding: '0 8px 6px', borderBottom: '1px solid #1a1a2e', fontFamily: 'JetBrains Mono, monospace' }}>
        <div>
          <div style={{ fontSize: 8, color: '#444' }}>10Y-2Y SPREAD</div>
          <div style={{ fontSize: 12, color: (spread_10_2 ?? 0) < 0 ? '#ff3355' : '#00ff88' }}>
            {spreadText}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#444' }}>STATUS</div>
          <div style={{ fontSize: 10, color: isInverted ? '#ff3355' : '#00ff88' }}>{isInverted ? '⚠ INVERTED' : '✓ NORMAL'}</div>
        </div>
        {tenY && <div><div style={{ fontSize: 8, color: '#444' }}>10Y</div><div style={{ fontSize: 12, color: '#e8e8e8' }}>{fmtNum(tenY.yield, 2)}%</div></div>}
        {thirtyY && <div><div style={{ fontSize: 8, color: '#444' }}>30Y</div><div style={{ fontSize: 12, color: '#e8e8e8' }}>{fmtNum(thirtyY.yield, 2)}%</div></div>}
        <div style={{ marginLeft: 'auto', fontSize: 7, color: '#333', alignSelf: 'flex-end' }}>SOURCE: FRED</div>
      </div>
      <div style={{ flex: 1, padding: '4px 0' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs key="yield-curve-defs">
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop key="stop-top" offset="5%" stopColor="#00ccff" stopOpacity={0.2} />
                <stop key="stop-bottom" offset="95%" stopColor="#00ccff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis key="x-axis" dataKey="maturity" tick={{ fill: '#444', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#1a1a2e' }} tickLine={false} />
            <YAxis key="y-axis" domain={['auto', 'auto']} tick={{ fill: '#444', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#1a1a2e' }} tickLine={false} tickFormatter={v => `${v}%`} width={36} />
            <Tooltip key="tooltip" content={<CustomTooltip />} />
            <Area key="area" type="monotone" dataKey="yield" stroke="#00ccff" strokeWidth={1.5} fill={`url(#${gradientId})`} dot={{ fill: '#00ccff', r: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ borderTop: '1px solid #1a1a2e', display: 'flex', overflow: 'hidden', height: 24 }}>
            {data.map(y => (
          <div key={y.maturity} style={{ flex: 1, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, borderRight: '1px solid #1a1a2e', padding: '2px 0' }}>
            <div style={{ color: '#444' }}>{y.maturity}</div>
            <div style={{ color: '#00ccff' }}>{fmtNum(y.yield, 2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}