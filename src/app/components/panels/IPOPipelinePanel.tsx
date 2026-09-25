import { useState, useEffect } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { fetchIPOPipeline } from '../../services/apiServices';
import { fmtNum } from '../../utils/numberFormat';
import { logToTerminal } from '../../stores/logStore';

interface IPO {
  id: string;
  company: string;
  ticker: string;
  sector: string;
  priceRange: string;
  sharesOffered: string;
  expectedDate: string;
  valuation: string;
  status: 'UPCOMING' | 'PRICED' | 'TRADING' | 'FILED' | 'WITHDRAWN';
  leadUnderwriter: string;
  type: 'IPO' | 'SPAC' | 'DIRECT';
  exchange: string;
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: '#00ccff',
  PRICED: '#ffaa00',
  TRADING: '#00ff88',
  FILED: '#a78bfa',
  WITHDRAWN: '#ff3355',
};

const TYPE_BADGE: Record<string, string> = {
  IPO: '#00ccff',
  SPAC: '#a78bfa',
  DIRECT: '#ffaa00',
};

interface Props {
  refreshKey?: number;
  region?: string;
}

// Exchange to region mapping for IPO filtering
const EXCHANGE_REGIONS: Record<string, string> = {
  NASDAQ: 'AMERICAS',
  NYSE: 'AMERICAS',
  NSE: 'INDIA',
  BSE: 'INDIA',
  LSE: 'EUROPE',
  EURONEXT: 'EUROPE',
};

export function IPOPipelinePanel({ refreshKey, region }: Props = {}) {
  const [ipos, setIpos] = useState<IPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IPO'>('ALL');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const today = new Date();
        const from = today.toISOString().split('T')[0];
        const to = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const data = await fetchIPOPipeline(from, to);
        if (!mounted) return;

        const mapped: IPO[] = (data || []).map((ipo: any, idx: number) => ({
          id: idx.toString(),
          company: ipo.name || 'Unknown',
          ticker: ipo.symbol || 'TBD',
          sector: '—',
          priceRange: ipo.price || 'TBD',
          sharesOffered: ipo.numberOfShares ? `${fmtNum(ipo.numberOfShares / 1000000, 1)}M` : 'TBD',
          expectedDate: ipo.date || '—',
          valuation: '—',
          status: (ipo.status || 'upcoming').toUpperCase() as IPO['status'],
          leadUnderwriter: '—',
          type: 'IPO',
          exchange: ipo.exchange || '',
        }));

        // Filter by region if specified
        const regionFiltered = region && region !== 'GLOBAL'
          ? mapped.filter(ipo => {
              const ipoRegion = EXCHANGE_REGIONS[ipo.exchange] || 'AMERICAS';
              return ipoRegion === region;
            })
          : mapped;
        setIpos(regionFiltered);
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Failed to fetch IPO data');
          logToTerminal('ERROR', 'Panel:IPOPipeline', e.message || String(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [refreshKey, region]);

  const filtered = filter === 'ALL' ? ipos : ipos.filter(ipo => ipo.type === filter);
  const upcomingTotal = ipos.filter(i => i.status === 'UPCOMING').length;
  const pricingThisWeek = ipos.filter(i => {
    if (!i.expectedDate || i.expectedDate === '—') return false;
    const d = new Date(i.expectedDate);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && ipos.length === 0) {
    return <div style={{ ...s, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#444' }}>LOADING IPO PIPELINE...</div>;
  }

  if (error && ipos.length === 0) {
    return <div style={{ ...s, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ff3355', padding: 16 }}>ERROR: {error}</div>;
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Stats */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {[
          { label: 'UPCOMING', value: upcomingTotal.toString(), color: '#00ccff', icon: <Calendar size={9} /> },
          { label: 'THIS WEEK', value: pricingThisWeek.toString(), color: '#ffaa00', icon: <Calendar size={9} /> },
          { label: 'TOTAL', value: ipos.length.toString(), color: '#00ff88', icon: <DollarSign size={9} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ flex: 1, padding: '5px 8px', borderRight: '1px solid #1a1a2e', background: '#09090f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: '#444', marginBottom: 2 }}>
              {icon} {label}
            </div>
            <div style={{ fontSize: 13, color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['ALL', 'IPO'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: '4px 0', border: 'none', cursor: 'pointer', fontSize: 9,
            background: filter === f ? '#1a1a2e' : 'transparent', color: filter === f ? '#00ccff' : '#444',
            letterSpacing: 1, fontFamily: 'JetBrains Mono', borderBottom: filter === f ? '2px solid #00ccff' : '2px solid transparent',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 7, color: '#444' }}>
            {region && region !== 'GLOBAL' ? `● ${region}` : '● GLOBAL'}
          </span>
        </div>
      </div>

      {/* IPO list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 10, color: '#444' }}>
            No IPOs scheduled in the next 90 days.
          </div>
        )}
        {filtered.map((ipo) => (
          <div key={ipo.id} style={{ padding: '6px 8px', borderBottom: '1px solid #0a0a12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#e8e8e8', fontWeight: 600 }}>{ipo.company}</span>
                <span style={{ fontSize: 7, color: TYPE_BADGE[ipo.type], border: `1px solid ${TYPE_BADGE[ipo.type]}44`, padding: '1px 3px', letterSpacing: 1 }}>{ipo.type}</span>
              </div>
              <span style={{ fontSize: 8, color: STATUS_COLORS[ipo.status] || '#666', letterSpacing: 1 }}>
                ● {ipo.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ display: 'flex', gap: 10, fontSize: 8, color: '#555' }}>
                <span style={{ color: '#00ccff' }}>{ipo.ticker}</span>
                <span>{ipo.sector}</span>
              </div>
              <span style={{ fontSize: 8, color: '#ffaa00' }}>{ipo.valuation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#444' }}>
              <span>{ipo.priceRange}</span>
              <span>{ipo.sharesOffered} shares</span>
              <span style={{ color: '#666' }}>{ipo.expectedDate}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '3px 8px', borderTop: '1px solid #1a1a2e', fontSize: 8, color: '#333', display: 'flex', justifyContent: 'space-between' }}>
        <span>FINNHUB IPO CALENDAR</span>
        <span style={{ color: '#00ff88' }}>● T2</span>
      </div>
    </div>
  );
}
