import React, { useEffect, useState } from 'react';
import { fetchStockCandles } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fmtNum } from '../../utils/numberFormat';
import TradingViewWidget from '../ui/TradingViewWidget';
import { Activity } from 'lucide-react';

export function StockChartPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<any[]>([]);
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
          // No Finnhub key — fall back to embedded TradingView widget instead of throwing.
          setData([]);
          setLoading(false);
          return;
        }
        
        // Fetch last 6 months of daily candles
        const to = Math.floor(Date.now() / 1000);
        const from = to - (180 * 24 * 60 * 60);

        const res = await fetchStockCandles(symbol, 'D', from, to);
        if (res && res.s === 'ok') {
          const chartData = res.t.map((time: number, idx: number) => ({
            date: new Date(time * 1000).toLocaleDateString(),
            price: res.c[idx],
            open: res.o[idx],
            high: res.h[idx],
            low: res.l[idx],
            volume: res.v[idx]
          }));
          if (active) setData(chartData);
        }
        // Fallback to TradingView widget when no data
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
          <Activity size={12} />
          {symbol} PRICE ACTION (6M)
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '12px', minHeight: 0 }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px' }}>Loading chart data...</div>
        ) : data.length === 0 ? (
          <div style={{ height: '100%' }}>
            <TradingViewWidget symbol={symbol} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
              <XAxis dataKey="date" stroke="#444" fontSize={9} tickMargin={10} minTickGap={30} />
              <YAxis domain={['auto', 'auto']} stroke="#444" fontSize={9} tickFormatter={(val: any) => (typeof val === 'number' && isFinite(val) ? `$${fmtNum(val, 2)}` : '—')} width={60} orientation="right" />
              <Tooltip
                contentStyle={{ background: '#0d0d18', border: '1px solid #00ccff', borderRadius: 0, fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                itemStyle={{ color: '#00ff88' }}
                formatter={(value: any) => {
                  const v = Number(value);
                  return [isFinite(v) ? `$${fmtNum(v, 2)}` : '—', 'Price'];
                }}
                labelStyle={{ color: '#888', marginBottom: 4 }}
              />
              <Line type="monotone" dataKey="price" stroke="#00ccff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00ff88', stroke: '#000', strokeWidth: 1 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
