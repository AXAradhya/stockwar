import { useState, useEffect } from 'react';
import { Tv, ExternalLink, ChevronDown } from 'lucide-react';
import { usePanelCustomizeStore } from '../../stores/panelCustomizeStore';

interface NewsChannel {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: 'GLOBAL' | 'INDIA' | 'FINANCE' | 'MILITARY';
  embedUrl: string;
  color: string;
}

const CHANNELS: NewsChannel[] = [
  // Global News
  {
    id: 'aljazeera',
    name: 'Al Jazeera Live',
    country: 'Qatar',
    flag: '🇶🇦',
    category: 'GLOBAL',
    embedUrl: 'https://www.youtube.com/embed/F6RU5EpnwGs?autoplay=1&mute=1',
    color: '#00ccff',
  },
  {
    id: 'dw',
    name: 'DW News Live',
    country: 'Germany',
    flag: '🇩🇪',
    category: 'GLOBAL',
    embedUrl: 'https://www.youtube.com/embed/lSiyfHDDqaM?autoplay=1&mute=1',
    color: '#00ccff',
  },
  {
    id: 'reuters',
    name: 'Reuters Live',
    country: 'Global',
    flag: '🌐',
    category: 'GLOBAL',
    embedUrl: 'https://www.youtube.com/embed/mHKFBNoWHx0?autoplay=1&mute=1',
    color: '#ff7700',
  },
  // India News
  {
    id: 'ndtv',
    name: 'NDTV 24×7 Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'INDIA',
    embedUrl: 'https://www.youtube.com/embed/4L8VUkHLHSQ?autoplay=1&mute=1',
    color: '#FF9933',
  },
  {
    id: 'timesnow',
    name: 'Times Now Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'INDIA',
    embedUrl: 'https://www.youtube.com/embed/qpuIqkqQJow?autoplay=1&mute=1',
    color: '#FF9933',
  },
  {
    id: 'republic',
    name: 'Republic TV Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'INDIA',
    embedUrl: 'https://www.youtube.com/embed/HMOZQmApKXo?autoplay=1&mute=1',
    color: '#FF9933',
  },
  {
    id: 'aajtak',
    name: 'Aaj Tak Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'INDIA',
    embedUrl: 'https://www.youtube.com/embed/BSSbSLF5bP0?autoplay=1&mute=1',
    color: '#FF9933',
  },
  // Finance
  {
    id: 'bloomberglive',
    name: 'Bloomberg Live',
    country: 'USA',
    flag: '🇺🇸',
    category: 'FINANCE',
    embedUrl: 'https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1',
    color: '#a78bfa',
  },
  {
    id: 'cnbc',
    name: 'CNBC TV18 Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'FINANCE',
    embedUrl: 'https://www.youtube.com/embed/CoUpXV3Vv28?autoplay=1&mute=1',
    color: '#a78bfa',
  },
  {
    id: 'etnow',
    name: 'ET Now Live',
    country: 'India',
    flag: '🇮🇳',
    category: 'FINANCE',
    embedUrl: 'https://www.youtube.com/embed/zU5-5MX7zcY?autoplay=1&mute=1',
    color: '#a78bfa',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  GLOBAL: '#00ccff',
  INDIA: '#FF9933',
  FINANCE: '#a78bfa',
  MILITARY: '#ff3355',
};

type CategoryFilter = 'ALL' | 'GLOBAL' | 'INDIA' | 'FINANCE';

export function LiveNewsYouTubePanel() {
  const { getCustomization } = usePanelCustomizeStore();
  const customChannels = getCustomization('live_news_youtube').youtubeChannels || [];
  
  const mergedChannels: NewsChannel[] = [
    ...customChannels.map(c => ({
      id: c.id,
      name: c.name,
      country: 'Custom',
      flag: '📺',
      category: c.category as any,
      embedUrl: `https://www.youtube.com/embed/${c.id}?autoplay=1&mute=1`,
      color: CATEGORY_COLORS[c.category] || '#ffffff'
    })),
    ...CHANNELS,
  ];

  const [active, setActive] = useState(mergedChannels[0]);
  const [catFilter, setCatFilter] = useState<CategoryFilter>('ALL');
  const [muted, setMuted] = useState(true);
  const [showList, setShowList] = useState(false);

  // Re-select if custom channels change and active is no longer valid
  useEffect(() => {
    if (!mergedChannels.find(c => c.id === active.id)) {
      setActive(mergedChannels[0]);
    }
  }, [customChannels]);

  const filtered = mergedChannels.filter(c => catFilter === 'ALL' || c.category === catFilter);

  const embedUrl = active.embedUrl.replace(
    muted ? '' : '&mute=1',
    muted ? '&mute=1' : '&mute=0'
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace', background: '#080810' }}>
      {/* Channel Header */}
      <div style={{ padding: '4px 8px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tv size={10} color={active.color} />
        <span style={{ fontSize: 9, color: active.color, letterSpacing: 1 }}>
          {active.flag} {active.name}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3355', boxShadow: '0 0 4px #ff3355', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 7, color: '#ff3355' }}>LIVE</span>
        </div>
        <button
          onClick={() => setMuted(v => !v)}
          style={{ background: muted ? '#1a1a2e' : 'rgba(0,255,136,0.1)', border: `1px solid ${muted ? '#333' : '#00ff8833'}`, color: muted ? '#555' : '#00ff88', padding: '1px 6px', fontFamily: 'JetBrains Mono', fontSize: 7, cursor: 'pointer' }}
        >{muted ? '🔇 MUTED' : '🔊 AUDIO'}</button>
        <button
          onClick={() => setShowList(v => !v)}
          style={{ background: showList ? '#1a1a2e' : 'transparent', border: '1px solid #1a1a2e', color: '#888', padding: '1px 6px', fontFamily: 'JetBrains Mono', fontSize: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          CHANNELS <ChevronDown size={8} style={{ transform: showList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Channel Selector */}
      {showList && (
        <div style={{ background: '#0a0a12', borderBottom: '1px solid #1a1a2e' }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #0f0f18' }}>
            {(['ALL', 'GLOBAL', 'INDIA', 'FINANCE'] as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{
                  padding: '3px 10px', border: 'none', borderRight: '1px solid #1a1a2e',
                  background: catFilter === cat ? '#1a1a2e' : 'transparent',
                  color: catFilter === cat ? (CATEGORY_COLORS[cat] || '#00ccff') : '#555',
                  cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', letterSpacing: 1,
                }}
              >{cat}</button>
            ))}
          </div>
          {/* Channel list */}
          <div style={{ maxHeight: 140, overflowY: 'auto' }}>
            {filtered.map(ch => (
              <div
                key={ch.id}
                onClick={() => { setActive(ch); setShowList(false); }}
                style={{
                  padding: '5px 10px',
                  borderBottom: '1px solid #0a0a12',
                  cursor: 'pointer',
                  background: active.id === ch.id ? `${ch.color}10` : 'transparent',
                  borderLeft: `2px solid ${active.id === ch.id ? ch.color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{ch.flag}</span>
                <div>
                  <div style={{ fontSize: 9, color: active.id === ch.id ? ch.color : '#bbb' }}>{ch.name}</div>
                  <div style={{ fontSize: 7, color: '#444' }}>{ch.country} · {ch.category}</div>
                </div>
                {active.id === ch.id && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: ch.color }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Embed */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        <iframe
          key={active.id}
          src={active.embedUrl}
          title={active.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: 8, alignItems: 'center', fontSize: 7, color: '#333' }}>
        <span style={{ color: CATEGORY_COLORS[active.category] }}>{active.category}</span>
        <span>·</span>
        <span>{active.name}</span>
        <a
          href={`https://youtube.com/watch?v=${active.embedUrl.split('/embed/')[1]?.split('?')[0]}`}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: 'auto', color: '#444', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
        >
          <ExternalLink size={9} /> YT
        </a>
        <span style={{ color: '#ff3355' }}>● LIVE</span>
      </div>
    </div>
  );
}
