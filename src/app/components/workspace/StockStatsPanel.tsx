import React, { useEffect, useState } from 'react';
import { fetchBasicFinancials } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { PieChart, List, TrendingUp, TrendingDown } from 'lucide-react';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #1a1a2e', fontSize: '10px' }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function StockStatsPanel({ symbol }: { symbol: string }) {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiKeys } = useConfigStore();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!apiKeys.finnhub) {
          if (active) {
            setError('Finnhub API key required for metrics');
            setLoading(false);
          }
          return;
        }

        const data = await fetchBasicFinancials(symbol);
        if (active) setStats(data?.metric || null);
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [symbol, apiKeys.finnhub]);

  return (
    <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a2e', background: '#0d0d18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#00ccff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <PieChart size={12} />
          KEY METRICS
        </h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px', padding: 12 }}>Loading metrics...</div>
        ) : error ? (
          <div style={{ color: '#ff3355', fontSize: '10px', background: 'rgba(255,51,85,0.1)', padding: '8px', margin: 12, border: '1px solid #ff335533' }}>
            {error}
          </div>
        ) : !stats ? (
          <div style={{ color: '#666', fontSize: '10px', padding: 12 }}>No metrics found.</div>
        ) : (
          <div>
            <div style={{ padding: '4px 8px', background: '#11111a', fontSize: '9px', color: '#00ccff', letterSpacing: 1, borderBottom: '1px solid #1a1a2e' }}>VALUATION</div>
            <StatRow label="P/E Ratio (TTM)" value={stats.peTTM ? fmtNum(stats.peTTM, 2, '-') : '-'} />
            <StatRow label="Price / Book" value={stats.pbAnnual ? fmtNum(stats.pbAnnual, 2, '-') : '-'} />
            <StatRow label="Price / Sales (TTM)" value={stats.psTTM ? fmtNum(stats.psTTM, 2, '-') : '-'} />
            <StatRow label="EPS (TTM)" value={stats.epsTTM ? `$${fmtNum(stats.epsTTM, 2)}` : '-'} />
            
            <div style={{ padding: '4px 8px', background: '#11111a', fontSize: '9px', color: '#00ccff', letterSpacing: 1, borderBottom: '1px solid #1a1a2e', borderTop: '1px solid #1a1a2e' }}>PRICE PERFORMANCE</div>
            <StatRow label="52-Week High" value={stats['52WeekHigh'] ? `$${fmtNum(stats['52WeekHigh'], 2)}` : '-'} />
            <StatRow label="52-Week Low" value={stats['52WeekLow'] ? `$${fmtNum(stats['52WeekLow'], 2)}` : '-'} />
            <StatRow 
              label="52-Week Return" 
              value={<span style={{ color: stats['52WeekPriceReturnDaily'] >= 0 ? '#00ff88' : '#ff3355' }}>{stats['52WeekPriceReturnDaily'] ? fmtPct(stats['52WeekPriceReturnDaily'], 2) : '-'}</span>} 
            />
            <StatRow 
              label="YTD Return" 
              value={<span style={{ color: stats.yearToDatePriceReturnDaily >= 0 ? '#00ff88' : '#ff3355' }}>{stats.yearToDatePriceReturnDaily ? fmtPct(stats.yearToDatePriceReturnDaily, 2) : '-'}</span>} 
            />

            <div style={{ padding: '4px 8px', background: '#11111a', fontSize: '9px', color: '#00ccff', letterSpacing: 1, borderBottom: '1px solid #1a1a2e', borderTop: '1px solid #1a1a2e' }}>PROFITABILITY</div>
            <StatRow label="Operating Margin (TTM)" value={stats.operatingMarginTTM ? `${fmtNum(stats.operatingMarginTTM, 2)}%` : '-'} />
            <StatRow label="Net Margin (TTM)" value={stats.netProfitMarginTTM ? `${fmtNum(stats.netProfitMarginTTM, 2)}%` : '-'} />
            <StatRow label="ROE (TTM)" value={stats.roeTTM ? `${fmtNum(stats.roeTTM, 2)}%` : '-'} />
            <StatRow label="ROA (TTM)" value={stats.roaTTM ? `${fmtNum(stats.roaTTM, 2)}%` : '-'} />
          </div>
        )}
      </div>
    </div>
  );
}
