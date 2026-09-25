import { useState } from 'react';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: '#ff3355',
  MEDIUM: '#ffaa00',
  LOW: '#00ff88',
};

// Map app Region to conflict data region strings
const REGION_MAP: Record<string, string[]> = {
  GLOBAL: [],
  AMERICAS: ['Americas', 'North America', 'South America', 'Caribbean'],
  EUROPE: ['Europe', 'Eastern Europe', 'Western Europe'],
  ASIA: ['Asia', 'South Asia', 'Southeast Asia', 'East Asia', 'Central Asia'],
  AFRICA: ['Africa', 'Sub-Saharan Africa', 'North Africa'],
  'MIDDLE EAST': ['Middle East'],
  INDIA: ['Asia', 'South Asia', 'India'],
  OCEANIA: ['Oceania', 'Pacific'],
};

export function ArmedConflictsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { region } = useUiStore();
  const filteredConflicts: any[] = [];
  const highCount = 0;


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Region badge */}
      {region !== 'GLOBAL' && (
        <div style={{ padding: '3px 8px', background: 'rgba(0,204,255,0.06)', borderBottom: '1px solid #00ccff22', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Globe size={8} color="#00ccff" />
          <span style={{ fontSize: 7, color: '#00ccff', letterSpacing: 1 }}>FILTER: {region}</span>
          <span style={{ fontSize: 7, color: '#444', marginLeft: 4 }}>{filteredConflicts.length} conflicts</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', padding: '3px 8px', borderBottom: '1px solid #1a1a2e', fontSize: 8, color: '#444', letterSpacing: 1, background: '#0d0d18', flexShrink: 0 }}>
        <span>REGION</span>
        <span>EVENT</span>
        <span style={{ textAlign: 'right' }}>SEVR</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredConflicts.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No conflicts in {region} region
          </div>
        ) : (
          filteredConflicts.map(c => (
            <div key={c.id}>
              <div
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                style={{ display: 'grid', gridTemplateColumns: '14px 80px 1fr 60px', alignItems: 'center', padding: '5px 8px', borderBottom: '1px solid #0f0f18', cursor: 'pointer', background: expanded === c.id ? 'rgba(255,51,85,0.05)' : 'transparent', gap: 4 }}
              >
                {expanded === c.id ? <ChevronDown size={10} color="#666" /> : <ChevronRight size={10} color="#444" />}
                <span style={{ fontSize: 9, color: '#666680' }}>{c.region}</span>
                <div>
                  <div style={{ fontSize: 10, color: '#e8e8e8' }}>{c.country}</div>
                  <div style={{ fontSize: 8, color: '#555' }}>{c.type}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 8, fontWeight: 700, color: SEVERITY_COLORS[c.severity], border: `1px solid ${SEVERITY_COLORS[c.severity]}33`, padding: '1px 4px' }}>
                  {c.severity}
                </div>
              </div>

              {expanded === c.id && (
                <div style={{ padding: '6px 8px 6px 22px', borderBottom: '1px solid #1a1a2e', background: 'rgba(255,51,85,0.03)' }}>
                  <div style={{ fontSize: 9, color: '#aaa', lineHeight: 1.5, marginBottom: 6 }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 8, color: '#444' }}>CASUALTIES:</span>
                    <span style={{ fontSize: 9, color: '#ff6633' }}>{c.casualties}</span>
                    <span style={{ fontSize: 8, color: '#444' }}>SRC: {c.source}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 8, color: '#444' }}>AFFECTED:</span>
                    {c.affectedTickers.map(t => (
                      <span key={t} style={{ fontSize: 8, color: '#00ccff', border: '1px solid #00ccff33', padding: '0 4px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={{ padding: '5px 8px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: 12, fontSize: 8, color: '#444', flexShrink: 0 }}>
        <span>ACTIVE: <span style={{ color: '#ff3355' }}>{filteredConflicts.length}</span></span>
        <span>HIGH: <span style={{ color: '#ff3355' }}>{highCount}</span></span>
        {region !== 'GLOBAL' && <span style={{ color: '#00ccff' }}>REGION: {region}</span>}
        <span style={{ marginLeft: 'auto' }}>SRC: ACLED/UCDP</span>
      </div>
    </div>
  );
}
