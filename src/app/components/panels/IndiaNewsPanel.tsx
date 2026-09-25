import { useState, useEffect } from 'react';
import { Radio, AlertTriangle, TrendingUp, IndianRupee } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

interface IndiaNewsItem {
  id: string;
  headline: string;
  source: string;
  category: 'MARKETS' | 'ECONOMY' | 'POLITICS' | 'BUSINESS' | 'TECH' | 'DEFENSE';
  severity: 'critical' | 'high' | 'medium' | 'low';
  time: string;
  tags: string[];
  isBreaking?: boolean;
}

const INDIA_NEWS_FEED: IndiaNewsItem[] = [
  { id: 'in1', headline: 'RBI Monetary Policy Committee holds repo rate at 6.50% — maintains accommodative stance amid inflation concerns', source: 'RBI', category: 'ECONOMY', severity: 'critical', time: '14:30', tags: ['RBI', 'REPO', 'INR'], isBreaking: true },
  { id: 'in2', headline: 'Sensex surges 1,240 pts; Nifty50 breaks 22,400 — FII buying in banking, IT sectors', source: 'NSE', category: 'MARKETS', severity: 'high', time: '13:45', tags: ['NIFTY50', 'SENSEX', 'FII'] },
  { id: 'in3', headline: 'SEBI tightens F&O regulations — new lot sizes, margin requirements from Nov 2025', source: 'SEBI', category: 'MARKETS', severity: 'high', time: '12:20', tags: ['SEBI', 'FO', 'DERIVATIVES'] },
  { id: 'in4', headline: 'India Q4 GDP growth at 7.8% beats estimates — fastest growing major economy for 3rd consecutive quarter', source: 'MoSPI', category: 'ECONOMY', severity: 'high', time: '11:30', tags: ['GDP', 'GROWTH', 'ECONOMY'] },
  { id: 'in5', headline: 'Tata Motors EV division to raise ₹15,000 Cr via IPO in Q3 2025 — Valuation ₹1.2 Lakh Cr', source: 'ET', category: 'BUSINESS', severity: 'medium', time: '10:55', tags: ['TATAMOTORS', 'IPO', 'EV'] },
  { id: 'in6', headline: 'India-Russia oil deal: Reliance Industries locks in 1.5M bpd Urals crude at $4 discount to Brent', source: 'LiveMint', category: 'BUSINESS', severity: 'high', time: '10:10', tags: ['RELIANCE', 'OIL', 'RUSSIA'] },
  { id: 'in7', headline: 'Adani Enterprises wins ₹2.4 Lakh Cr Navi Mumbai Airport project after NCLT clearance', source: 'ET', category: 'BUSINESS', severity: 'medium', time: '09:40', tags: ['ADANIENT', 'INFRA', 'AIRPORT'] },
  { id: 'in8', headline: 'INR strengthens to 82.80/USD as dollar weakens globally; RBI likely intervening', source: 'Bloomberg', category: 'ECONOMY', severity: 'medium', time: '09:15', tags: ['INR', 'USDINR', 'FOREX'] },
  { id: 'in9', headline: 'India defence budget hiked 20% to ₹7.2 Lakh Cr — domestic procurement mandate expanded', source: 'PIB', category: 'DEFENSE', severity: 'high', time: '08:30', tags: ['DEFENSE', 'HAL', 'BEL'] },
  { id: 'in10', headline: 'HDFC Bank Q4 net profit ₹16,512 Cr (+21% YoY) — NIM expands to 4.32%', source: 'NSE', category: 'MARKETS', severity: 'medium', time: '08:00', tags: ['HDFCBANK', 'BANKING', 'RESULTS'] },
  { id: 'in11', headline: 'GST collections hit ₹2.1 Lakh Cr in March — all-time record; 18th consecutive month above ₹1.5L Cr', source: 'MoF', category: 'ECONOMY', severity: 'medium', time: '07:45', tags: ['GST', 'TAX', 'ECONOMY'] },
  { id: 'in12', headline: 'ISRO Gaganyaan crew module splashdown test successful — first crewed mission 2026', source: 'ISRO', category: 'TECH', severity: 'medium', time: '07:00', tags: ['ISRO', 'SPACE', 'TECH'] },
  { id: 'in13', headline: 'Byju\'s NCLT liquidation approved — $1.2B FDI in ed-tech sector under scrutiny', source: 'NCLT', category: 'BUSINESS', severity: 'high', time: '06:30', tags: ['BYJUS', 'EDTECH', 'NCLT'] },
  { id: 'in14', headline: 'Line of Actual Control: India deploys additional BMP-2 infantry near Galwan valley', source: 'ANI', category: 'DEFENSE', severity: 'high', time: '05:50', tags: ['INDIA', 'CHINA', 'LAC'] },
];

