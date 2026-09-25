import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Globe } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const TREND_ICONS: Record<string, React.ReactNode> = {
  ESCALATING: <TrendingUp size={9} color="#ff3355" />,
  STABLE: <Minus size={9} color="#ffaa00" />,
  DECLINING: <TrendingDown size={9} color="#00ff88" />,
};

// Map countries to app regions
const COUNTRY_REGION_MAP: Record<string, string[]> = {
  'Iran': ['MIDDLE EAST'],
  'Russia': ['EUROPE'],
  'China': ['ASIA'],
  'North Korea': ['ASIA'],
  'Pakistan': ['ASIA', 'INDIA'],
  'India': ['ASIA', 'INDIA'],
  'Israel': ['MIDDLE EAST'],
  'Saudi Arabia': ['MIDDLE EAST'],
  'Turkey': ['MIDDLE EAST', 'EUROPE'],
  'Venezuela': ['AMERICAS'],
  'Cuba': ['AMERICAS'],
  'Myanmar': ['ASIA'],
  'Ethiopia': ['AFRICA'],
  'Nigeria': ['AFRICA'],
};

export function GeopoliticalHubsPanel() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [data] = useState<any[]>([]);
  const { region } = useUiStore();

  const filteredData = data;
  const displayData = filteredData;
  const avgRisk = displayData.length ? Math.round(displayData.reduce((s, h) => s + h.risk, 0) / displayData.length) : 0;
  const escalating = displayData.filter(h => h.trend === 'ESCALATING').length;


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Risk Summary Header */}
      <div style={{ padding: '4px 8px', background: 'rgba(255,51,85,0.06)', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={10} color="#ff3355" />
        <span style={{ fontSize: 8, color: '#ff3355', letterSpacing: 1 }}>GEOPOLITICAL RISK MATRIX</span>
        {region !== 'GLOBAL' && <span style={{ fontSize: 7, padding: '1px 5px', color: '#00ccff', border: '1px solid #00ccff33' }}>{region}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 8, color: '#444' }}>
            AVG RISK: <span style={{ color: avgRisk > 75 ? '#ff3355' : '#ffaa00' }}>{avgRisk}/100</span>
          </span>
          <span style={{ fontSize: 8, color: '#444' }}>
            ESCALATING: <span style={{ color: '#ff3355' }}>{escalating}</span>
          </span>
        </div>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 50px 80px', padding: '3px 8px', borderBottom: '1px solid #1a1a2e', fontSize: 7, color: '#444', letterSpacing: 1, background: '#0d0d18' }}>
        <span>COUNTRY</span>
        <span>TREND</span>
        <span style={{ textAlign: 'right' }}>EVT</span>
        <span style={{ textAlign: 'right' }}>RISK</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayData.sort((a, b) => b.risk - a.risk).map(h => {
          const riskColor = h.risk > 80 ? '#ff3355' : h.risk > 60 ? '#ffaa00' : '#00ff88';
          const isExp = expanded === h.country;
          return (
            <div key={h.country}>
              <div
                onClick={() => setExpanded(isExp ? null : h.country)}
                style={{ display: 'grid', gridTemplateColumns: '70px 1fr 50px 80px', alignItems: 'center', padding: '5px 8px', borderBottom: '1px solid #0f0f18', borderLeft: isExp ? `2px solid ${riskColor}` : '2px solid transparent', cursor: 'pointer', background: isExp ? `rgba(255,51,85,0.04)` : 'transparent', gap: 4 }}
              >
                <span style={{ fontSize: 10, color: '#e8e8e8' }}>{h.country}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {TREND_ICONS[h.trend]}
                  <span style={{ fontSize: 8, color: h.trend === 'ESCALATING' ? '#ff3355' : h.trend === 'DECLINING' ? '#00ff88' : '#ffaa00' }}>{h.trend}</span>
                </div>
                <span style={{ textAlign: 'right', fontSize: 9, color: '#666680' }}>{h.events}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <div style={{ width: 28, height: 3, background: '#1a1a2e' }}>
                    <div style={{ width: `${h.risk}%`, height: '100%', background: riskColor, transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, color: riskColor, minWidth: 20, textAlign: 'right' }}>{Math.round(h.risk)}</span>
                </div>
              </div>

              {isExp && (
                <div style={{ padding: '6px 8px 8px 14px', background: 'rgba(255,51,85,0.03)', borderBottom: '1px solid #1a1a2e', borderLeft: `2px solid ${riskColor}` }}>
                  <div style={{ fontSize: 9, color: '#aaa', lineHeight: 1.5, marginBottom: 6 }}>{h.keyEvent}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 7, color: '#444' }}>AFFECTED ASSETS:</span>
                    {h.affectedAssets.map(t => (
                      <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff33', padding: '0 4px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall risk bar */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #1a1a2e', background: '#0f0f1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 7, color: '#444' }}>COMPOSITE GEOPOLITICAL RISK INDEX</span>
          <span style={{ fontSize: 8, color: avgRisk > 75 ? '#ff3355' : '#ffaa00' }}>{avgRisk}/100</span>
        </div>
        <div style={{ height: 3, background: '#1a1a2e' }}>
          <div style={{ width: `${avgRisk}%`, height: '100%', background: `linear-gradient(90deg, #ffaa00, #ff3355)`, transition: 'width 1s ease' }} />
        </div>
      </div>
    </div>
  );
}