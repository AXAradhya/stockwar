import { useState, useEffect } from 'react';
import { fetchCryptoPrices, fetchDirectAllOrigins } from '../../services/apiServices';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
}

interface GlobalData {
  totalMcap: number;
  btcDom: number;
  ethDom: number;
}

function fmtPriceLocal(n: number) {
  if (!isFinite(n)) return '—';
  if (n > 1000) return `$${fmtNum(n, 0)}`;
  if (n > 1) return `$${fmtNum(n, 2)}`;
  return `$${fmtNum(n, 4)}`;
}

async function fetchGlobalCryptoData(): Promise<GlobalData | null> {
  try {
    const raw = await fetchDirectAllOrigins('https://api.coingecko.com/api/v3/global');
    const parsed = raw?.contents ? JSON.parse(raw.contents) : raw;
    if (!parsed?.data) return null;
    return {
      totalMcap: (parsed.data.total_market_cap?.usd || 0) / 1e12,
      btcDom: parsed.data.market_cap_percentage?.btc || 0,
      ethDom: parsed.data.market_cap_percentage?.eth || 0,
    };
  } catch {
    return null;
  }
}

export function CryptoPanel({ refreshKey }: { refreshKey?: number }) {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [prices, global] = await Promise.all([
          fetchCryptoPrices(),
          fetchGlobalCryptoData(),
        ]);
        if (!mounted) return;
        setCryptos(prices);
        if (global) setGlobalData(global);
        setLoading(false);
      } catch (e: any) {
        console.error('Failed to fetch crypto', e);
        if (mounted) {
          setError(e.message || 'Failed to load crypto prices');
          setLoading(false);
        }
      }
    };
    fetchData();
    const t = setInterval(fetchData, 60000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshKey]);

  const btc = cryptos[0];
  const altPerf = cryptos.length > 1
    ? cryptos.slice(1).reduce((sum, c) => sum + c.changePct, 0) / (cryptos.length - 1)
    : 0;

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && cryptos.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING CRYPTO...</div>;
  }
  if (error && cryptos.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} /> ERROR: {error}
      </div>
    );
  }

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* BTC Hero */}
      <div style={{
        padding: '6px 8px', background: '#0f0f1a',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 7, color: '#444', letterSpacing: 1 }}>BITCOIN</div>
          <div style={{ fontSize: 16, color: btc?.changePct >= 0 ? '#00ff88' : '#ff3355' }}>
            {btc ? fmtPriceLocal(btc.price) : '—'}
          </div>
          <div style={{ fontSize: 8, color: btc?.changePct >= 0 ? '#00ff88' : '#ff3355' }}>
            {btc ? fmtPct(btc.changePct) : '—'}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7, color: '#444' }}>BTC DOM</div>
          <div style={{ fontSize: 12, color: '#f59e0b' }}>
            {globalData ? fmtNum(globalData.btcDom, 1) : '—'}%
          </div>
          {globalData && (
            <div style={{ fontSize: 7, color: '#444' }}>MCAP ${fmtNum(globalData.totalMcap, 2)}T</div>
          )}
        </div>
      </div>

      {/* Market Overview Bar */}
      <div style={{
        display: 'flex', padding: '3px 8px',
        borderBottom: '1px solid #1a1a2e',
        gap: 12, fontSize: 8,
      }}>
        <span style={{ color: '#444' }}>ALT AVG:</span>
        <span style={{ color: altPerf >= 0 ? '#00ff88' : '#ff3355' }}>
          {fmtPct(altPerf, 2)}
        </span>
        <span style={{ color: '#444', marginLeft: 'auto' }}>BTC DOM</span>
        <div style={{ width: 80, height: 8, background: '#1a1a2e', alignSelf: 'center' }}>
          <div style={{ width: `${globalData?.btcDom || 0}%`, height: '100%', background: '#f59e0b' }} />
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 80px 60px',
        padding: '2px 8px', borderBottom: '1px solid #1a1a2e',
        fontSize: 7, color: '#333', letterSpacing: 1,
      }}>
        <span>SYM</span>
        <span style={{ textAlign: 'center' }}>VOLUME</span>
        <span style={{ textAlign: 'right' }}>PRICE</span>
        <span style={{ textAlign: 'right' }}>CHG%</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cryptos.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#333', fontSize: 9 }}>
            No crypto data available. Check network connection.
          </div>
        ) : (
          cryptos.map(c => {
            const up = c.changePct >= 0;
            const color = up ? '#00ff88' : '#ff3355';
            return (
              <div
                key={c.symbol}
                style={{
                  display: 'grid', gridTemplateColumns: '44px 1fr 80px 60px',
                  alignItems: 'center', padding: '4px 8px',
                  borderBottom: '1px solid #0f0f18',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 9, color: '#00ccff', letterSpacing: 0.5 }}>{c.symbol}</span>
                <span style={{ fontSize: 8, color: '#666', textAlign: 'center' }}>{c.volume}</span>
                <span style={{ fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>
                  {fmtPriceLocal(c.price)}
                </span>
                <span style={{ fontSize: 9, color, textAlign: 'right' }}>
                  {fmtPct(c.changePct, 2)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
      }}>
        <span>SRC: COINGECKO</span>
        <span style={{ marginLeft: 'auto', color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
