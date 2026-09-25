import { useState, useEffect } from 'react';
import { Shield, Radio, Eye, Zap } from 'lucide-react';

interface IntelItem {
  id: string;
  time: string;
  category: 'SIGINT' | 'HUMINT' | 'OSINT' | 'IMINT';
  region: string;
  text: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  tickers: string[];
}

const INITIAL_INTEL: IntelItem[] = [
  {
    id: 'i1', time: '14:44', category: 'OSINT', region: 'Red Sea',
    text: 'AIS signal loss detected for 3 bulk carriers near Bab el-Mandeb strait. Possible disruption.',
    confidence: 'HIGH', tickers: ['ZIM', 'DAC', 'GOGL', 'USO'],
  },
  {
    id: 'i2', time: '13:22', category: 'OSINT', region: 'Taiwan Strait',
    text: 'PLA naval vessel activity 40nm west of Kinmen Islands. Third carrier group confirmed by satellite imagery.',
    confidence: 'HIGH', tickers: ['TSM', 'AMAT', 'ASML', 'EWH'],
  },
  {
    id: 'i3', time: '12:08', category: 'HUMINT', region: 'Iran',
    text: 'Natanz facility reports increased centrifuge activity. IAEA inspector access denied for 72h.',
    confidence: 'MEDIUM', tickers: ['USO', 'GLD', 'IEF', 'LMT'],
  },
  {
    id: 'i4', time: '11:55', category: 'SIGINT', region: 'Russia',
    text: 'Encrypted military communications spike detected near Belgorod region. Assessment ongoing.',
    confidence: 'LOW', tickers: ['NG=F', 'GLD', 'RTX'],
  },
  {
    id: 'i5', time: '10:33', category: 'IMINT', region: 'Sudan',
    text: 'Satellite analysis shows RSF convoy movement north of Omdurman. Population displacement risk elevated.',
    confidence: 'HIGH', tickers: ['GLD', 'USO'],
  },
  {
    id: 'i6', time: '09:18', category: 'OSINT', region: 'North Korea',
    text: 'Musudan-ri site thermal activity consistent with rocket motor test preparation.',
    confidence: 'MEDIUM', tickers: ['LMT', 'RTX', 'NOC', 'GLD'],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  SIGINT: '#a78bfa',
  HUMINT: '#00ccff',
  OSINT: '#00ff88',
  IMINT: '#ffaa00',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: '#ff3355',
  MEDIUM: '#ffaa00',
  LOW: '#666680',
};

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  SIGINT: <Radio size={9} />,
  HUMINT: <Eye size={9} />,
  OSINT: <Zap size={9} />,
  IMINT: <Shield size={9} />,
};

export function IntelFeedPanel() {
  const [intel, setIntel] = useState<IntelItem[]>(INITIAL_INTEL);
  const [filter, setFilter] = useState<string | null>(null);

  // Simulate occasional new intel items
  useEffect(() => {
    // Math.random() fake intel injection removed for data integrity.
    // Real implementation would poll an OSINT/SIGINT feed or intelligence API.
  }, []);

  const categories = ['SIGINT', 'HUMINT', 'OSINT', 'IMINT'] as const;
  const filtered = filter ? intel.filter(i => i.category === filter) : intel;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div style={{
        padding: '4px 8px',
        background: 'rgba(255,51,85,0.06)',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Shield size={10} color="#ff3355" />
        <span style={{ fontSize: 8, color: '#ff3355', letterSpacing: 1 }}>INTELLIGENCE FEED</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3355', boxShadow: '0 0 4px #ff3355' }} />
          <span style={{ fontSize: 7, color: '#ff3355' }}>LIVE</span>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1a1a2e',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: !filter ? '#1a1a2e' : 'transparent',
            color: !filter ? '#e8e8e8' : '#555',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
            whiteSpace: 'nowrap',
          }}
        >
          ALL
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? null : cat)}
            style={{
              padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
              background: filter === cat ? '#1a1a2e' : 'transparent',
              color: filter === cat ? CATEGORY_COLORS[cat] : '#444',
              cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
              display: 'flex', alignItems: 'center', gap: 3,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: CATEGORY_COLORS[cat] }}>{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((item, i) => (
          <div key={item.id} style={{
            padding: '6px 8px',
            borderBottom: '1px solid #0f0f18',
            borderLeft: `2px solid ${CATEGORY_COLORS[item.category]}`,
            background: i === 0 ? `rgba(${item.category === 'SIGINT' ? '167,139,250' : '0,204,255'},0.03)` : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ color: CATEGORY_COLORS[item.category], display: 'flex', alignItems: 'center', gap: 2 }}>
                {CATEGORY_ICONS[item.category]}
                <span style={{ fontSize: 8 }}>{item.category}</span>
              </span>
              <span style={{ fontSize: 8, color: '#555' }}>·</span>
              <span style={{ fontSize: 8, color: '#666680' }}>{item.region}</span>
              <span style={{
                marginLeft: 'auto', fontSize: 7, fontWeight: 700, letterSpacing: 1,
                color: CONFIDENCE_COLORS[item.confidence],
                border: `1px solid ${CONFIDENCE_COLORS[item.confidence]}33`,
                padding: '0 3px',
              }}>{item.confidence}</span>
              <span style={{ fontSize: 8, color: '#444' }}>{item.time}</span>
            </div>
            <div style={{ fontSize: 9, color: '#ccc', lineHeight: 1.5, marginBottom: 4 }}>
              {item.text}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {item.tickers.map(t => (
                <span key={t} style={{
                  fontSize: 7, color: '#00ccff',
                  border: '1px solid #00ccff33', padding: '0 3px',
                }}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '3px 8px', borderTop: '1px solid #1a1a2e',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 7, color: '#333',
      }}>
        <span>SRC: ACLED / GDELT / OSINT</span>
        <span>CLASSIFICATION: UNCLASSIFIED//FOUO</span>
      </div>
    </div>
  );
}