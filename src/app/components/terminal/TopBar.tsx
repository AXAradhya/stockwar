import { useEffect, useState, useRef } from 'react';
import { Settings, Zap, Globe, ChevronDown, LogOut, User, Search, Users } from 'lucide-react';
import { MONITOR_CONTEXTS, REGIONS, type MonitorContext, type Region } from '../../data/catalog';
import { useAuthStore } from '../../stores/authStore';
import { fetchFinnhubSymbolLookup } from '../../services/apiServices';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTickerConfigStore } from '../../stores/tickerConfigStore';
import { toast } from 'sonner';

interface TopBarProps {
  monitorContext: MonitorContext;
  setMonitorContext: (ctx: MonitorContext) => void;
  region: Region;
  setRegion: (r: Region) => void;
  onOpenAI: () => void;
  onOpenSettings: () => void;
  sidebarCollapsed: boolean;
  onOpenTeamModal?: () => void;
}

const MARKET_STATUS = [
  { name: 'NYSE', tz: 'America/New_York', openHour: 9.5, closeHour: 16 },
  { name: 'LSE', tz: 'Europe/London', openHour: 8, closeHour: 16.5 },
  { name: 'TSE', tz: 'Asia/Tokyo', openHour: 9, closeHour: 15.5 },
  { name: 'SSE', tz: 'Asia/Shanghai', openHour: 9.5, closeHour: 15 },
];