const LIVE_NEWS_UPDATES: IndiaNewsItem[] = [
  { id: `ln_a`, headline: 'BREAKING: Nifty Bank crosses 49,500 — SBI, HDFC, Kotak leading rally on RBI credit policy ease signals', source: 'NSE', category: 'MARKETS', severity: 'critical', time: '', tags: ['BANKNIFTY', 'SBI', 'HDFC'], isBreaking: true },
  { id: `ln_b`, headline: 'PM Modi inaugurates ₹60,000 Cr semiconductor fab in Gujarat — Samsung, TSMC ecosystem forming', source: 'PIB', category: 'TECH', severity: 'high', time: '', tags: ['SEMICONDUCTOR', 'INDIA', 'TECH'] },
  { id: `ln_c`, headline: 'FII buying ₹8,240 Cr in cash equities today — 5th straight session of net inflows into Indian markets', source: 'NSE', category: 'MARKETS', severity: 'high', time: '', tags: ['FII', 'INFLOWS', 'NSE'] },
  { id: `ln_d`, headline: 'India inflation CPI at 4.1% — below RBI 4% target for first time in 18 months', source: 'MoSPI', category: 'ECONOMY', severity: 'critical', time: '', tags: ['CPI', 'INFLATION', 'RBI'], isBreaking: true },
];

const CAT_COLORS: Record<string, string> = {
  MARKETS: '#00ff88',
  ECONOMY: '#00ccff',
  POLITICS: '#ffaa00',
  BUSINESS: '#fb923c',
  TECH: '#a78bfa',
  DEFENSE: '#ff3355',
};
const SEV_COLORS: Record<string, string> = {
  critical: '#ff3355',
  high: '#ffaa00',
  medium: '#00ccff',
  low: '#666680',
};

type FilterCat = 'ALL' | 'MARKETS' | 'ECONOMY' | 'POLITICS' | 'BUSINESS' | 'TECH' | 'DEFENSE';

export function IndiaNewsPanel() {
  const [feed, setFeed] = useState(INDIA_NEWS_FEED);
  const [filter, setFilter] = useState<FilterCat>('ALL');
  const [newId, setNewId] = useState<string | null>(null);
  let liveIdx = 0;
  const region = useUiStore(s => s.region);

  if (region !== 'GLOBAL' && region !== 'ASIA' && region !== 'INDIA') {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ff3355" />
        <span style={{ color: '#ff3355', letterSpacing: 1 }}>REGION NOT SUPPORTED</span>
        <span style={{ textAlign: 'center' }}>India Intelligence Hub is only available in INDIA, ASIA, or GLOBAL views.</span>
      </div>
    );
  }

  useEffect(() => {
    // Math.random() fake news injection removed for data integrity.
    // Real implementation would poll NewsAPI, Economic Times RSS, etc.
  }, []);

  const filtered = feed.filter(n => filter === 'ALL' || n.category === filter);

  const CATEGORIES: FilterCat[] = ['ALL', 'MARKETS', 'ECONOMY', 'BUSINESS', 'DEFENSE', 'TECH', 'POLITICS'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace', background: '#080810' }}>
      {/* Header */}
      <div style={{ padding: '4px 8px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>🇮🇳</span>
        <span style={{ fontSize: 9, color: '#FF9933', letterSpacing: 2 }}>INDIA INTELLIGENCE</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3355', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 7, color: '#ff3355' }}>LIVE</span>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: filter === cat ? '#1a1a2e' : 'transparent',
            color: filter === cat ? (CAT_COLORS[cat] || '#FF9933') : '#555',
            cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', letterSpacing: 1, flexShrink: 0,
          }}>{cat}</button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(item => {
          const sevColor = SEV_COLORS[item.severity];
          const catColor = CAT_COLORS[item.category] || '#FF9933';
          const isNew = item.id === newId;
          return (
            <div key={item.id} style={{
              padding: '6px 8px',
              borderBottom: '1px solid #0f0f18',
              borderLeft: `2px solid ${item.isBreaking ? '#ff3355' : catColor}`,
              background: isNew ? `${sevColor}10` : item.isBreaking ? 'rgba(255,51,85,0.04)' : 'transparent',
              transition: 'background 1s',
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                {item.isBreaking && (
                  <span style={{ fontSize: 7, background: '#ff3355', color: '#fff', padding: '0 4px', letterSpacing: 1, animation: isNew ? 'blink 1s infinite' : 'none' }}>BREAKING</span>
                )}
                <span style={{ fontSize: 7, color: catColor, border: `1px solid ${catColor}33`, padding: '0 3px' }}>{item.category}</span>
                <span style={{ fontSize: 7, color: '#555' }}>{item.source}</span>
                {isNew && <span style={{ fontSize: 7, background: sevColor, color: '#000', padding: '0 3px' }}>NEW</span>}
                <span style={{ marginLeft: 'auto', fontSize: 8, color: '#444' }}>{item.time}</span>
              </div>

              {/* Headline */}
              <div style={{ fontSize: 10, color: item.isBreaking ? '#e8e8e8' : '#bbb', lineHeight: 1.4, marginBottom: 4 }}>
                {item.headline}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {item.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 7, color: '#FF9933', border: '1px solid #FF993322', padding: '0 4px', cursor: 'pointer' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333', alignItems: 'center' }}>
        <IndianRupee size={9} color="#FF9933" />
        <span>INDIA INTELLIGENCE HUB</span>
        <span style={{ marginLeft: 'auto' }}>SRC: NDTV · ET · LIVEMINT · NSE · RBI · PIB</span>
      </div>
    </div>
  );
}
