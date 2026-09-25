import { useState, useEffect } from 'react';
import { Anchor, AlertTriangle, Navigation } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

interface Vessel {
  id: string;
  name: string;
  type: 'TANKER' | 'CARRIER' | 'WARSHIP' | 'CONTAINER' | 'DRILLSHIP';
  flag: string;
  flagEmoji: string;
  region: string;
  status: 'UNDERWAY' | 'AT_ANCHOR' | 'RESTRICTED' | 'DIVERTED';
  cargo?: string;
  intel?: string;
  speed: number;
  heading: number;
  draught: number;
  lastSignal: string;
  mmsi: string;
}


const TYPE_COLORS: Record<string, string> = {
  TANKER: '#ffaa00',
  CARRIER: '#ff3355',
  WARSHIP: '#ff3355',
  CONTAINER: '#00ccff',
  DRILLSHIP: '#a78bfa',
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  UNDERWAY: { color: '#00ff88', label: 'UNDERWAY' },
  AT_ANCHOR: { color: '#ffaa00', label: 'ANCHORED' },
  RESTRICTED: { color: '#ff3355', label: 'RESTRICTED' },
  DIVERTED: { color: '#ff8800', label: 'DIVERTED' },
};

const CHOKEPOINTS = [
  { name: 'Red Sea / BAB-EL-MANDEB', risk: 'HIGH', trafficDrop: '41%' },
  { name: 'Strait of Hormuz', risk: 'ELEVATED', trafficDrop: '8%' },
  { name: 'Taiwan Strait', risk: 'MEDIUM', trafficDrop: '0%' },
  { name: 'Suez Canal', risk: 'MEDIUM', trafficDrop: '12%' },
];

export function MaritimeTrackerPanel() {
  // Fallback/mock data disabled in frontend — require a real AIS/MarineTraffic source or server proxy.
  const ALLOW_FALLBACKS = false;
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'VESSELS' | 'CHOKEPOINTS'>('VESSELS');

  useEffect(() => {
    // Maritime tracker requires a configured AIS/MarineTraffic data source.
  }, []);

  if (vessels.length === 0) {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ffaa00" />
        <span style={{ color: '#ffaa00', letterSpacing: 1 }}>DATA NOT CONFIGURED</span>
        <span style={{ textAlign: 'center' }}>Maritime AIS data source is not configured. Configure MarineTraffic/ AIS in Settings or provide a secure server-side data proxy.</span>
      </div>
    );
  }

  const selectedVessel = vessels.find(v => v.id === selected);
  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'TRACKING', value: vessels.length.toString(), color: '#00ccff' },
          { label: 'WARSHIPS', value: vessels.filter(v => v.type === 'WARSHIP').length.toString(), color: '#ff3355' },
          { label: 'DIVERTED', value: vessels.filter(v => v.status === 'DIVERTED').length.toString(), color: '#ff8800' },
          { label: 'RESTRICTED', value: vessels.filter(v => v.status === 'RESTRICTED').length.toString(), color: '#ff3355' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
            <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['VESSELS', 'CHOKEPOINTS'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
            background: tab === t ? '#1a1a2e' : 'transparent',
            color: tab === t ? '#00ccff' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono',
            borderBottom: tab === t ? '2px solid #00ccff' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* Intel alert for selected vessel */}
      {tab === 'VESSELS' && selectedVessel?.intel && (
        <div style={{ padding: '4px 8px', background: 'rgba(255,51,85,0.08)', borderBottom: '1px solid rgba(255,51,85,0.2)', display: 'flex', gap: 6, flexShrink: 0 }}>
          <AlertTriangle size={10} color="#ff3355" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: '#ff8888', lineHeight: 1.4 }}>{selectedVessel.intel}</span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'VESSELS' ? (
          vessels.map((vessel) => (
            <div
              key={vessel.id}
              onClick={() => setSelected(vessel.id === selected ? null : vessel.id)}
              style={{
                padding: '5px 8px', borderBottom: '1px solid #0a0a12', cursor: 'pointer',
                background: selected === vessel.id ? '#0f0f1a' : 'transparent',
                borderLeft: selected === vessel.id ? `2px solid ${TYPE_COLORS[vessel.type]}` : '2px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Anchor size={8} color={TYPE_COLORS[vessel.type]} />
                  <span style={{ fontSize: 9, color: '#e8e8e8' }}>{vessel.name}</span>
                  {vessel.intel && <AlertTriangle size={8} color="#ff3355" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: STATUS_BADGE[vessel.status].color }}>● {STATUS_BADGE[vessel.status].label}</span>
                  <span>{vessel.flagEmoji}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 8, color: '#555' }}>
                <span style={{ color: TYPE_COLORS[vessel.type], fontSize: 7, letterSpacing: 1 }}>{vessel.type}</span>
                <span>{vessel.region}</span>
                {vessel.speed > 0 && (
                  <span><Navigation size={7} style={{ display: 'inline' }} /> {fmtNum(vessel.speed, 1)}kn</span>
                )}
                <span style={{ color: '#333', marginLeft: 'auto' }}>{vessel.lastSignal}</span>
              </div>
              {vessel.cargo && selected === vessel.id && (
                <div style={{ marginTop: 3, fontSize: 8, color: '#ffaa00' }}>▸ {vessel.cargo}</div>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 9, color: '#444', marginBottom: 8, letterSpacing: 1 }}>GLOBAL CHOKEPOINT STATUS</div>
            {CHOKEPOINTS.map((cp) => (
              <div key={cp.name} style={{ padding: '6px 0', borderBottom: '1px solid #0f0f18' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: '#e8e8e8' }}>{cp.name}</span>
                  <span style={{ fontSize: 8, color: cp.risk === 'HIGH' ? '#ff3355' : cp.risk === 'ELEVATED' ? '#ffaa00' : '#00ccff' }}>
                    {cp.risk}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#0f0f18', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${100 - parseInt(cp.trafficDrop)}%`,
                      background: cp.risk === 'HIGH' ? '#ff3355' : cp.risk === 'ELEVATED' ? '#ffaa00' : '#00ccff',
                    }} />
                  </div>
                  <span style={{ fontSize: 8, color: '#ff8800' }}>▼{cp.trafficDrop} traffic</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>AIS STREAM · MARINETRAFFIC · OSINT</span>
        <span style={{ color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
