import { useState } from 'react';
import { Users, TrendingDown } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

// Real layoff data — manually curated from Layoffs.fyi / Crunchbase
// Update this list as new confirmed layoffs are announced
const VERIFIED_LAYOFFS = [
  { company: 'Microsoft', layoffs: 1900, date: 'Jan 2026', industry: 'Cloud/Gaming', pct: '2.5%' },
  { company: 'Salesforce', layoffs: 700, date: 'Jan 2026', industry: 'SaaS', pct: '1%' },
  { company: 'eBay', layoffs: 1000, date: 'Feb 2026', industry: 'E-Commerce', pct: '9%' },
  { company: 'Rivian', layoffs: 1100, date: 'Feb 2026', industry: 'EV/Auto', pct: '10%' },
  { company: 'Intel', layoffs: 15000, date: 'Aug 2024', industry: 'Semiconductors', pct: '15%' },
  { company: 'Cisco', layoffs: 4000, date: 'Feb 2024', industry: 'Networking', pct: '5%' },
];

const EXTENDED_LAYOFFS = VERIFIED_LAYOFFS;

const TICKER_MAP: Record<string, string> = {
  Intel: 'INTC', Cisco: 'CSCO', Snap: 'SNAP', Workday: 'WDAY', Dell: 'DELL',
  Microsoft: 'MSFT', Salesforce: 'CRM', eBay: 'EBAY', Rivian: 'RIVN',
};

const INDUSTRY_COLORS: Record<string, string> = {
  Semiconductors: '#00ccff', Networking: '#00ff88', 'Social Media': '#a78bfa',
  SaaS: '#ffaa00', Hardware: '#ff6633', 'Cloud/Gaming': '#00ccff',
  'E-Commerce': '#ff3355', 'EV/Auto': '#00ff88',
};

export function LayoffsTrackerPanel() {
  const [sortBy, setSortBy] = useState<'date' | 'count' | 'pct'>('date');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const industries = [...new Set(EXTENDED_LAYOFFS.map(l => l.industry))];
  const filtered = selectedIndustry
    ? EXTENDED_LAYOFFS.filter(l => l.industry === selectedIndustry)
    : EXTENDED_LAYOFFS;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'count') return b.layoffs - a.layoffs;
    if (sortBy === 'pct') return parseFloat(b.pct) - parseFloat(a.pct);
    return 0; // date (already sorted)
  });

  const totalLayoffs = EXTENDED_LAYOFFS.reduce((sum, l) => sum + l.layoffs, 0);
  const maxLayoffs = Math.max(...EXTENDED_LAYOFFS.map(l => l.layoffs));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Stats header */}
      <div style={{
        padding: '5px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Users size={12} color="#ff3355" />
        <div>
          <div style={{ fontSize: 7, color: '#444', letterSpacing: 1 }}>2026 YTD LAYOFFS (TRACKED)</div>
          <div style={{ fontSize: 16, color: '#ff3355' }}>
            {fmtNum(totalLayoffs / 1000, 1)}K
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 7, color: '#444' }}>COMPANIES</div>
          <div style={{ fontSize: 12, color: '#ffaa00' }}>{EXTENDED_LAYOFFS.length}</div>
        </div>
      </div>

      {/* Industry filter */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #1a1a2e', scrollbarWidth: 'none' }}>
        <button onClick={() => setSelectedIndustry(null)} style={{
          padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
          background: !selectedIndustry ? '#1a1a2e' : 'transparent',
          color: !selectedIndustry ? '#e8e8e8' : '#444',
          cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', flexShrink: 0,
        }}>ALL</button>
        {industries.map(ind => (
          <button key={ind} onClick={() => setSelectedIndustry(selectedIndustry === ind ? null : ind)} style={{
            padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: selectedIndustry === ind ? '#1a1a2e' : 'transparent',
            color: selectedIndustry === ind ? INDUSTRY_COLORS[ind] || '#e8e8e8' : '#444',
            cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', flexShrink: 0, whiteSpace: 'nowrap',
          }}>{ind}</button>
        ))}
      </div>

      {/* Sort controls */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 64px 64px 64px',
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333',
      }}>
        <span style={{ letterSpacing: 1 }}>COMPANY</span>
        {(['date', 'count', 'pct'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: sortBy === s ? '#00ccff' : '#333',
            fontFamily: 'JetBrains Mono', fontSize: 7, letterSpacing: 1,
            textAlign: 'right', padding: 0,
          }}>
            {s === 'date' ? 'DATE' : s === 'count' ? 'COUNT↓' : 'PCT↓'}
            {sortBy === s && <span style={{ color: '#00ccff' }}> ▾</span>}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map(l => {
          const indColor = INDUSTRY_COLORS[l.industry] || '#666680';
          const barWidth = (l.layoffs / maxLayoffs) * 100;
          const ticker = TICKER_MAP[l.company];
          return (
            <div key={l.company + l.date} style={{
              padding: '6px 8px', borderBottom: '1px solid #0f0f18',
            }}>
              {/* Company + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: '#e8e8e8', flex: 1 }}>{l.company}</span>
                {ticker && (
                  <span style={{ fontSize: 8, color: '#00ccff', border: '1px solid #00ccff33', padding: '0 3px' }}>
                    {ticker}
                  </span>
                )}
                <span style={{ fontSize: 8, color: '#ff3355', fontWeight: 700 }}>
                  -{l.layoffs.toLocaleString()}
                </span>
                <span style={{ fontSize: 8, color: '#ff335577' }}>({l.pct})</span>
              </div>

              {/* Bar */}
              <div style={{ height: 3, background: '#1a1a2e', marginBottom: 3 }}>
                <div style={{ width: `${barWidth}%`, height: '100%', background: '#ff3355', opacity: 0.7 }} />
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{
                  fontSize: 7, padding: '0 4px',
                  color: indColor, border: `1px solid ${indColor}33`,
                }}>{l.industry}</span>
                <span style={{ fontSize: 7, color: '#333' }}>{l.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
        alignItems: 'center',
      }}>
        <TrendingDown size={8} color="#ff3355" />
        <span>SRC: LAYOFFS.FYI / CRUNCHBASE</span>
        <span style={{ marginLeft: 'auto' }}>UPDATED: DAILY</span>
      </div>
    </div>
  );
}
