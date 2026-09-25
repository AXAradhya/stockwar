import { useEffect, useState } from 'react';
import { X, AlertTriangle, Radio } from 'lucide-react';
import { fetchLiveNews } from '../../services/apiServices';
import { useUiStore } from '../../stores/uiStore';

const INDIA_BREAKING_NEWS = [
  { id: 'ib1', title: 'SENSEX SURGES 1,240 PTS — NIFTY BANK BREAKS 49,500 ON RBI RATE HOLD; FII BUY ₹8,240 CR IN SINGLE SESSION', tickers: ['NIFTY50', 'SENSEX', 'BANKNIFTY'], time: '14:30', severity: 'critical', source: 'NSE' },
  { id: 'ib2', title: 'RBI GOVERNOR: "INFLATION TRAJECTORY STABLE AT 4.1% — RATE CUT WINDOW OPENS Q3 2025" | BOND YIELDS FALL 12 BPS', tickers: ['INR', 'USDINR', 'TLT'], time: '14:15', severity: 'critical', source: 'RBI' },
  { id: 'ib3', title: 'INDIA Q4 GDP 7.8% — BEATS 7.4% ESTIMATE | FASTEST GROWING MAJOR ECONOMY FOR 3RD CONSECUTIVE QUARTER', tickers: ['NIFTY50', 'GDP', 'INR'], time: '11:30', severity: 'high', source: 'MoSPI' },
  { id: 'ib4', title: 'RELIANCE JIO ACQUIRES DISNEY+ HOTSTAR INDIA OTT — DEAL VALUED AT $8.5 BILLION | MEDIA SECTOR RALLIES 4%', tickers: ['RELIANCE', 'MEDIA', 'NSE'], time: '09:20', severity: 'high', source: 'ET' },
  { id: 'ib5', title: 'SEBI APPROVES NEW F&O FRAMEWORK — LOT SIZES DOUBLED, MARGIN REQUIREMENTS HIKED 25% FROM NOV 2025', tickers: ['SEBI', 'NIFTY', 'BANKNIFTY'], time: '08:45', severity: 'high', source: 'SEBI' },
  { id: 'ib6', title: 'LAC UPDATE: INDIA DEPLOYS ADDITIONAL UNITS TO DEPSANG PLAINS FOLLOWING PLA ACTIVITY NEAR GALWAN SECTOR', tickers: ['HAL', 'BEL', 'DEFENSE'], time: '06:00', severity: 'critical', source: 'ANI' },
];

export function BreakingNewsBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const { monitorContext } = useUiStore();

  const isIndia = monitorContext === 'INDIA';

  useEffect(() => {
    let mounted = true;
    fetchLiveNews().then(d => {
      if (mounted) setLiveNews(d);
    }).catch(e => console.error(e));
    return () => { mounted = false; };
  }, []);

  const newsFeed = isIndia ? INDIA_BREAKING_NEWS : (liveNews.length ? liveNews : [{
    id: 'loading', title: 'Connecting to news streams...', tickers: [], time: '...', severity: 'low', source: 'SYSTEM'
  }]);

  useEffect(() => {
    setActiveIdx(0);
    setAnimKey(v => v + 1);
  }, [monitorContext, liveNews]);

  useEffect(() => {
    if (hovered) return; // pause auto-advance while user is reading
    const t = setInterval(() => {
      setActiveIdx(v => (v + 1) % Math.max(1, newsFeed.length));
      setAnimKey(v => v + 1);
    }, 8000);
    return () => clearInterval(t);
  }, [newsFeed.length, hovered]);

  if (dismissed || newsFeed.length === 0) return null;

  const news = newsFeed[activeIdx] || newsFeed[0];
  const isCritical = news?.severity === 'critical';
  const isHigh = news?.severity === 'high';
  const barColor = isCritical ? '#ff3355' : isHigh ? '#ffaa00' : '#00ccff';
  const bgColor = isCritical ? 'rgba(255,51,85,0.12)' : isHigh ? 'rgba(255,170,0,0.08)' : 'rgba(0,204,255,0.06)';

  return (
    <div
      className="breaking-news-banner"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
      height: 26,
      background: bgColor,
      borderBottom: `1px solid ${barColor}44`,
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10,
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Alert badge */}
      <div style={{
        padding: '0 10px',
        background: isIndia ? '#FF9933' : barColor,
        color: '#000',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: 1,
        flexShrink: 0,
      }}>
        {isCritical ? (
          <>
            <AlertTriangle size={9} />
            {isIndia ? '🇮🇳 BREAKING' : 'BREAKING'}
          </>
        ) : isHigh ? (
          <>
            <Radio size={9} />
            {isIndia ? '🇮🇳 ALERT' : 'ALERT'}
          </>
        ) : (
          <>
            <Radio size={9} />
            {isIndia ? '🇮🇳 UPDATE' : 'UPDATE'}
          </>
        )}
      </div>

      {/* Source */}
      <div style={{
        padding: '0 8px',
        color: '#666680',
        flexShrink: 0,
        borderRight: '1px solid #1a1a2e',
        fontSize: 9,
        letterSpacing: 0.5,
      }}>
        {news.source.toUpperCase()}
      </div>

      {/* Time */}
      <div style={{
        padding: '0 8px',
        color: '#444',
        fontSize: 9,
        flexShrink: 0,
        borderRight: '1px solid #1a1a2e',
      }}>
        {news.time} EST
      </div>

      {/* Scrolling text area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
      }}>
        {/* Static text with slide-in animation via key */}
        <div
          key={animKey}
          className="ticker-text"
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            whiteSpace: 'nowrap',
            animation: 'ticker-slide 8s linear forwards',
            animationPlayState: hovered ? 'paused' : 'running',
            color: isCritical ? '#ff3355' : isHigh ? '#ffaa00' : '#e8e8e8',
            fontSize: 10,
            paddingLeft: '100%',
          }}
        >
          {news.title}
        </div>
      </div>

      {/* Tickers */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '0 8px',
        flexShrink: 0,
        borderLeft: '1px solid #1a1a2e',
      }}>
        {news.tickers.slice(0, 4).map(t => (
          <span key={t} style={{
            fontSize: 8,
            color: '#00ccff',
            border: '1px solid #00ccff33',
            padding: '0 4px',
          }}>{t}</span>
        ))}
      </div>

      {/* Index indicator */}
      <div style={{
        display: 'flex',
        gap: 3,
        padding: '0 8px',
        flexShrink: 0,
        borderLeft: '1px solid #1a1a2e',
      }}>
        {newsFeed.map((_, i) => (
          <div
            key={i}
            onClick={() => { setActiveIdx(i); setAnimKey(v => v + 1); }}
            style={{
              width: 4,
              height: 4,
              background: i === activeIdx ? (isIndia ? '#FF9933' : barColor) : '#1a1a2e',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          height: '100%',
          padding: '0 8px',
          background: 'transparent',
          border: 'none',
          borderLeft: '1px solid #1a1a2e',
          cursor: 'pointer',
          color: '#444',
        }}
      >
        <X size={9} />
      </button>

      <style>{`
        @keyframes ticker-slide {
          0% { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-200%); }
        }
        /* CSS fallback: pause animation on hover if JS unavailable */
        .breaking-news-banner:hover .ticker-text { animation-play-state: paused !important; }
      `}</style>
    </div>
  );
}