import React, { useEffect, useState } from 'react';
import { fetchStockEarnings } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fmtNum } from '../../utils/numberFormat';
import { Briefcase } from 'lucide-react';

export function StockEarningsPanel({ symbol }: { symbol: string }) {
  const [earnings, setEarnings] = useState<any[]>([]);
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
            setError('Finnhub API key required for earnings');
            setLoading(false);
          }
          return;
        }

        const data = await fetchStockEarnings(symbol);
        if (active) setEarnings(data || []);
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
          <Briefcase size={12} />
          EARNINGS SURPRISES
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '12px', minHeight: 0 }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px' }}>Loading earnings...</div>
        ) : error ? (
          <div style={{ color: '#ff3355', fontSize: '10px', background: 'rgba(255,51,85,0.1)', padding: '8px', border: '1px solid #ff335533' }}>
            {error}
          </div>
        ) : earnings.length === 0 ? (
          <div style={{ color: '#666', fontSize: '10px' }}>No earnings data found.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={earnings.slice(0, 8).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="period" stroke="#444" fontSize={9} />
              <YAxis stroke="#444" fontSize={9} tickFormatter={(val) => `$${fmtNum(val, 2)}`} />
              <Tooltip
                contentStyle={{ background: '#0d0d18', border: '1px solid #1a1a2e', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                itemStyle={{ fontSize: '10px' }}
                formatter={(value: number) => `$${fmtNum(value, 2)}`}
              />
              <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
              <Line type="monotone" dataKey="actual" name="Actual EPS" stroke="#00ff88" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="estimate" name="Estimate EPS" stroke="#00ccff" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