function isMarketOpen(market: typeof MARKET_STATUS[0], now: Date): boolean {
  const local = new Intl.DateTimeFormat('en-US', {
    timeZone: market.tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);
  const weekday = local.find(p => p.type === 'weekday')?.value;
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const h = parseInt(local.find(p => p.type === 'hour')?.value || '0');
  const m = parseInt(local.find(p => p.type === 'minute')?.value || '0');
  const time = h + m / 60;
  return time >= market.openHour && time < market.closeHour;
}

const TIMEZONE_CLOCKS = [
  { label: 'NY', tz: 'America/New_York' },
  { label: 'LON', tz: 'Europe/London' },
  { label: 'TKY', tz: 'Asia/Tokyo' },
  { label: 'IST', tz: 'Asia/Kolkata' },
];

const CONTEXT_COLORS: Record<string, string> = {
  FINANCE: '#00ff88',
  TECH: '#00ccff',
  WORLD: '#ff3355',
  COMMODITIES: '#ffaa00',
  INDIA: '#FF9933',
};

export function TopBar({ monitorContext, setMonitorContext, region, setRegion, onOpenAI, onOpenSettings, onOpenTeamModal }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const [regionOpen, setRegionOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const openWorkspace = useWorkspaceStore(s => s.openWorkspace);
  const addToWatchlist = useTickerConfigStore(s => s.addToWatchlist);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetchFinnhubSymbolLookup(searchQuery);
        setSearchResults((res?.result || []).slice(0, 8));
        setShowSearchDropdown(true);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTZ = (tz: string) =>
    time.toLocaleTimeString('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        height: 32,
        background: '#0a0a12',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: '#e8e8e8',
        userSelect: 'none',
        position: 'relative',
        zIndex: 100,
        flexShrink: 0,
        overflow: 'visible',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 12px', height: '100%',
        borderRight: '1px solid #1a1a2e',
        color: '#00ff88',
        letterSpacing: 2,
        fontSize: 12,
        flexShrink: 0,
      }}>
        <span style={{ color: '#00ccff' }}>▶</span>
        <span style={{ fontWeight: 700 }}>STOCKWAR</span>
        <span style={{
          fontSize: 7, color: '#333', letterSpacing: 1,
          border: '1px solid #1a1a2e', padding: '1px 4px',
          marginLeft: 4,
        }}>
          TERMINAL
        </span>
      </div>

      {/* Monitor Context Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', borderRight: '1px solid #1a1a2e', flexShrink: 0 }}>
        {MONITOR_CONTEXTS.map(ctx => {
          const isActive = monitorContext === ctx;
          const ctxColor = CONTEXT_COLORS[ctx] || '#666680';
          return (
            <button
              key={ctx}
              onClick={() => setMonitorContext(ctx)}
              style={{
                height: '100%',
                padding: '0 10px',
                background: isActive ? `${ctxColor}11` : 'transparent',
                color: isActive ? ctxColor : '#555',
                border: 'none',
                borderRight: '1px solid #1a1a2e',
                borderBottom: isActive ? `2px solid ${ctxColor}` : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                letterSpacing: 1,
                transition: 'all 0.15s',
                marginBottom: isActive ? 0 : 0,
              }}
            >
              {ctx}
            </button>
          );
        })}
      </div>

      {/* Region Selector */}
      <div style={{ position: 'relative', borderRight: '1px solid #1a1a2e', height: '100%', flexShrink: 0 }}>
        <button
          onClick={() => setRegionOpen(v => !v)}
          style={{ height: '100%', padding: '0 10px', background: regionOpen ? '#1a1a2e' : region !== 'GLOBAL' ? 'rgba(0,204,255,0.06)' : 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Globe size={10} color={region !== 'GLOBAL' ? '#00ccff' : '#666680'} />
          <span style={{ color: region !== 'GLOBAL' ? '#00ccff' : '#aaa', fontWeight: region !== 'GLOBAL' ? 700 : 400 }}>{region}</span>
          {region !== 'GLOBAL' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ccff', boxShadow: '0 0 4px #00ccff', display: 'inline-block' }} />}
          <ChevronDown size={9} color="#666680" />
        </button>
        {regionOpen && (
          <div style={{ position: 'absolute', top: 32, left: 0, zIndex: 500, background: '#0d0d18', border: '1px solid #1a1a2e', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
            <div style={{ padding: '4px 10px', fontSize: 7, color: '#444', letterSpacing: 1, borderBottom: '1px solid #1a1a2e' }}>SELECT REGION FILTER</div>
            {REGIONS.map(r => {
              const REGION_FLAGS: Record<string, string> = {
                GLOBAL: '🌐', AMERICAS: '🌎', EUROPE: '🇪🇺', ASIA: '🌏',
                AFRICA: '🌍', OCEANIA: '🦘', 'MIDDLE EAST': '🏜️', INDIA: '🇮🇳',
              };
              return (
                <button
                  key={r}
                  onClick={() => { setRegion(r); setRegionOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '6px 12px', background: r === region ? '#1a1a2e' : 'transparent', color: r === region ? '#00ccff' : '#e8e8e8', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 1, borderBottom: '1px solid #0f0f18' }}
                >
                  <span>{REGION_FLAGS[r]}</span>
                  <span>{r}</span>
                  {r === region && <span style={{ marginLeft: 'auto', color: '#00ccff' }}>▶</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Stock Search */}
      <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '100%', borderRight: '1px solid #1a1a2e', padding: '0 8px', flex: 1, minWidth: 200, maxWidth: 400 }}>
        <Search size={10} color="#666680" style={{ marginRight: 6 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
          onFocus={() => { if (searchQuery) setShowSearchDropdown(true); }}
          placeholder="Search ticker or company..."
          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 10, width: '100%' }}
        />
        {isSearching && <span style={{ fontSize: 9, color: '#00ccff', marginLeft: 6 }}>...</span>}

        {showSearchDropdown && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: 32, left: 0, right: 0, zIndex: 500, background: '#0d0d18', border: '1px solid #1a1a2e', boxShadow: '0 8px 24px rgba(0,0,0,0.8)', maxHeight: 300, overflowY: 'auto' }}>
            <div style={{ padding: '4px 10px', fontSize: 7, color: '#444', letterSpacing: 1, borderBottom: '1px solid #1a1a2e' }}>SEARCH RESULTS</div>
            {searchResults.map(res => (
              <div key={res.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #0f0f18', cursor: 'pointer' }}
                onClick={() => {
                  openWorkspace('stock', res.symbol, res.description);
                  setShowSearchDropdown(false);
                  setSearchQuery('');
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: '#00ccff', fontSize: 10, fontWeight: 'bold' }}>{res.symbol}</span>
                  <span style={{ color: '#888', fontSize: 8 }}>{res.description}</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    addToWatchlist(res.symbol);
                    toast.success(`Added ${res.symbol} to watchlist`);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                  style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', color: '#00ff88', fontSize: 8, padding: '2px 6px', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}
                >
                  + WATCH
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Market Status Pills */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px', borderLeft: '1px solid #1a1a2e',
        flexShrink: 0,
      }}>
        {MARKET_STATUS.map(m => {
          const open = isMarketOpen(m, time);
          return (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: open ? '#00ff88' : '#333',
                boxShadow: open ? '0 0 4px #00ff88' : 'none',
              }} />
              <span style={{ fontSize: 8, color: open ? '#888' : '#3a3a4a', letterSpacing: 0.5 }}>
                {m.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Multi-TZ Clocks */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderLeft: '1px solid #1a1a2e',
        height: '100%',
        flexShrink: 0,
      }}>
        {TIMEZONE_CLOCKS.map((tz, i) => (
          <div
            key={tz.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '0 8px', height: '100%',
              borderRight: i < TIMEZONE_CLOCKS.length - 1 ? '1px solid #1a1a2e' : 'none',
            }}
          >
            <span style={{ fontSize: 8, color: '#333', letterSpacing: 0.5 }}>{tz.label}</span>
            <span style={{ fontSize: 10, color: i === 0 ? '#00ccff' : '#666680', letterSpacing: 0.5 }}>
              {formatTZ(tz.tz)}
            </span>
          </div>
        ))}
      </div>

      {/* AI Button */}
      <button
        onClick={onOpenAI}
        style={{
          height: '100%', padding: '0 12px',
          background: 'transparent', color: '#00ccff',
          border: 'none', borderLeft: '1px solid #1a1a2e',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, display: 'flex', alignItems: 'center', gap: 5,
          letterSpacing: 1,
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,204,255,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Zap size={10} />
        AI
        <span style={{ fontSize: 7, color: '#00ccff55', border: '1px solid #00ccff22', padding: '0 3px' }}>
          CTRL+SHIFT+A
        </span>
      </button>

      {/* User Info */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderLeft: '1px solid #1a1a2e', flexShrink: 0, height: '100%' }}>
          <User size={9} color="#666680" />
          <span style={{ fontSize: 8, color: '#555', letterSpacing: 1 }}>{user.callsign}</span>
          <span style={{ fontSize: 7, color: '#333', border: '1px solid #1a1a2e', padding: '0 3px' }}>{user.role}</span>
        </div>
      )}

      {/* Team Cloud9 Button */}
      {onOpenTeamModal && (
        <button
          onClick={onOpenTeamModal}
          title="Team Cloud9 Details"
          style={{
            height: '100%', padding: '0 10px',
            background: 'transparent', color: '#00ccff',
            border: 'none', borderLeft: '1px solid #1a1a2e',
            cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9, display: 'flex', alignItems: 'center', gap: 4,
            letterSpacing: 0.5, flexShrink: 0,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,204,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Users size={11} />
          <span style={{ fontWeight: 700 }}>CLOUD9</span>
        </button>
      )}

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        style={{
          height: '100%', padding: '0 10px',
          background: 'transparent', color: '#555',
          border: 'none', borderLeft: '1px solid #1a1a2e',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
        onMouseLeave={e => (e.currentTarget.style.color = '#555')}
      >
        <Settings size={12} />
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        title="Logout"
        style={{
          height: '100%', padding: '0 10px',
          background: 'transparent', color: '#555',
          border: 'none', borderLeft: '1px solid #1a1a2e',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 0.15s',
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ff3355')}
        onMouseLeave={e => (e.currentTarget.style.color = '#555')}
      >
        <LogOut size={11} />
      </button>
    </div>
  );
}