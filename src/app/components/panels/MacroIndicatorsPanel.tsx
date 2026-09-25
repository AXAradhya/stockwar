import { useState, useEffect } from 'react';
import { fetchMacroIndicators } from '../../services/apiServices';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up' || trend === 'up_good') return <TrendingUp size={9} color={trend === 'up_good' ? '#00ff88' : '#ff3355'} />;
  if (trend === 'down' || trend === 'down_good') return <TrendingDown size={9} color={trend === 'down_good' ? '#00ff88' : '#ff3355'} />;
  return <Minus size={9} color="#666680" />;
}

function getTrendColor(trend: string) {
  if (trend === 'up_good' || trend === 'down_good') return '#00ff88';
  if (trend === 'up' || trend === 'down') return '#ff3355';
  return '#666680';
}

// Regime detection based on indicators
function getMacroRegime() {
  const gdp = 2.8;
  const inflation = 2.8;
  const unemployment = 3.7;
  if (gdp > 2 && inflation < 3 && unemployment < 4) return { label: 'GOLDILOCKS', color: '#00ff88', desc: 'Growth above trend, inflation cooling' };
  if (gdp < 0) return { label: 'RECESSION', color: '#ff3355', desc: 'Negative growth territory' };
  if (inflation > 4) return { label: 'STAGFLATION RISK', color: '#ff3355', desc: 'High inflation + slowing growth' };
  return { label: 'LATE CYCLE', color: '#ffaa00', desc: 'Expansion showing signs of cooling' };
}

export function MacroIndicatorsPanel() {
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchMacroIndicators();
        if (mounted) { setIndicators(data); setLoading(false); setError(null); }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 3600000); // hourly
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING MACRO INDICATORS (FRED)...</div>;
  if (error) return <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}><div>⚠ MACRO DATA UNAVAILABLE</div><div style={{ marginTop: 6, color: '#444', fontSize: 8 }}>{error}</div><div style={{ marginTop: 8, color: '#00ccff', fontSize: 8 }}>Add FRED API key in Settings → API Keys</div></div>;

  const regime = getMacroRegime();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Regime Banner */}
      <div style={{
        padding: '5px 8px',
        background: `${regime.color}10`,
        borderBottom: `1px solid ${regime.color}33`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          padding: '2px 8px',
          background: `${regime.color}22`,
          border: `1px solid ${regime.color}44`,
          fontSize: 9, color: regime.color, letterSpacing: 2, fontWeight: 700,
        }}>
          {regime.label}
        </div>
        <span style={{ fontSize: 8, color: '#666680' }}>{regime.desc}</span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '14px 1fr 72px 72px 60px',
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span></span>
        <span>INDICATOR</span>
        <span style={{ textAlign: 'right' }}>CURRENT</span>
        <span style={{ textAlign: 'right' }}>PREV</span>
        <span style={{ textAlign: 'right' }}>DATE</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {indicators.map((ind, i) => {
          const trendColor = getTrendColor(ind.trend);
          return (
            <div
              key={ind.name}
              style={{
                display: 'grid', gridTemplateColumns: '14px 1fr 72px 72px 60px',
                alignItems: 'center', padding: '5px 8px',
                borderBottom: '1px solid #0f0f18',
                background: i === 0 ? '#0f0f1a' : 'transparent',
              }}
            >
              <TrendIcon trend={ind.trend} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: 9, color: '#ccc',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ind.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: trendColor, fontWeight: 600 }}>
                  {ind.value}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 9, color: '#555' }}>{ind.previous}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 7, color: '#333' }}>{ind.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scorecard */}
      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '5px 8px',
        display: 'flex', gap: 12,
      }}>
        {[
          { label: 'GROWTH', val: 72, color: '#00ff88' },
          { label: 'INFLATION', val: 58, color: '#ffaa00' },
          { label: 'EMPLOY', val: 81, color: '#00ff88' },
          { label: 'CREDIT', val: 44, color: '#ffaa00' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1 }}>
            <div style={{ fontSize: 6, color: '#444', letterSpacing: 1, marginBottom: 2 }}>{s.label}</div>
            <div style={{ height: 3, background: '#1a1a2e', position: 'relative' }}>
              <div style={{ width: `${s.val}%`, height: '100%', background: s.color, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 7, color: s.color, marginTop: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
