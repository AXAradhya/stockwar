import { useState, useEffect } from 'react';
import { WORLD_CLOCK_DATA } from '../../services/apiServices';

function getMarketStatus(tz: string, openStr: string, closeStr: string) {
  try {
    const now = new Date();
    const locStr = now.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    const [h, m] = locStr.split(':').map(Number);
    const nowMin = h * 60 + m;
    const [oh, om] = openStr.split(':').map(Number);
    const [ch, cm] = closeStr.split(':').map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    // Weekend check
    const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'CLOSED';
    if (nowMin >= openMin && nowMin < closeMin) return 'OPEN';
    if (nowMin >= openMin - 30 && nowMin < openMin) return 'PRE';
    if (nowMin >= closeMin && nowMin < closeMin + 30) return 'POST';
    return 'CLOSED';
  } catch {
    return 'CLOSED';
  }
}

function getLocalTime(tz: string) {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

function getLocalDate(tz: string) {
  try {
    return new Date().toLocaleDateString('en-US', {
      timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch {
    return '';
  }
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  OPEN:   { color: '#00ff88', bg: 'rgba(0,255,136,0.10)', label: '● OPEN' },
  PRE:    { color: '#ffaa00', bg: 'rgba(255,170,0,0.10)', label: '◑ PRE' },
  POST:   { color: '#ffaa00', bg: 'rgba(255,170,0,0.08)', label: '◐ POST' },
  CLOSED: { color: '#333', bg: 'transparent', label: '○ CLOSED' },
};

export function WorldClockPanel() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const openCount = WORLD_CLOCK_DATA.filter(m => getMarketStatus(m.tz, m.open, m.close) === 'OPEN').length;


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header bar */}
      <div style={{
        padding: '4px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 8, color: '#444', letterSpacing: 1 }}>MARKETS OPEN</span>
        <span style={{ fontSize: 13, color: openCount > 0 ? '#00ff88' : '#ff3355' }}>{openCount}</span>
        <span style={{ fontSize: 8, color: '#444' }}>/ {WORLD_CLOCK_DATA.length}</span>
        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#444' }}>UTC {new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>

      {/* Market list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {WORLD_CLOCK_DATA.map(market => {
          const status = getMarketStatus(market.tz, market.open, market.close);
          const s = STATUS_STYLES[status] || STATUS_STYLES.CLOSED;
          const localTime = getLocalTime(market.tz);
          const localDate = getLocalDate(market.tz);

          return (
            <div
              key={market.name}
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid #0f0f18',
                background: s.bg,
                display: 'grid',
                gridTemplateColumns: '20px 1fr auto',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>{market.flag}</span>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#e8e8e8', letterSpacing: 0.5 }}>{market.name}</span>
                  <span style={{ fontSize: 7, color: '#444' }}>{market.exchange}</span>
                </div>
                <div style={{ fontSize: 8, color: '#444', marginTop: 1 }}>{localDate}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: market.color, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {localTime}
                </div>
                <div style={{
                  fontSize: 7, color: s.color, letterSpacing: 1, textAlign: 'right', marginTop: 1,
                }}>
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
      }}>
        <span style={{ color: '#00ff88' }}>● OPEN</span>
        <span style={{ color: '#ffaa00' }}>◑ PRE-MARKET</span>
        <span style={{ color: '#ffaa00' }}>◐ AFTER-HOURS</span>
        <span>○ CLOSED</span>
      </div>
    </div>
  );
}
