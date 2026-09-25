import { useState, useEffect } from 'react';

import { Zap, Brain, TrendingUp } from 'lucide-react';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#ff3355',
  HIGH: '#ffaa00',
  MEDIUM: '#00ccff',
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#00ff88' : value >= 70 ? '#ffaa00' : '#00ccff';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 50, height: 3, background: '#1a1a2e' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 9, color, fontFamily: 'JetBrains Mono', minWidth: 28 }}>{value}%</span>
    </div>
  );
}

// Removed inline live signal examples; cross-source signals require a real synthesis backend.

export function CrossSourceSignalsPanel() {
  const [signals] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [scanPulse] = useState(false);
  const [newSignalId] = useState<string | null>(null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div style={{
        padding: '4px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Brain size={10} color="#00ccff" />
        <span style={{ fontSize: 8, color: '#00ccff', letterSpacing: 2 }}>AI CROSS-SOURCE SIGNALS</span>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 7,
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: scanPulse ? '#00ccff' : '#1a1a2e',
            transition: 'background 0.3s',
            boxShadow: scanPulse ? '0 0 8px #00ccff' : 'none',
          }} />
          <span style={{ color: '#444' }}>{scanPulse ? 'SCANNING...' : 'MONITORING'}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        display: 'flex', gap: 16, fontSize: 7,
      }}>
        {(['CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
          <span key={sev}>
            <span style={{ color: SEV_COLORS[sev] }}>{signals.filter(s => s.severity === sev).length} {sev}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#444' }}>{signals.length} SIGNALS ACTIVE</span>
      </div>

      {/* Signal list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {signals.map(sig => {
          const sevColor = SEV_COLORS[sig.severity] || '#666680';
          const isSelected = selected === sig.id;
          const isNew = newSignalId === sig.id;
          return (
            <div key={sig.id}>
              <div
                onClick={() => setSelected(isSelected ? null : sig.id)}
                style={{
                  padding: '7px 8px', borderBottom: '1px solid #0f0f18',
                  borderLeft: `2px solid ${sevColor}`,
                  cursor: 'pointer',
                  background: isNew
                    ? 'rgba(0,204,255,0.08)'
                    : isSelected
                    ? '#12121e'
                    : 'transparent',
                  transition: 'background 0.5s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                  <Zap size={9} color={sevColor} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 9, color: '#e8e8e8', flex: 1, lineHeight: 1.3 }}>{sig.title}</span>
                  <span style={{ fontSize: 7, color: '#444', flexShrink: 0 }}>{sig.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 15 }}>
                  <ConfidenceBar value={sig.confidence} />
                  <span style={{
                    fontSize: 7, color: sevColor,
                    border: `1px solid ${sevColor}44`, padding: '0 4px',
                  }}>{sig.severity}</span>
                </div>
              </div>
              {isSelected && (
                <div style={{ padding: '6px 8px 8px 16px', background: 'rgba(0,204,255,0.03)', borderBottom: '1px solid #1a1a2e' }}>
                  <div style={{ fontSize: 8, color: '#ccc', lineHeight: 1.6, marginBottom: 6 }}>{sig.summary}</div>
                  {/* Source panels */}
                  <div style={{ fontSize: 7, color: '#444', marginBottom: 3 }}>SOURCE PANELS</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {sig.panels.map(p => (
                      <span key={p} style={{ fontSize: 7, color: '#666680', border: '1px solid #1a1a2e', padding: '1px 5px' }}>{p}</span>
                    ))}
                  </div>
                  {/* Affected tickers */}
                  <div style={{ fontSize: 7, color: '#444', marginBottom: 3 }}>AFFECTED TICKERS</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {sig.tickers.map(t => (
                      <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff33', padding: '1px 5px' }}>
                        <TrendingUp size={7} style={{ display: 'inline', marginRight: 2 }} />{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>⬡ AI SYNTHESIS ENGINE v2.7</span>
        <span style={{ marginLeft: 'auto', color: '#00ccff' }}>● ACTIVE</span>
      </div>
    </div>
  );
}
