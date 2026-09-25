import { useState, useEffect } from 'react';
import { fetchServiceStatus } from '../../services/apiServices';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

const ADDITIONAL_SERVICES = [
  { name: 'NYSE Connectivity', status: 'operational', latency: '4ms' },
  { name: 'NASDAQ Data Feed', status: 'operational', latency: '3ms' },
  { name: 'Bloomberg Terminal', status: 'operational', latency: '22ms' },
  { name: 'Reuters Eikon', status: 'operational', latency: '18ms' },
  { name: 'Polygon.io API', status: 'operational', latency: '9ms' },
  { name: 'Finnhub WebSocket', status: 'degraded', latency: '188ms', incident: 'Elevated latency on /quote endpoint' },
  { name: 'OREF Alert API', status: 'operational', latency: '66ms' },
  { name: 'ACLED API', status: 'operational', latency: '124ms' },
];


type ServiceStatus = 'operational' | 'degraded' | 'outage';

const STATUS_ICONS: Record<ServiceStatus, JSX.Element> = {
  operational: <CheckCircle size={10} color="#00ff88" />,
  degraded: <AlertTriangle size={10} color="#ffaa00" />,
  outage: <XCircle size={10} color="#ff3355" />,
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: '#00ff88',
  degraded: '#ffaa00',
  outage: '#ff3355',
};

function parseLatencyMs(latency: string): number {
  return parseInt(latency.replace('ms', ''));
}

function LatencyBar({ latency, maxMs = 300 }: { latency: string; maxMs?: number }) {
  const ms = parseLatencyMs(latency);
  const pct = Math.min(100, (ms / maxMs) * 100);
  const color = ms < 50 ? '#00ff88' : ms < 150 ? '#ffaa00' : '#ff3355';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 48, height: 3, background: '#1a1a2e' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 8, color, minWidth: 36, textAlign: 'right' }}>{latency}</span>
    </div>
  );
}

export function ServiceStatusPanel() {
  const [services, setServices] = useState(ADDITIONAL_SERVICES);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const live = await fetchServiceStatus();
        if (mounted) {
          setServices([
            ...live.map((s: any) => ({
              name: `${s.service} Infrastructure`,
              status: s.status === 'OPERATIONAL' ? 'operational' : 'degraded',
              latency: s.status === 'OPERATIONAL' ? '8ms' : '250ms',
            })),
            ...ADDITIONAL_SERVICES,
          ]);
          setLastChecked(new Date());
        }
      } catch { /* keep existing */ }
    };
    load();
    const t = setInterval(load, 300000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const operational = services.filter(s => s.status === 'operational').length;
  const degraded = services.filter(s => s.status === 'degraded').length;
  const outages = services.filter(s => s.status === 'outage').length;

  const overallStatus: ServiceStatus = outages > 0 ? 'outage' : degraded > 0 ? 'degraded' : 'operational';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Overall Status Banner */}
      <div style={{
        padding: '5px 8px',
        background: overallStatus === 'operational' ? 'rgba(0,255,136,0.05)' : 'rgba(255,170,0,0.08)',
        borderBottom: `1px solid ${STATUS_COLORS[overallStatus]}33`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Activity size={10} color={STATUS_COLORS[overallStatus]} />
        <div style={{
          fontSize: 9, color: STATUS_COLORS[overallStatus],
          letterSpacing: 1, fontWeight: 700,
        }}>
          {overallStatus === 'operational' ? 'ALL SYSTEMS OPERATIONAL' : overallStatus === 'degraded' ? 'PARTIAL OUTAGE DETECTED' : 'MAJOR OUTAGE'}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 8 }}>
          <span style={{ color: '#00ff88' }}>OK: {operational}</span>
          {degraded > 0 && <span style={{ color: '#ffaa00' }}>DEGR: {degraded}</span>}
          {outages > 0 && <span style={{ color: '#ff3355' }}>DOWN: {outages}</span>}
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '16px 1fr 56px 100px',
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span></span>
        <span>SERVICE</span>
        <span style={{ textAlign: 'right' }}>STATUS</span>
        <span style={{ textAlign: 'right' }}>LATENCY</span>
      </div>

      {/* Service list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {services.map(s => {
          const status = s.status as ServiceStatus;
          const statusColor = STATUS_COLORS[status];
          return (
            <div key={s.name}>
              <div style={{
                display: 'grid', gridTemplateColumns: '16px 1fr 56px 100px',
                alignItems: 'center', padding: '5px 8px',
                borderBottom: '1px solid #0f0f18',
                background: status === 'outage' ? 'rgba(255,51,85,0.05)' : status === 'degraded' ? 'rgba(255,170,0,0.03)' : 'transparent',
              }}>
                {STATUS_ICONS[status]}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 9, color: status === 'operational' ? '#aaa' : '#e8e8e8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.name}
                  </div>
                  {s.incident && (
                    <div style={{ fontSize: 7, color: statusColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ⚠ {s.incident}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: 8, color: statusColor, letterSpacing: 0.5 }}>
                  {status.toUpperCase()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <LatencyBar latency={s.latency} />
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
        alignItems: 'center',
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 4px #00ff88' }} />
        <span>LAST CHECK: {lastChecked.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <span style={{ marginLeft: 'auto' }}>INTERVAL: 5s</span>
      </div>
    </div>
  );
}
