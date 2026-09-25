import { useState, useEffect, useCallback } from 'react';
import { fetchEconomicCalendar } from '../../services/apiServices';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: '#ff3355', HIGH: '#ff3355', MEDIUM: '#ffaa00', LOW: '#666680',
};
const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', UK: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', CN: '🇨🇳', IN: '🇮🇳', DE: '🇩🇪', FR: '🇫🇷',
};

function parseTimeToMinutes(t: string) {
  const p = t.split(' ')[0].split(':');
  return p.length < 2 ? 9999 : parseInt(p[0]) * 60 + parseInt(p[1]);
}

function getCountdown(timeStr: string) {
  if (timeStr === 'ALL DAY' || timeStr === '-') return '';
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const diff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).getTime() - now.getTime();
  if (diff < 0) return 'RELEASED';
  const mins = Math.floor(diff / 60000);
  return mins < 60 ? `T-${mins}m` : `T-${Math.floor(mins / 60)}h${mins % 60}m`;
}

export function EconomicCalendarPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const { region } = useUiStore();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await fetchEconomicCalendar(region);
        if (mounted) { setEvents(d); setLoading(false); setError(null); }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 900000); // 15min refresh
    return () => { mounted = false; clearInterval(t); };
  }, [region]);

  const updateCountdowns = useCallback(() => {
    const next: Record<string, string> = {};
    events.forEach(e => { next[e.time] = getCountdown(e.time); });
    setCountdowns(next);
  }, [events]);

  useEffect(() => {
    updateCountdowns();
    const t = setInterval(updateCountdowns, 30000);
    return () => clearInterval(t);
  }, [updateCountdowns]);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING ECONOMIC CALENDAR (FINNHUB)...</div>;
  if (error) return (
    <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}>
      <div>⚠ ECONOMIC CALENDAR UNAVAILABLE</div>
      <div style={{ marginTop: 6, color: '#444', fontSize: 8 }}>{error}</div>
      <div style={{ marginTop: 8, color: '#00ccff', fontSize: 8 }}>Add Finnhub API key in Settings → API Keys</div>
    </div>
  );

  const sorted = [...events].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
  const highCount = events.filter(e => e.impact === 'HIGH' || e.impact === 'CRITICAL').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a1a2e', fontSize: 8 }}>
        <div style={{ padding: '4px 10px', borderRight: '1px solid #1a1a2e' }}>
          <span style={{ color: '#444' }}>EVENTS: </span><span style={{ color: '#00ff88' }}>{events.length}</span>
        </div>
        <div style={{ padding: '4px 10px', borderRight: '1px solid #1a1a2e' }}>
          <span style={{ color: '#444' }}>HIGH IMP: </span><span style={{ color: '#ff3355' }}>{highCount}</span>
        </div>
        <div style={{ padding: '4px 10px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={8} color="#444" />
          <span style={{ color: '#444' }}>SRC: FINNHUB</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 18px 1fr 56px 56px 56px', padding: '2px 8px', borderBottom: '1px solid #1a1a2e', fontSize: 7, color: '#333', letterSpacing: 1 }}>
        <span>TIME</span><span></span><span>EVENT</span>
        <span style={{ textAlign: 'right' }}>FORECAST</span>
        <span style={{ textAlign: 'right' }}>PREVIOUS</span>
        <span style={{ textAlign: 'right' }}>IMPACT</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 16, color: '#444', fontSize: 9, textAlign: 'center' }}>No events this week for selected region</div>
        ) : sorted.map((event, idx) => {
          const impactColor = IMPACT_COLORS[event.impact] || '#666680';
          const countdown = countdowns[event.time] || '';
          const isNext = countdown && countdown !== 'RELEASED';
          const isExp = expanded === `ev-${idx}`;
          return (
            <div key={`ev-${idx}`}>
              <div
                onClick={() => setExpanded(isExp ? null : `ev-${idx}`)}
                style={{ display: 'grid', gridTemplateColumns: '52px 18px 1fr 56px 56px 56px', alignItems: 'center', padding: '5px 8px', borderBottom: '1px solid #0f0f18', cursor: 'pointer', background: isNext ? `${impactColor}08` : 'transparent', borderLeft: isNext ? `2px solid ${impactColor}` : '2px solid transparent' }}
              >
                <div>
                  <div style={{ fontSize: 9, color: '#666680' }}>{event.time}</div>
                  {isNext && <div style={{ fontSize: 7, color: impactColor }}>{countdown}</div>}
                </div>
                <span style={{ fontSize: 12 }}>{FLAG_MAP[event.country] || '🌐'}</span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 9, color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.event}</div>
                  <div style={{ fontSize: 7, color: '#444' }}>{event.country}</div>
                </div>
                <span style={{ fontSize: 9, color: '#666680', textAlign: 'right' }}>{event.forecast || '—'}</span>
                <span style={{ fontSize: 9, color: '#444', textAlign: 'right' }}>{event.previous || '—'}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  {Array.from({ length: event.impact === 'HIGH' || event.impact === 'CRITICAL' ? 3 : event.impact === 'MEDIUM' ? 2 : 1 }).map((_, i) => (
                    <div key={i} style={{ width: 5, height: 10, background: impactColor }} />
                  ))}
                </div>
              </div>
              {isExp && (
                <div style={{ padding: '6px 8px 6px 24px', borderBottom: '1px solid #1a1a2e', background: 'rgba(0,204,255,0.03)' }}>
                  <div style={{ fontSize: 8, color: '#666680' }}>
                    <span style={{ color: '#444' }}>IMPACT: </span><span style={{ color: impactColor }}>{event.impact}</span>
                    <span style={{ color: '#444', marginLeft: 12 }}>COUNTRY: </span><span style={{ color: '#e8e8e8' }}>{event.country}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>SRC: FINNHUB ECONOMIC CALENDAR</span>
        <span style={{ marginLeft: 'auto', color: region !== 'GLOBAL' ? '#00ccff' : '#333' }}>REGION: {region}</span>
      </div>
    </div>
  );
}
