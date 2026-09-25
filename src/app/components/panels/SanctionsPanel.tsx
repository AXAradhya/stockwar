import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Globe } from 'lucide-react';

interface SanctionEvent {
  id: string;
  date: string;
  entity: string;
  type: 'INDIVIDUAL' | 'ENTITY' | 'COUNTRY' | 'VESSEL' | 'AIRCRAFT';
  sanctioningBody: string;
  reason: string;
  country: string;
  flagEmoji: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  affectedSectors: string[];
  relatedTickers: string[];
}

// Mock sanctions data removed. Frontend should not include fabricated sanctions events.

const EXPORT_CONTROLS = [
  { category: 'Advanced AI Chips', restrictions: 'Entity List', affectedCountries: ['China', 'Russia', 'Iran'], tickers: ['NVDA', 'AMD', 'INTC'] },
  { category: 'Military Electronics', restrictions: 'EAR Part 744', affectedCountries: ['China', 'Russia'], tickers: ['TXN', 'QCOM', 'AVGO'] },
  { category: 'Aerospace Technology', restrictions: 'ITAR', affectedCountries: ['Russia', 'Belarus'], tickers: ['BA', 'RTX', 'LMT'] },
  { category: 'LNG Technology', restrictions: 'OFAC EO 14071', affectedCountries: ['Russia'], tickers: ['HAL', 'SLB', 'BKR'] },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff3355',
  HIGH: '#ffaa00',
  MEDIUM: '#00ccff',
};

export function SanctionsPanel() {
  // Disable frontend fallbacks — require a configured OFAC/EU sanctions feed proxy.
  const ALLOW_FALLBACKS = false;
  const [events, setEvents] = useState<SanctionEvent[]>([]);
  const [tab, setTab] = useState<'SANCTIONS' | 'EXPORT'>('SANCTIONS');
  const [selected, setSelected] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ffaa00" />
        <span style={{ color: '#ffaa00', letterSpacing: 1 }}>DATA NOT CONFIGURED</span>
        <span style={{ textAlign: 'center' }}>Sanctions feed is not configured. Configure OFAC/EU feeds or provide a secure server-side proxy for this data.</span>
      </div>
    );
  }

  const selectedEvt = events.find(e => e.id === selected);
  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'CRITICAL', value: events.filter(e => e.severity === 'CRITICAL').length.toString(), color: '#ff3355' },
          { label: 'HIGH', value: events.filter(e => e.severity === 'HIGH').length.toString(), color: '#ffaa00' },
          { label: 'TODAY', value: events.filter(e => e.date === '2026-04-12').length.toString(), color: '#00ccff' },
          { label: 'EXPORT CTRLS', value: EXPORT_CONTROLS.length.toString(), color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
            <div style={{ fontSize: 8, color: '#444', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['SANCTIONS', 'EXPORT'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
            background: tab === t ? '#1a1a2e' : 'transparent', color: tab === t ? '#00ccff' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono', borderBottom: tab === t ? '2px solid #00ccff' : '2px solid transparent',
          }}>{t === 'EXPORT' ? 'EXPORT CONTROLS' : 'SANCTIONS FEED'}</button>
        ))}
      </div>

      {/* Selected event detail */}
      {tab === 'SANCTIONS' && selectedEvt && (
        <div style={{ padding: '5px 8px', background: 'rgba(255,51,85,0.06)', borderBottom: '1px solid rgba(255,51,85,0.15)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Shield size={9} color={SEVERITY_COLORS[selectedEvt.severity]} />
            <span style={{ fontSize: 9, color: SEVERITY_COLORS[selectedEvt.severity], fontWeight: 600 }}>{selectedEvt.entity}</span>
          </div>
          <div style={{ fontSize: 8, color: '#666', marginBottom: 3 }}>{selectedEvt.reason}</div>
          {selectedEvt.relatedTickers.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 7, color: '#444' }}>IMPACT:</span>
              {selectedEvt.relatedTickers.map(t => (
                <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff22', padding: '1px 4px' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'SANCTIONS' ? (
          events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelected(evt.id === selected ? null : evt.id)}
              style={{
                padding: '5px 8px', borderBottom: '1px solid #0a0a12', cursor: 'pointer',
                background: selected === evt.id ? '#0f0f1a' : 'transparent',
                borderLeft: `2px solid ${SEVERITY_COLORS[evt.severity]}44`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{evt.flagEmoji}</span>
                  <span style={{ fontSize: 9, color: '#e8e8e8' }}>{evt.entity}</span>
                </div>
                <span style={{ fontSize: 8, color: SEVERITY_COLORS[evt.severity] }}>{evt.severity}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#555' }}>
                <span style={{ color: '#a78bfa' }}>{evt.sanctioningBody}</span>
                <span style={{ fontSize: 7, color: '#333' }}>{evt.type}</span>
                <span style={{ marginLeft: 'auto', color: '#333' }}>{evt.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 8 }}>
            {EXPORT_CONTROLS.map((ctrl, i) => (
              <div key={i} style={{ padding: '6px 8px', marginBottom: 4, border: '1px solid #1a1a2e', background: '#09090f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: '#e8e8e8' }}>{ctrl.category}</span>
                  <span style={{ fontSize: 7, color: '#ff3355', letterSpacing: 1 }}>{ctrl.restrictions}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                  {ctrl.affectedCountries.map(c => (
                    <span key={c} style={{ fontSize: 7, color: '#ffaa00', border: '1px solid #ffaa0022', padding: '1px 4px' }}>{c}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {ctrl.tickers.map(t => (
                    <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff22', padding: '1px 4px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>OFAC · EU SANCTIONS · BIS · OFSI</span>
        <span style={{ color: '#ffaa00' }}>● T3</span>
      </div>
    </div>
  );
}
