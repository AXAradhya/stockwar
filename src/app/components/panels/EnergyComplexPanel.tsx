import { useState, useEffect } from 'react';
import { fetchEnergyPrices } from '../../services/apiServices';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

export function EnergyComplexPanel() {
  const [data, setData] = useState<any[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, { v: number }[]>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await fetchEnergyPrices();
        if (mounted) {
          setData(d);
          // Sparklines: set empty — real historical data requires paid API
          setSparklines({});
        }
      } catch { /* keep existing */ }
    };
    load();
    const t = setInterval(load, 3600000); // EIA updates weekly; refresh hourly
    return () => { mounted = false; clearInterval(t); };
  }, []);

  // Find WTI/Brent for headline
  const wti = data.find(d => d.symbol === 'CL=F');
  const brent = data.find(d => d.symbol === 'BZ=F');
  const spread = (brent && wti && typeof brent.price === 'number' && typeof wti.price === 'number')
    ? (brent.price - wti.price)
    : null;
  const showSpread = spread !== null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Oil headline */}
      <div style={{
        padding: '4px 8px', background: 'rgba(255,170,0,0.06)',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Flame size={10} color="#ffaa00" />
        <span style={{ fontSize: 8, color: '#ffaa00', letterSpacing: 1 }}>ENERGY COMPLEX</span>
        {showSpread && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 8, color: '#444' }}>
              WTI/BRENT SPREAD: <span style={{ color: spread > 0 ? '#00ff88' : '#ff3355' }}>
                {`$${fmtNum(Math.abs(spread), 2)}`}
              </span>
            </span>
            <span style={{ fontSize: 8, color: '#444' }}>
              OPEC TARGET: <span style={{ color: '#ffaa00' }}>$80/bbl</span>
            </span>
          </div>
        )}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 40px 80px 70px',
        padding: '3px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 8, color: '#444', letterSpacing: 1,
        background: '#0d0d18',
      }}>
        <span>COMMODITY</span>
        <span></span>
        <span></span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
      </div>

      {/* Commodity rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {data.map(e => {
          const up = (typeof e.change === 'number') ? (e.change >= 0) : false;
          const color = up ? '#00ff88' : '#ff3355';
          const spark = sparklines[e.symbol] || [];
          return (
            <div
              key={e.symbol}
              style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 40px 80px 70px',
                alignItems: 'center', padding: '5px 8px',
                borderBottom: '1px solid #0f0f18', gap: 4,
              }}
            >
              <div>
                <div style={{ fontSize: 9, color: '#ffaa00' }}>{e.name}</div>
                <div style={{ fontSize: 7, color: '#333' }}>{e.symbol}</div>
              </div>

              <div style={{ fontSize: 7, color: '#444' }}>{e.unit}</div>

              <div style={{ height: 18 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spark}>
                    <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#e8e8e8' }}>
                  {typeof e.price === 'number' && Number.isFinite(e.price)
                    ? `$${fmtNum(e.price, e.price < 10 ? 3 : 2, '-')}`
                    : '-'}
                </span>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                {up ? <TrendingUp size={8} color={color} /> : <TrendingDown size={8} color={color} />}
                <span style={{ fontSize: 9, color }}>
                  {typeof e.changePct === 'number' && Number.isFinite(e.changePct)
                    ? fmtPct(e.changePct, 2)
                    : '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Oil supply/demand context */}
      <div style={{
        padding: '4px 8px', borderTop: '1px solid #1a1a2e',
        background: '#0f0f1a', display: 'flex', gap: 12, fontSize: 8,
      }}>
        <span style={{ color: '#444' }}>OPEC+ CUT: <span style={{ color: '#ff3355' }}>500k bpd</span></span>
        <span style={{ color: '#444' }}>SUEZ FLOW: <span style={{ color: '#ffaa00' }}>-40%</span></span>
        <span style={{ color: '#444' }}>EIA INV: <span style={{ color: '#00ff88' }}>-2.3M</span></span>
      </div>
    </div>
  );
}
