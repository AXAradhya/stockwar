import { useState, useEffect } from 'react';
import { fetchSectorHeatmap } from '../../services/apiServices';
import { fmtPct } from '../../utils/numberFormat';
import { useWorkspaceStore } from '../../stores/workspaceStore';

function getColor(change: number): string {
  if (change > 2) return '#00dd66';
  if (change > 1) return '#00bb44';
  if (change > 0.3) return '#008833';
  if (change > -0.3) return '#333344';
  if (change > -1) return '#882233';
  if (change > -2) return '#aa1133';
  return '#cc0022';
}

function getTextColor(change: number): string {
  return Math.abs(change) < 0.3 ? '#999' : '#fff';
}

export function SectorHeatmapPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openWorkspace } = useWorkspaceStore();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await fetchSectorHeatmap();
        if (!mounted) return;
        setData(d || []);
        setLoading(false);
        if (!d || d.length === 0) {
          setError('Sector data unavailable');
        } else {
          setError(null);
        }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 300000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING SECTORS...</div>;
  if (error) return <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}><div>⚠ SECTOR DATA UNAVAILABLE</div><div style={{ marginTop: 6, color: '#444', fontSize: 8 }}>{error}</div></div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 4, gap: 4 }}>
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2,
      }}>
        {data.map((s, i) => (
          <div
            key={s.ticker}
            style={{
              background: getColor(s.change),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              cursor: 'pointer',
              transition: 'filter 0.3s',
              gridColumn: i === 10 ? 'span 2' : undefined,
            }}
            onClick={() => openWorkspace('sector', s.ticker, s.name)}
          >
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              color: getTextColor(s.change),
              textAlign: 'center',
              letterSpacing: 0.5,
              lineHeight: 1.2,
            }}>
              {s.name}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: getTextColor(s.change),
              fontWeight: 700,
            }}>
              {fmtPct(s.change, 2)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 0',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8,
        color: '#444',
      }}>
        <div style={{ width: 12, height: 8, background: '#cc0022' }} />
        <span>-2%+</span>
        <div style={{ width: 12, height: 8, background: '#882233' }} />
        <span>-1%</span>
        <div style={{ width: 12, height: 8, background: '#333344' }} />
        <span>0%</span>
        <div style={{ width: 12, height: 8, background: '#008833' }} />
        <span>+1%</span>
        <div style={{ width: 12, height: 8, background: '#00dd66' }} />
        <span>+2%+</span>
      </div>
    </div>
  );
}
