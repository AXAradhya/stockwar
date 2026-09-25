import { useState } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

interface Topic {
  topic: string;
  sentiment: string;
  velocity: number;
  change: number;
  platforms: string[];
  relatedTickers: string[];
}

// Social velocity topics — populated from real social API feeds
// Currently empty until social API integration is complete
const SEED_TOPICS: Topic[] = [];

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: '#00ff88',
  bearish: '#ff3355',
  neutral: '#ffaa00',
};

const PLATFORM_COLORS: Record<string, string> = {
  X: '#e8e8e8',
  Reddit: '#ff6633',
  Telegram: '#00ccff',
  StockTwits: '#00ff88',
};

export function SocialVelocityPanel() {
  const [topics] = useState<Topic[]>(SEED_TOPICS);
  const [sortBy, setSortBy] = useState<'velocity' | 'change'>('velocity');
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');


  const filtered = topics.filter(t => filter === 'all' || t.sentiment === filter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'velocity' ? b.velocity - a.velocity : b.change - a.change
  );
  const maxVelocity = Math.max(...sorted.map(t => t.velocity));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Controls */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #1a1a2e',
        alignItems: 'center', gap: 0,
      }}>
        <div style={{ padding: '3px 8px', borderRight: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={9} color="#a78bfa" />
          <span style={{ fontSize: 8, color: '#a78bfa', letterSpacing: 1 }}>VELOCITY</span>
        </div>
        {(['all', 'bullish', 'bearish'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '3px 8px', border: 'none',
            borderRight: '1px solid #1a1a2e',
            background: filter === f ? '#1a1a2e' : 'transparent',
            color: filter === f
              ? (f === 'bullish' ? '#00ff88' : f === 'bearish' ? '#ff3355' : '#e8e8e8')
              : '#444',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>{f}</button>
        ))}
        <button onClick={() => setSortBy(v => v === 'velocity' ? 'change' : 'velocity')} style={{
          marginLeft: 'auto', padding: '3px 8px',
          background: 'transparent', border: 'none', borderLeft: '1px solid #1a1a2e',
          color: '#444', cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
        }}>
          SORT: {sortBy === 'velocity' ? 'VEL↓' : 'CHG↓'}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map((tp, i) => {
          const sentColor = SENTIMENT_COLORS[tp.sentiment];
          const barWidth = (tp.velocity / maxVelocity) * 100;
          const isHot = tp.velocity > 75;
          return (
            <div
              key={tp.topic}
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid #0f0f18',
                cursor: 'pointer',
              }}
            >
              {/* Topic row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 7, color: '#333', minWidth: 14, textAlign: 'right' }}>{i + 1}</span>
                <span style={{
                  fontSize: 10, color: isHot ? sentColor : '#e8e8e8',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {tp.topic}
                </span>
                {isHot && <Zap size={8} color={sentColor} />}
                <div style={{
                  fontSize: 7, padding: '0 4px',
                  color: sentColor, border: `1px solid ${sentColor}33`,
                }}>
                  {tp.sentiment.toUpperCase()}
                </div>
              </div>

              {/* Velocity bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, background: '#1a1a2e', position: 'relative' }}>
                  <div style={{
                    width: `${barWidth}%`, height: '100%',
                    background: sentColor,
                    transition: 'width 0.8s ease',
                    boxShadow: isHot ? `0 0 4px ${sentColor}` : 'none',
                  }} />
                </div>
                <span style={{ fontSize: 9, color: sentColor, minWidth: 28, textAlign: 'right' }}>
                  {Math.round(tp.velocity)}
                </span>
                <span style={{
                  fontSize: 8,
                  color: tp.change >= 0 ? '#00ff88' : '#ff3355',
                  display: 'flex', alignItems: 'center', gap: 1, minWidth: 36,
                }}>
                  {tp.change >= 0
                    ? <TrendingUp size={8} />
                    : <TrendingDown size={8} />}
                  {tp.change >= 0 ? '+' : ''}{fmtNum(tp.change, 0)}
                </span>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 4, marginTop: 3, alignItems: 'center' }}>
                {tp.platforms.map(p => (
                  <span key={p} style={{
                    fontSize: 7, color: PLATFORM_COLORS[p] || '#555',
                    border: `1px solid ${PLATFORM_COLORS[p] || '#555'}33`,
                    padding: '0 3px',
                  }}>{p}</span>
                ))}
                <span style={{ marginLeft: 4, fontSize: 7, color: '#333' }}>→</span>
                {tp.relatedTickers.slice(0, 3).map(t => (
                  <span key={t} style={{
                    fontSize: 7, color: '#00ccff',
                    border: '1px solid #00ccff33', padding: '0 3px',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
      }}>
        <span>SRC: X/REDDIT/TELEGRAM (NOT CONFIGURED)</span>
        <span style={{ marginLeft: 'auto', color: '#ffaa00' }}>● OFFLINE</span>
      </div>
    </div>
  );
}
