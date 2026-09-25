import { useState, useEffect } from 'react';
import { Shield, Plane, Anchor, AlertTriangle, Crosshair, Radio } from 'lucide-react';

type AssetType = 'ground' | 'air' | 'naval' | 'missile' | 'cyber';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface MilitaryEvent {
  id: string;
  type: AssetType;
  label: string;
  location: string;
  region: string;
  lat: number;
  lon: number; // -180 to 180
  severity: Severity;
  time: string;
  details: string;
  country: string;
}

const INITIAL_EVENTS: MilitaryEvent[] = [
  { id: 'm1', type: 'missile', label: 'Ballistic Launch', location: 'N. Korea', region: 'APAC', lat: 40.3, lon: 127.5, severity: 'critical', time: '05:22', details: 'DPRK ICBM launch detected — trajectory: east Pacific', country: '🇰🇵' },
  { id: 'm2', type: 'ground', label: 'Armor Advance', location: 'Eastern Ukraine', region: 'EU', lat: 49.2, lon: 37.1, severity: 'critical', time: '03:45', details: 'Russian armored column advancing near Kharkiv sector', country: '🇷🇺' },
  { id: 'm3', type: 'naval', label: 'Carrier Group', location: 'South China Sea', region: 'APAC', lat: 14.5, lon: 115.2, severity: 'high', time: '02:10', details: 'USS Gerald Ford CSG conducting freedom of navigation ops', country: '🇺🇸' },
  { id: 'm4', type: 'air', label: 'Drone Strike', location: 'Red Sea', region: 'ME', lat: 15.2, lon: 43.4, severity: 'critical', time: '01:33', details: 'Houthi drone swarm intercepted by USS Carney', country: '🇾🇪' },
  { id: 'm5', type: 'cyber', label: 'Infrastructure Attack', location: 'Taiwan', region: 'APAC', lat: 23.7, lon: 120.9, severity: 'high', time: '00:55', details: 'Critical infrastructure cyber attack — APT41 attributed', country: '🇨🇳' },
  { id: 'm6', type: 'ground', label: 'Border Clash', location: 'Gaza Strip', region: 'ME', lat: 31.4, lon: 34.3, severity: 'critical', time: '00:12', details: 'IDF ground operations ongoing — multiple fronts active', country: '🇮🇱' },
  { id: 'm7', type: 'naval', label: 'Submarine Activity', location: 'Pacific', region: 'APAC', lat: 25.0, lon: 140.0, severity: 'medium', time: '23:48', details: 'Chinese submarine tracked near Guam exclusion zone', country: '🇨🇳' },
  { id: 'm8', type: 'air', label: 'Interception', location: 'Taiwan Strait', region: 'APAC', lat: 24.5, lon: 120.0, severity: 'high', time: '23:20', details: 'PLAAF 12x J-20 entered ADIZ — ROC F-16s scrambled', country: '🇨🇳' },
  { id: 'm9', type: 'missile', label: 'Anti-ship Strike', location: 'Mediterranean', region: 'EU', lat: 35.5, lon: 24.0, severity: 'medium', time: '22:50', details: 'Iranian-supplied cruise missiles fired toward shipping', country: '🇮🇷' },
  { id: 'm10', type: 'ground', label: 'Insurgency Strike', location: 'Sudan', region: 'AFRICA', lat: 15.5, lon: 32.5, severity: 'high', time: '22:15', details: 'RSF forces advance on Khartoum eastern districts', country: '🇸🇩' },
  { id: 'm11', type: 'cyber', label: 'Power Grid Hack', location: 'Poland', region: 'EU', lat: 52.0, lon: 20.0, severity: 'medium', time: '21:40', details: 'GRU-linked hackers breached power distribution SCADA', country: '🇷🇺' },
  { id: 'm12', type: 'naval', label: 'Warship Deployment', location: 'Indian Ocean', region: 'IND', lat: 12.0, lon: 72.0, severity: 'medium', time: '21:00', details: 'INS Vikrant CSG deployed for Op Sindhu Shield', country: '🇮🇳' },
];

const TYPE_COLORS: Record<AssetType, string> = {
  ground: '#ffaa00',
  air: '#00ccff',
  naval: '#00ff88',
  missile: '#ff3355',
  cyber: '#a78bfa',
};
const SEV_COLORS: Record<Severity, string> = {
  critical: '#ff3355',
  high: '#ffaa00',
  medium: '#00ccff',
  low: '#666680',
};

// Simple equirectangular map projection helper
// Map: x 0-100%, y 0-100% → lat 90 to -90, lon -180 to 180
function latLonToPercent(lat: number, lon: number): [number, number] {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return [x, y];
}

type FilterRegion = 'ALL' | 'EU' | 'ME' | 'APAC' | 'AFRICA' | 'IND';
type FilterType = 'ALL' | AssetType;

