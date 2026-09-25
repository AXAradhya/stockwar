import { useState } from 'react';
import { AlertOctagon, Shield, ShieldOff } from 'lucide-react';

interface Siren {
  region: string;
  time: string;
  type: string;
  intercepted: boolean;
}

export function IsraelSirensPanel() {
  const [sirens, setSirens] = useState<Siren[]>([]);
  const [alerting] = useState(false);
  const [totalToday] = useState(0);


  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'JetBrains Mono, monospace',
      background: alerting ? 'rgba(255,51,85,0.05)' : 'transparent',
      transition: 'background 0.3s',
    }}>
      {/* Status Bar */}
      <div style={{
        padding: '4px 8px',
        background: alerting ? 'rgba(255,51,85,0.2)' : '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <AlertOctagon size={12} color={alerting ? '#ff3355' : '#666680'} />
        <span style={{ fontSize: 9, color: alerting ? '#ff3355' : '#666680', letterSpacing: 1 }}>
          OREF LIVE FEED
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 8, color: '#444' }}>TODAY: <span style={{ color: '#ff6633' }}>{totalToday}</span></span>
          <span style={{ fontSize: 8, color: '#444' }}>ACTIVE: <span style={{ color: '#ff3355' }}>YES</span></span>
        </div>
      </div>

      {/* Alert Banner */}
      {alerting && (
        <div style={{
          padding: '6px 8px',
          background: 'rgba(255,51,85,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'pulse 0.5s infinite',
        }}>
          <AlertOctagon size={14} color="#ff3355" />
          <span style={{ fontSize: 10, color: '#ff3355', letterSpacing: 1, fontWeight: 700 }}>
            ⚠ ACTIVE ALERT — {sirens[0]?.region?.toUpperCase()}
          </span>
        </div>
      )}

      {/* Siren Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sirens.map((s, i) => (
          <div
            key={`${s.region}-${s.time}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1fr 80px 40px',
              alignItems: 'center',
              padding: '4px 8px',
              borderBottom: '1px solid #0f0f18',
              opacity: i === 0 ? 1 : 0.6 + (0.4 / sirens.length) * (sirens.length - i),
              gap: 4,
            }}
          >
            <span style={{ fontSize: 9, color: '#444' }}>{s.time}</span>
            <span style={{ fontSize: 10, color: i === 0 ? '#ff3355' : '#aaa' }}>{s.region}</span>
            <span style={{ fontSize: 8, color: '#666680' }}>{s.type}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {s.intercepted ? (
                <Shield size={10} color="#00ff88" />
              ) : (
                <ShieldOff size={10} color="#ff3355" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        padding: '4px 8px',
        borderTop: '1px solid #1a1a2e',
        display: 'flex', gap: 12,
        fontSize: 8, color: '#444',
      }}>
        <span>INTERCEPTED: <span style={{ color: '#00ff88' }}>
          {sirens.filter(s => s.intercepted).length}/{sirens.length}
        </span></span>
        <span>SRC: OREF/IDF</span>
      </div>
    </div>
  );
}
