import { useState, useEffect } from 'react';
import { fetchFearGreed } from '../../services/apiServices';

function getLabel(v: number) {
  if (v >= 80) return { label: 'EXTREME GREED', color: '#00ff88' };
  if (v >= 60) return { label: 'GREED', color: '#88ff44' };
  if (v >= 40) return { label: 'NEUTRAL', color: '#ffaa00' };
  if (v >= 20) return { label: 'FEAR', color: '#ff6633' };
  return { label: 'EXTREME FEAR', color: '#ff3355' };
}

export function FearGreedPanel() {
  const [value, setValue] = useState(50);
  const [sentiment, setSentiment] = useState('Neutral');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchFearGreed();
        if (mounted) {
          setValue(data.value);
          setSentiment(data.sentiment);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    load();
    // Fear & greed updates once a day; refresh every hour
    const t = setInterval(load, 3600000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const { label, color } = getLabel(value);

  const svgW = 200;
  const svgH = 120;
  const cx = svgW / 2;
  const cy = 100;
  const r = 75;

  const polarToXY = (angleDeg: number, radius: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (startPct: number, endPct: number, radius: number, innerRadius: number) => {
    const startAngle = (startPct / 100) * 180 - 180;
    const endAngle = (endPct / 100) * 180 - 180;
    const s = polarToXY(startAngle + 90, radius);
    const e = polarToXY(endAngle + 90, radius);
    const si = polarToXY(startAngle + 90, innerRadius);
    const ei = polarToXY(endAngle + 90, innerRadius);
    const large = (endPct - startPct) > 50 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${si.x} ${si.y} Z`;
  };

  const segments = [
    { start: 0, end: 20, color: '#ff3355', label: 'E. Fear' },
    { start: 20, end: 40, color: '#ff6633', label: 'Fear' },
    { start: 40, end: 60, color: '#ffaa00', label: 'Neutral' },
    { start: 60, end: 80, color: '#88ff44', label: 'Greed' },
    { start: 80, end: 100, color: '#00ff88', label: 'E. Greed' },
  ];

  const needleAngle = (value / 100) * 180 - 180;
  const needleEnd = polarToXY(needleAngle + 90, r - 8);
  const needleBase1 = polarToXY(needleAngle + 90 + 90, 6);
  const needleBase2 = polarToXY(needleAngle + 90 - 90, 6);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING FEAR & GREED...</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8, fontFamily: 'JetBrains Mono, monospace' }}>
      <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
        {segments.map(seg => (
          <path key={seg.label} d={arcPath(seg.start, seg.end, r, r - 18)} fill={seg.color} opacity={0.85} />
        ))}
        <polygon points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`} fill={color} opacity={0.9} style={{ transition: 'all 1s ease' }} />
        <circle cx={cx} cy={cy} r={6} fill="#0d0d18" stroke={color} strokeWidth={2} />
      </svg>

      <div style={{ fontSize: 36, color, letterSpacing: -1, marginTop: -12, lineHeight: 1 }}>
        {Math.round(value)}
      </div>
      <div style={{ fontSize: 11, color, letterSpacing: 3, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 8, color: '#666', marginTop: 4 }}>SRC: ALTERNATIVE.ME — {sentiment.toUpperCase()}</div>

      <div style={{ width: '100%', marginTop: 12 }}>
        {segments.map(seg => {
          const { color: sColor } = getLabel((seg.start + seg.end) / 2);
          const isActive = value >= seg.start && value < seg.end;
          return (
            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid #0f0f18', opacity: isActive ? 1 : 0.4 }}>
              <span style={{ fontSize: 8, color: sColor, flex: 1 }}>{seg.label}</span>
              <span style={{ fontSize: 8, color: isActive ? sColor : '#333' }}>{seg.start}–{seg.end}</span>
              {isActive && <span style={{ fontSize: 7, color: sColor, border: `1px solid ${sColor}44`, padding: '0 3px' }}>CURRENT</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}