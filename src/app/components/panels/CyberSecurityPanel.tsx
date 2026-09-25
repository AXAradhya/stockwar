import { useState } from 'react';
import type { ReactNode } from 'react';
import { ShieldAlert, Zap, Lock, AlertTriangle, ExternalLink } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#ff3355',
  HIGH: '#ffaa00',
  MEDIUM: '#00ccff',
  LOW: '#666680',
};

const TYPE_ICONS: Record<string, ReactNode> = {
  BREACH: <Lock size={9} />,
  RANSOMWARE: <Zap size={9} />,
  'ZERO-DAY': <AlertTriangle size={9} />,
  DDoS: <ShieldAlert size={9} />,
  'SUPPLY CHAIN': <ExternalLink size={9} />,
};

function CVSSBar({ score }: { score: number }) {
  const color = score >= 9 ? '#ff3355' : score >= 7 ? '#ffaa00' : score >= 4 ? '#00ccff' : '#00ff88';
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 60, height: 4, background: '#1a1a2e' }}>
        <div style={{ width: `${(score / 10) * 100}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 8, color, fontFamily: 'JetBrains Mono' }}>{fmtNum(score, 1)}</span>
    </div>
  );
}

// Removed inline mock incident examples to avoid shipping fabricated cybersecurity events.

export function CyberSecurityPanel() {
  const [incidents] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [newAlert] = useState<string | null>(null);

  const displayed = filter === 'ALL' ? incidents : incidents.filter(i => i.severity === filter);
  const critCount = incidents.filter(i => i.severity === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.severity === 'HIGH').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Stats row */}
      <div style={{
        padding: '4px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 7, color: '#444' }}>CRITICAL</div>
          <div style={{ fontSize: 13, color: '#ff3355' }}>{critCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 7, color: '#444' }}>HIGH</div>
          <div style={{ fontSize: 13, color: '#ffaa00' }}>{highCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 7, color: '#444' }}>TOTAL (24H)</div>
          <div style={{ fontSize: 13, color: '#e8e8e8' }}>{incidents.length}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['ALL', 'CRITICAL', 'HIGH'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? '#1a1a2e' : 'transparent',
                border: `1px solid ${filter === f ? '#1a1a2e' : '#111'}`,
                color: filter === f ? '#00ccff' : '#444',
                padding: '1px 6px', fontSize: 7, cursor: 'pointer',
                fontFamily: 'JetBrains Mono', letterSpacing: 1,
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Incident list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.map(inc => {
          const sevColor = SEV_COLORS[inc.severity] || '#666680';
          const isSelected = selected === inc.id;
          const isNew = newAlert === inc.id;
          return (
            <div key={inc.id}>
              <div
                onClick={() => setSelected(isSelected ? null : inc.id)}
                style={{
                  padding: '6px 8px', borderBottom: '1px solid #0f0f18',
                  borderLeft: `2px solid ${sevColor}`,
                  cursor: 'pointer',
                  background: isNew ? 'rgba(255,51,85,0.08)' : isSelected ? '#12121e' : 'transparent',
                  transition: 'background 0.5s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ color: sevColor }}>{TYPE_ICONS[inc.type] || <ShieldAlert size={9} />}</span>
                  <span style={{
                    fontSize: 7, padding: '1px 4px', letterSpacing: 1,
                    background: `${sevColor}22`, color: sevColor,
                  }}>{inc.type}</span>
                  <span style={{ fontSize: 7, color: '#444', marginLeft: 'auto' }}>{inc.date}</span>
                </div>
                <div style={{ fontSize: 9, color: '#e8e8e8', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inc.target}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 7, color: '#666680', flex: 1 }}>
                    {inc.actor}
                  </span>
                  <CVSSBar score={inc.cvss} />
                </div>
              </div>
              {isSelected && (
                <div style={{ padding: '6px 8px 6px 18px', background: 'rgba(255,51,85,0.03)', borderBottom: '1px solid #1a1a2e' }}>
                  <div style={{ fontSize: 8, color: '#ccc', lineHeight: 1.5, marginBottom: 4 }}>{inc.description}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {inc.tickers.map(t => (
                      <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff33', padding: '1px 4px' }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 7, color: '#444' }}>
                    CVSS: {fmtNum(inc.cvss, 1)} · Severity: <span style={{ color: sevColor }}>{inc.severity}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>SRC: CISA/NVD/OSINT</span>
        <span style={{ marginLeft: 'auto', color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}