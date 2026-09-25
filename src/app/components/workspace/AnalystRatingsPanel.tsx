import React, { useEffect, useState } from 'react';
import { fetchAnalystRatings } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { Star, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export function AnalystRatingsPanel({ symbol }: { symbol: string }) {
  const [ratings, setRatings] = useState<any[]>([]);
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
            setError('Finnhub API key required for analyst ratings');
            setLoading(false);
          }
          return;
        }

        const data = await fetchAnalystRatings(symbol);
        if (active) setRatings(data || []);
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
          <Star size={12} />
          ANALYST RECOMMENDATIONS
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '12px', minHeight: 0 }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px' }}>Loading ratings...</div>
        ) : error ? (
          <div style={{ color: '#ff3355', fontSize: '10px', background: 'rgba(255,51,85,0.1)', padding: '8px', border: '1px solid #ff335533' }}>
            {error}
          </div>
        ) : ratings.length === 0 ? (
          <div style={{ color: '#666', fontSize: '10px' }}>No analyst ratings found.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratings.slice(0, 6).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="period" stroke="#444" fontSize={9} />
              <YAxis stroke="#444" fontSize={9} />
              <Tooltip
                contentStyle={{ background: '#0d0d18', border: '1px solid #1a1a2e', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                itemStyle={{ fontSize: '10px' }}
              />
              <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="strongBuy" name="Strong Buy" stackId="a" fill="#00ff88" />
              <Bar dataKey="buy" name="Buy" stackId="a" fill="#00ccff" />
              <Bar dataKey="hold" name="Hold" stackId="a" fill="#ffaa00" />
              <Bar dataKey="sell" name="Sell" stackId="a" fill="#ff3355" />
              <Bar dataKey="strongSell" name="Strong Sell" stackId="a" fill="#cc0000" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
