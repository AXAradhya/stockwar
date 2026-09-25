import { useEffect, useState } from 'react';
import { HelpCircle, Bell, Database, Cpu, AlertTriangle } from 'lucide-react';
import { fetchLiveNews } from '../../services/apiServices';
import { useAlertStore } from '../../stores/alertStore';

interface TaskbarPanel {
  id: string;
  shortCode: string;
  status: 'fresh' | 'stale' | 'error';
}

interface BottomTaskbarProps {
  activePanels: TaskbarPanel[];
  onPanelClick: (id: string) => void;
  onOpenHelp: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  fresh: '#00ff88',
  stale: '#ffaa00',
  error: '#ff3355',
};

export function BottomTaskbar({ activePanels, onPanelClick, onOpenHelp }: BottomTaskbarProps) {
  const [alertIdx, setAlertIdx] = useState(0);
  const [time, setTime] = useState(new Date());
  const [dataRate, setDataRate] = useState(0);
  const [cpuPct, setCpuPct] = useState(0);
  const { notifications, unreadCount, markAllRead } = useAlertStore();

  const [liveNews, setLiveNews] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchLiveNews().then(d => {
      if (mounted) setLiveNews(d);
    }).catch(e => console.error(e));

    const t = setInterval(() => {
      setAlertIdx(v => (v + 1) % Math.max(1, liveNews.length || 1));
      setTime(new Date());
      // Real data rate from Performance API (no Math.random)
      try {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const recent = entries.slice(-20);
        const totalBytes = recent.reduce((sum, e) => sum + (e.transferSize || 0), 0);
        setDataRate(Math.round(totalBytes / 1024 / 5)); // approx kb/s over ~5s window
      } catch {
        setDataRate(0);
      }
      // Browser heap usage (Chrome) as health proxy — CPU not available via JS
      try {
        if ('memory' in performance) {
          const mem = (performance as any).memory;
          setCpuPct(mem.usedJSHeapSize && mem.totalJSHeapSize
            ? Math.min(Math.round((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100), 100)
            : 0);
        } else {
          setCpuPct(0);
        }
      } catch {
        setCpuPct(0);
      }
    }, 4000);
    return () => { mounted = false; clearInterval(t); };
  }, [liveNews.length]);

  const fallbackAlert = { severity: 'low', source: 'SYSTEM', title: 'Awaiting data streams...', tickers: [] };
  const currentAlert = liveNews[alertIdx] || fallbackAlert;
  const severityColor =
    currentAlert?.severity === 'critical' ? '#ff3355' :
    currentAlert?.severity === 'high' ? '#ffaa00' : '#00ccff';

  // Latest unread notification for banner
  const latestUnread = notifications.find(n => !n.read);
  const bannerColor = latestUnread?.severity === 'critical' ? '#ff3355' : latestUnread?.severity === 'warning' ? '#ffaa00' : severityColor;

  const cpuLabel = cpuPct > 0 ? `${cpuPct}%` : 'N/A';

  return (
    <div style={{
      height: 28, background: '#080810', borderTop: '1px solid #1a1a2e',
      display: 'flex', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10, color: '#e8e8e8', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Panel tabs */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflowX: 'auto', borderRight: '1px solid #1a1a2e', maxWidth: '35%', scrollbarWidth: 'none' }}>
        {activePanels.map((p, i) => (
          <button key={p.id} onClick={() => onPanelClick(p.id)} style={{
            height: '100%', padding: '0 7px', whiteSpace: 'nowrap',
            background: i === 0 ? '#12121e' : 'transparent',
            border: 'none', borderRight: '1px solid #1a1a2e',
            cursor: 'pointer', color: i === 0 ? '#e8e8e8' : '#555',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.1s',
          }}>
            <div style={{ width: 4, height: 4, background: STATUS_COLORS[p.status] || '#333', boxShadow: p.status === 'fresh' ? `0 0 3px ${STATUS_COLORS[p.status]}` : 'none' }} />
            <span>{p.shortCode}</span>
          </button>
        ))}
      </div>

      {/* Panel count badge */}
      <div style={{ padding: '0 8px', borderRight: '1px solid #1a1a2e', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 8, color: '#444' }}>{activePanels.length} <span style={{ color: '#00ccff' }}>PANELS</span></span>
      </div>

      {/* Alert Stream — shows latest unread notification or breaking news */}
      <div style={{ flex: 1, padding: '0 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
        {latestUnread ? (
          <>
            <AlertTriangle size={8} style={{ flexShrink: 0, color: bannerColor }} />
            <span style={{ fontSize: 8, color: bannerColor, flexShrink: 0, letterSpacing: 1 }}>ALERT</span>
            <span style={{ fontSize: 8, color: '#444' }}>›</span>
            <span style={{ color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9 }}>
              {latestUnread.message}
            </span>
            {latestUnread.ticker && (
              <span style={{ fontSize: 7, color: '#00ccff', flexShrink: 0, border: '1px solid #00ccff22', padding: '0 2px' }}>{latestUnread.ticker}</span>
            )}
          </>
        ) : (
          <>
            <Bell size={8} style={{ flexShrink: 0, color: severityColor }} />
            <span style={{ color: '#555', flexShrink: 0, fontSize: 8 }}>{currentAlert.source.toUpperCase()}</span>
            <span style={{ fontSize: 8, color: '#444' }}>›</span>
            <span style={{ color: severityColor === '#00ccff' ? '#888' : '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9 }}>
              {currentAlert.title}
            </span>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {currentAlert.tickers.slice(0, 3).map((t: string) => (
                <span key={t} style={{ fontSize: 7, color: '#00ccff', flexShrink: 0, border: '1px solid #00ccff22', padding: '0 2px' }}>{t}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Notification badge */}
      {unreadCount > 0 && (
        <button
          onClick={markAllRead}
          title={`${unreadCount} unread alerts — click to clear`}
          style={{
            height: '100%', padding: '0 8px', borderLeft: '1px solid #1a1a2e',
            background: 'rgba(255,51,85,0.1)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}
        >
          <Bell size={9} color="#ff3355" />
          <span style={{ fontSize: 8, color: '#ff3355', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{unreadCount}</span>
        </button>
      )}

      {/* System Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderLeft: '1px solid #1a1a2e', flexShrink: 0, height: '100%' }}>
        <div style={{ padding: '0 8px', borderRight: '1px solid #1a1a2e', height: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Database size={8} color="#444" />
          <span style={{ fontSize: 8, color: '#444' }}>{dataRate}<span style={{ color: '#333' }}>kb/s</span></span>
        </div>
        <div style={{ padding: '0 8px', borderRight: '1px solid #1a1a2e', height: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Cpu size={8} color="#444" />
          <div style={{ width: 24, height: 4, background: '#1a1a2e', position: 'relative' }}>
            <div style={{ width: `${cpuPct > 0 ? cpuPct : 1}%`, height: '100%', background: cpuPct > 70 ? '#ff3355' : cpuPct > 40 ? '#ffaa00' : '#00ff88', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 8, color: '#333' }}>{cpuLabel}</span>
        </div>
        <div style={{ padding: '0 8px', borderRight: '1px solid #1a1a2e', height: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 4px #00ff88' }} />
          <span style={{ fontSize: 8, color: '#444' }}>LIVE</span>
        </div>
        <div style={{ padding: '0 8px', borderRight: '1px solid #1a1a2e', height: '100%', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: '#555' }}>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>

      <button onClick={onOpenHelp} style={{ height: '100%', padding: '0 10px', background: 'transparent', border: 'none', borderLeft: '1px solid #1a1a2e', cursor: 'pointer', color: '#444', transition: 'color 0.15s', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00ccff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#444')}
        title="Help (F1)"
      >
        <HelpCircle size={11} />
      </button>
    </div>
  );
}