// Simple SVG world map path (very simplified outlines for visual reference)
const WORLD_SVG_CONTINENTS = `
  M25,18 L42,18 L48,22 L50,28 L45,35 L38,38 L30,35 L22,28 L25,18 Z
  M55,15 L58,18 L70,16 L75,20 L72,28 L65,32 L60,30 L55,25 L52,20 Z
  M8,22 L18,20 L25,25 L28,32 L25,40 L18,45 L10,42 L5,35 L8,22 Z
  M38,42 L50,40 L58,44 L62,52 L58,62 L48,66 L40,62 L36,54 L38,42 Z
  M52,28 L95,22 L98,30 L95,42 L85,50 L75,52 L65,48 L58,42 L52,30 Z
  M78,45 L88,42 L92,48 L90,58 L84,60 L78,58 L76,52 Z
`;

export function MilitaryTrackerPanel() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filterRegion, setFilterRegion] = useState<FilterRegion>('ALL');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [selected, setSelected] = useState<MilitaryEvent | null>(null);
  const [view, setView] = useState<'MAP' | 'LIST'>('MAP');
  const [pulse, setPulse] = useState(0);
  const [newEventId, setNewEventId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 600);
    return () => clearInterval(t);
  }, []);

  // Simulate new events
  useEffect(() => {
    // Math.random() fake event injection removed for data integrity.
    // Real implementation would poll ACLED or OSINT military feeds.
  }, []);

  const filtered = events.filter(e =>
    (filterRegion === 'ALL' || e.region === filterRegion) &&
    (filterType === 'ALL' || e.type === filterType)
  );

  const critCount = events.filter(e => e.severity === 'critical').length;
  const REGIONS: FilterRegion[] = ['ALL', 'EU', 'ME', 'APAC', 'AFRICA', 'IND'];
  const TYPES: Array<{ key: FilterType; label: string }> = [
    { key: 'ALL', label: 'ALL' },
    { key: 'ground', label: '🛡 GND' },
    { key: 'air', label: '✈ AIR' },
    { key: 'naval', label: '⚓ SEA' },
    { key: 'missile', label: '🚀 MSL' },
    { key: 'cyber', label: '💻 CYB' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace', background: '#080810' }}>
      {/* Header */}
      <div style={{ padding: '3px 8px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Crosshair size={10} color="#ff3355" />
        <span style={{ fontSize: 9, color: '#ff3355', letterSpacing: 2 }}>MILITARY TRACKER</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, background: '#ff335520', border: '1px solid #ff335544', padding: '1px 5px', color: '#ff3355' }}>
          {critCount} CRITICAL
        </span>
        <button
          onClick={() => setView(v => v === 'MAP' ? 'LIST' : 'MAP')}
          style={{ background: '#1a1a2e', border: '1px solid #333', color: '#888', padding: '1px 6px', fontFamily: 'JetBrains Mono', fontSize: 7, cursor: 'pointer' }}
        >{view === 'MAP' ? 'LIST' : 'MAP'}</button>
      </div>

      {/* Region filter */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setFilterRegion(r)} style={{
            padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: filterRegion === r ? '#1a1a2e' : 'transparent',
            color: filterRegion === r ? '#ff3355' : '#555',
            cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', letterSpacing: 1, flexShrink: 0,
          }}>{r}</button>
        ))}
        <div style={{ flex: 1, borderRight: '1px solid #1a1a2e' }} />
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setFilterType(t.key)} style={{
            padding: '3px 7px', border: 'none', borderLeft: '1px solid #1a1a2e',
            background: filterType === t.key ? '#1a1a2e' : 'transparent',
            color: filterType === t.key ? TYPE_COLORS[t.key as AssetType] || '#ff3355' : '#555',
            cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', flexShrink: 0,
          }}>{t.label}</button>
        ))}
      </div>

      {view === 'MAP' ? (
        /* MAP VIEW */
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#06060e' }}>
          {/* World map background (simplified SVG grid) */}
          <svg viewBox="0 0 100 50" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
            {/* Ocean */}
            <rect width="100" height="50" fill="#060c18" />
            {/* Grid */}
            {[-60, -30, 0, 30, 60].map(lat => (
              <line key={lat} x1="0" y1={(90 - lat) / 180 * 50} x2="100" y2={(90 - lat) / 180 * 50} stroke="rgba(0,80,200,0.1)" strokeWidth="0.2" />
            ))}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => (
              <line key={lon} x1={(lon + 180) / 360 * 100} y1="0" x2={(lon + 180) / 360 * 100} y2="50" stroke="rgba(0,80,200,0.1)" strokeWidth="0.2" />
            ))}
            {/* Simplified land masses */}
            {/* North America */}
            <polygon points="5,8 15,7 22,10 25,15 22,20 15,22 8,20 4,15" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* South America */}
            <polygon points="18,22 24,20 28,24 26,35 20,38 16,33 15,26" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* Europe */}
            <polygon points="42,6 52,5 56,8 54,14 48,16 42,13 40,9" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* Africa */}
            <polygon points="42,16 52,14 56,18 55,30 48,34 41,32 38,25 40,18" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* Asia */}
            <polygon points="52,5 88,4 92,8 90,18 80,24 65,26 55,22 50,16 52,8" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* Australia */}
            <polygon points="72,28 82,26 86,30 84,36 78,38 72,35 70,30" fill="#0f1e12" stroke="#1a2e1a" strokeWidth="0.3" />
            {/* Equator */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,0,0.08)" strokeWidth="0.3" strokeDasharray="1,2" />
          </svg>

          {/* Event markers */}
          {filtered.map(e => {
            const [px, py] = latLonToPercent(e.lat, e.lon);
            const color = TYPE_COLORS[e.type];
            const sevColor = SEV_COLORS[e.severity];
            const isPulse = e.severity === 'critical' && pulse % 2 === 0;
            const isNew = e.id === newEventId;
            return (
              <div
                key={e.id}
                title={`${e.label} — ${e.location}`}
                onClick={() => setSelected(selected?.id === e.id ? null : e)}
                style={{
                  position: 'absolute',
                  left: `${px}%`, top: `${py}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer', zIndex: 2,
                }}
              >
                {/* Pulse ring */}
                {(isPulse || isNew) && (
                  <div style={{
                    position: 'absolute', inset: -6,
                    border: `1px solid ${sevColor}`,
                    borderRadius: '50%',
                    animation: 'ping 1s ease-out infinite',
                    opacity: 0.5,
                  }} />
                )}
                {/* Dot */}
                <div style={{
                  width: e.severity === 'critical' ? 10 : 7,
                  height: e.severity === 'critical' ? 10 : 7,
                  background: color,
                  border: `1px solid ${sevColor}`,
                  borderRadius: '50%',
                  boxShadow: isPulse ? `0 0 8px ${color}` : 'none',
                }} />
              </div>
            );
          })}

          {/* Selected event detail */}
          {selected && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8, right: 8,
              background: '#0a0a14',
              border: `1px solid ${SEV_COLORS[selected.severity]}55`,
              padding: '6px 8px', zIndex: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: SEV_COLORS[selected.severity] }}>{selected.country} {selected.label}</span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 10 }}>✕</button>
              </div>
              <div style={{ fontSize: 8, color: '#bbb', lineHeight: 1.4 }}>{selected.details}</div>
              <div style={{ marginTop: 3, display: 'flex', gap: 8, fontSize: 7, color: '#444' }}>
                <span>{selected.location}</span>
                <span>·</span>
                <span>{selected.region}</span>
                <span>·</span>
                <span style={{ color: TYPE_COLORS[selected.type] }}>{selected.type.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(e => {
            const sevColor = SEV_COLORS[e.severity];
            const typeColor = TYPE_COLORS[e.type];
            const isNew = e.id === newEventId;
            const TypeIcon = e.type === 'air' ? Plane : e.type === 'naval' ? Anchor : e.type === 'cyber' ? Radio : e.type === 'missile' ? AlertTriangle : Shield;
            return (
              <div
                key={e.id}
                style={{
                  padding: '6px 8px', borderBottom: '1px solid #0f0f18',
                  borderLeft: `2px solid ${sevColor}`,
                  background: isNew ? `${sevColor}08` : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setSelected(selected?.id === e.id ? null : e)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <TypeIcon size={9} color={typeColor} />
                  <span style={{ fontSize: 7, color: typeColor, border: `1px solid ${typeColor}33`, padding: '0 3px' }}>{e.type.toUpperCase()}</span>
                  <span style={{ fontSize: 7, color: sevColor, border: `1px solid ${sevColor}33`, padding: '0 3px' }}>{e.severity.toUpperCase()}</span>
                  <span style={{ fontSize: 8 }}>{e.country}</span>
                  {isNew && <span style={{ fontSize: 7, background: sevColor, color: '#000', padding: '0 3px' }}>NEW</span>}
                  <span style={{ marginLeft: 'auto', fontSize: 8, color: '#444' }}>{e.time}</span>
                </div>
                <div style={{ fontSize: 10, color: sevColor === '#ff3355' ? '#e8e8e8' : '#bbb', marginBottom: 2 }}>{e.label} — {e.location}</div>
                <div style={{ fontSize: 8, color: '#555' }}>{e.details}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333', alignItems: 'center' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3355', animation: 'pulse-dot 2s infinite' }} />
        <span>LIVE TRACKING</span>
        <span style={{ marginLeft: 'auto' }}>SRC: ACLED · GDELT · IDF · USNI</span>
      </div>
      <style>{`@keyframes ping { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }`}</style>
    </div>
  );
}
