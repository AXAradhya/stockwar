import { useState, useEffect } from 'react';
import { Plane, AlertTriangle } from 'lucide-react';

interface Flight {
  id: string;
  callsign: string;
  type: 'MILITARY' | 'COMMERCIAL' | 'SURVEILLANCE';
  aircraft: string;
  origin: string;
  destination: string;
  altitude: number;
  speed: number;
  lat: number;
  lon: number;
  country: string;
  flagEmoji: string;
  status: 'AIRBORNE' | 'CLIMBING' | 'DESCENDING' | 'HOLDING';
  intel?: string;
}


const TYPE_COLORS: Record<string, string> = {
  MILITARY: '#ff3355',
  COMMERCIAL: '#00ccff',
  SURVEILLANCE: '#a78bfa',
};

const STATUS_COLORS: Record<string, string> = {
  AIRBORNE: '#00ff88',
  CLIMBING: '#ffaa00',
  DESCENDING: '#ff8800',
  HOLDING: '#a78bfa',
};

export function AviationTrackerPanel() {
  // Mock/fallback data disabled in frontend builds — require a configured data source.
  const ALLOW_FALLBACKS = false;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MILITARY' | 'SURVEILLANCE'>('ALL');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    // Aviation tracker requires a configured ADS-B/OpenSky data source.
  }, []);

  if (flights.length === 0) {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ffaa00" />
        <span style={{ color: '#ffaa00', letterSpacing: 1 }}>DATA NOT CONFIGURED</span>
        <span style={{ textAlign: 'center' }}>Aviation tracking data source is not configured. Configure ADS-B/OpenSky in Settings or provide a secure server-side data proxy.</span>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? flights : flights.filter(f => f.type === filter);
  const selectedFlight = flights.find(f => f.id === selected);
  const militaryCount = flights.filter(f => f.type === 'MILITARY').length;

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'TRACKING', value: flights.length.toString(), color: '#00ccff' },
          { label: 'MILITARY', value: militaryCount.toString(), color: '#ff3355' },
          { label: 'INTEL', value: flights.filter(f => f.intel).length.toString(), color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
            <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 16, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
        <div style={{ flex: 2, padding: '5px 8px', background: '#09090f' }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>ADS-B COVERAGE</div>
          <div style={{ height: 14, background: '#0f0f18', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '87%', background: 'rgba(0,204,255,0.2)', borderRight: '1px solid #00ccff' }} />
            <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 8, color: '#00ccff' }}>87%</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['ALL', 'MILITARY', 'SURVEILLANCE'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 8,
            background: filter === f ? '#1a1a2e' : 'transparent',
            color: filter === f ? '#00ccff' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono',
            borderBottom: filter === f ? '2px solid #00ccff' : '2px solid transparent',
          }}>{f}</button>
        ))}
      </div>

      {/* Intel alert */}
      {selectedFlight?.intel && (
        <div style={{ padding: '4px 8px', background: 'rgba(255,51,85,0.08)', borderBottom: '1px solid rgba(255,51,85,0.2)', display: 'flex', gap: 6, alignItems: 'flex-start', flexShrink: 0 }}>
          <AlertTriangle size={10} color="#ff3355" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: '#ff8888', lineHeight: 1.4 }}>{selectedFlight.intel}</span>
        </div>
      )}

      {/* Flight list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((flight) => (
          <div
            key={flight.id}
            onClick={() => setSelected(flight.id === selected ? null : flight.id)}
            style={{
              padding: '5px 8px', borderBottom: '1px solid #0a0a12', cursor: 'pointer',
              background: selected === flight.id ? '#0f0f1a' : 'transparent',
              borderLeft: selected === flight.id ? `2px solid ${TYPE_COLORS[flight.type]}` : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plane size={9} color={TYPE_COLORS[flight.type]} />
                <span style={{ fontSize: 10, color: '#e8e8e8', fontWeight: 600 }}>{flight.callsign}</span>
                <span style={{ fontSize: 8, color: '#444' }}>{flight.aircraft}</span>
                {flight.intel && <span style={{ fontSize: 7, color: '#ff3355', letterSpacing: 1 }}>INTEL</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8, color: STATUS_COLORS[flight.status] }}>● {flight.status}</span>
                <span style={{ fontSize: 9 }}>{flight.flagEmoji}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 8, color: '#555' }}>
              <span>{flight.origin} → {flight.destination}</span>
              <span>FL{Math.floor(flight.altitude / 100)}</span>
              <span>{flight.speed}kt</span>
              <span style={{ color: TYPE_COLORS[flight.type], fontSize: 7, letterSpacing: 1 }}>{flight.type}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>ADS-B EXCHANGE · OPENSKY · MILITARY OSINT (SNAPSHOT)</span>
        <span style={{ color: '#ffaa00' }}>● STATIC</span>
      </div>
    </div>
  );
}
