import { useState, useEffect } from 'react';
import { fetchLiveNews } from '../../services/apiServices';
import { Radio, AlertTriangle, Rss, Clock } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff3355',
  high: '#ffaa00',
  medium: '#00ccff',
  low: '#666680',
};

const SEVERITY_ICONS: Record<string, JSX.Element> = {
  critical: <AlertTriangle size={9} />,
  high: <Radio size={9} />,
  medium: <Rss size={9} />,
  low: <Clock size={9} />,
};

const CATEGORY_MAP: Record<string, string> = {
  Reuters: 'MACRO', Bloomberg: 'MARKETS', AP: 'WORLD', BLS: 'ECON',
  NHTSA: 'AUTO', IDF: 'INTEL', ECB: 'MACRO', SEC: 'CORP',
};

type FilterType = 'ALL' | 'CRITICAL' | 'MARKETS' | 'INTEL' | 'MACRO';

// Region keyword mapping for news filtering
const REGION_KEYWORDS: Record<string, string[]> = {
  AMERICAS: ['US', 'USA', 'America', 'Fed', 'Biden', 'Treasury', 'NYSE', 'Wall Street', 'Dollar', 'Canada', 'Mexico', 'Brazil'],
  EUROPE: ['Europe', 'ECB', 'EU', 'UK', 'Britain', 'Germany', 'France', 'NATO', 'Euro', 'Pound', 'Brexit'],
  ASIA: ['China', 'Japan', 'Korea', 'BOJ', 'PBOC', 'Taiwan', 'Asia', 'Hong Kong', 'Singapore'],
  AFRICA: ['Africa', 'Nigeria', 'Ethiopia', 'Sudan', 'Kenya', 'South Africa'],
  'MIDDLE EAST': ['Iran', 'Saudi', 'Israel', 'Houthi', 'Gaza', 'Yemen', 'OPEC', 'Red Sea', 'Suez'],
  INDIA: ['India', 'RBI', 'Nifty', 'Sensex', 'Rupee', 'INR', 'Modi', 'BSE', 'NSE'],
  OCEANIA: ['Australia', 'RBA', 'New Zealand'],
  GLOBAL: [],
};

function newsMatchesRegion(title: string, region: string): boolean {
  if (region === 'GLOBAL') return true;
  const keywords = REGION_KEYWORDS[region] || [];
  return keywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()));
}

export function NewsPanel() {
  const [feed, setFeed] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { region } = useUiStore();

  useEffect(() => {
    let mounted = true;
    const loadNews = async () => {
      try {
        const data = await fetchLiveNews();
        if (mounted) {
          // keep some old ones to show stream
          setFeed(prev => {
            const newIds = data.map((d: any) => d.id);
            const filteredPrev = prev.filter(p => !newIds.includes(p.id));
            if (prev.length > 0 && data.length > 0 && data[0].id !== prev[0].id) {
              setNewItemId(data[0].id);
              setTimeout(() => { if (mounted) setNewItemId(null); }, 3000);
            }
            return [...data, ...filteredPrev];
          });
          setLoading(false);
          setError(null);
        }
      } catch (e: any) {
        console.error('News fetch failed', e);
        if (mounted) {
          setError(e.message || 'Failed to load news feed');
          setLoading(false);
        }
      }
    };
    loadNews();
    const t = setInterval(loadNews, 60000 * 5); // 5 min refresh
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const filtered = feed.filter(n => {
    // Region filter
    if (region !== 'GLOBAL' && !newsMatchesRegion(n.title, region)) return false;
    // Category filter
    if (filter === 'ALL') return true;
    if (filter === 'CRITICAL') return n.severity === 'critical';
    const cat = CATEGORY_MAP[n.source] || 'OTHER';
    return cat === filter;
  });

  const criticalCount = feed.filter(n => n.severity === 'critical').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['ALL', 'CRITICAL', 'MARKETS', 'INTEL', 'MACRO'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: '4px 10px', border: 'none', borderRight: '1px solid #1a1a2e', background: filter === f ? '#1a1a2e' : 'transparent', color: filter === f ? (f === 'CRITICAL' ? '#ff3355' : '#00ccff') : '#555', cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', letterSpacing: 1, whiteSpace: 'nowrap', flexShrink: 0, position: 'relative' }}
          >
            {f}
            {f === 'CRITICAL' && criticalCount > 0 && (
              <span style={{ marginLeft: 4, fontSize: 7, background: '#ff3355', color: '#000', padding: '0 3px' }}>{criticalCount}</span>
            )}
          </button>
        ))}
        {region !== 'GLOBAL' && (
          <div style={{ marginLeft: 'auto', padding: '3px 8px', fontSize: 7, color: '#00ccff', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            🌐 {region} ({filtered.length})
          </div>
        )}
      </div>

      {/* News feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && feed.length === 0 && (
          <div style={{ padding: 16, color: '#444', fontSize: 9 }}>LOADING NEWS STREAM...</div>
        )}
        {error && feed.length === 0 && (
          <div style={{ padding: 16, color: '#ff3355', fontSize: 9 }}>ERROR: {error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#333', fontSize: 9 }}>No {region === 'GLOBAL' ? '' : region} news matching filters</div>
        )}
        {filtered.map(n => {
          const sevColor = SEVERITY_COLORS[n.severity];
          const isNew = n.id === newItemId;
          const category = CATEGORY_MAP[n.source] || 'NEWS';
          return (
            <div key={n.id} style={{ padding: '6px 8px', borderBottom: '1px solid #0f0f18', borderLeft: `2px solid ${sevColor}`, cursor: 'pointer', background: isNew ? `${sevColor}10` : 'transparent', transition: 'background 1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ color: sevColor, display: 'flex', alignItems: 'center' }}>{SEVERITY_ICONS[n.severity]}</span>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: sevColor, textTransform: 'uppercase', border: `1px solid ${sevColor}33`, padding: '0 3px' }}>{n.severity}</span>
                <span style={{ fontSize: 7, color: '#444', border: '1px solid #1a1a2e', padding: '0 3px' }}>{category}</span>
                <span style={{ fontSize: 7, color: '#555' }}>{n.source}</span>
                {isNew && <span style={{ fontSize: 7, background: sevColor, color: '#000', padding: '0 4px', letterSpacing: 1, animation: 'blink 1s infinite' }}>NEW</span>}
                <span style={{ marginLeft: 'auto', fontSize: 8, color: '#333' }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 10, color: n.severity === 'critical' ? '#e8e8e8' : '#bbb', lineHeight: 1.4, marginBottom: 4 }}>{n.title}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {n.tickers.map(t => (
                  <span key={t} style={{ fontSize: 8, color: '#00ccff', border: '1px solid #00ccff22', padding: '0 4px', cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333', alignItems: 'center' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3355', boxShadow: '0 0 4px #ff3355', animation: 'pulse-dot 2s infinite' }} />
        <span>LIVE FEED</span>
        {region !== 'GLOBAL' && <span style={{ color: '#00ccff44' }}>FILTERED: {region}</span>}
        <span style={{ marginLeft: 'auto' }}>SRC: REUTERS/BLOOMBERG/AP</span>
      </div>
    </div>
  );
}