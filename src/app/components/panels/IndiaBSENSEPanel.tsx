import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useUiStore } from '../../stores/uiStore';
import { useTickerConfigStore } from '../../stores/tickerConfigStore';
import { fetchIndiaMarkets, fetchYahooMeta } from '../../services/apiServices';
import { fmtPct } from '../../utils/numberFormat';

function fmtIN(n: number) { return n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  exchange: string;
}

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector: string;
}

// Known sector mapping (factual company category, not price data)
const SECTOR_MAP: Record<string, string> = {
  'RELIANCE.NS': 'Energy',
  'TCS.NS': 'IT',
  'INFY.NS': 'IT',
  'HDFCBANK.NS': 'Banking',
  'ICICIBANK.NS': 'Banking',
  'HINDUNILVR.NS': 'FMCG',
  'BHARTIARTL.NS': 'Telecom',
  'SBIN.NS': 'Banking',
  'BAJFINANCE.NS': 'Finance',
  'KOTAKBANK.NS': 'Banking',
  'LT.NS': 'Infra',
  'AXISBANK.NS': 'Banking',
  'HCLTECH.NS': 'IT',
  'ASIANPAINT.NS': 'Consumer',
  'MARUTI.NS': 'Auto',
  'SUNPHARMA.NS': 'Pharma',
  'TITAN.NS': 'Consumer',
  'ULTRACEMCO.NS': 'Cement',
  'WIPRO.NS': 'IT',
  'NESTLEIND.NS': 'FMCG',
};

const SECTOR_COLORS: Record<string, string> = {
  Energy: '#f59e0b', IT: '#00ccff', Banking: '#00ff88', FMCG: '#fb923c',
  Telecom: '#a78bfa', Finance: '#f472b6', Infra: '#fbbf24', Consumer: '#60a5fa',
  Auto: '#ffaa00', Pharma: '#34d399', Cement: '#a78bfa',
};

async function fetchYahooNS(symbol: string) {
  const meta = await fetchYahooMeta(symbol);
  return {
    price: meta.regularMarketPrice,
    change: meta.regularMarketChange,
    changePct: meta.regularMarketChangePercent,
  };
}

type TabType = 'INDICES' | 'SENSEX30' | 'ACTIVITY' | 'SECTORS';

export function IndiaBSENSEPanel({ refreshKey }: { refreshKey?: number }) {
  const [tab, setTab] = useState<TabType>('INDICES');
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchFilter, setExchFilter] = useState<'ALL' | 'BSE' | 'NSE'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'changePct'>('changePct');

  const region = useUiStore(s => s.region);
  const cfg = useTickerConfigStore(s => s.config);

  if (region !== 'GLOBAL' && region !== 'INDIA') {
    return (
      <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8, background: '#0a0a12' }}>
        <AlertTriangle size={16} color="#ff3355" />
        <span style={{ color: '#ff3355', letterSpacing: 1 }}>REGION NOT SUPPORTED</span>
        <span style={{ textAlign: 'center' }}>BSE/NSE Live is only available in INDIA, ASIA, or GLOBAL views.</span>
      </div>
    );
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch indices (already available via apiServices)
        const idxData = await fetchIndiaMarkets();

        // Fetch individual stocks from Yahoo
        const stockResults = await Promise.allSettled(
          cfg.indiaNseStocks.map(async (ticker: string) => {
            try {
              const d = await fetchYahooNS(ticker);
              const clean = ticker.replace('.NS', '');
              return {
                ticker: clean,
                name: clean, // Use simple name from ticker itself
                price: d.price,
                change: d.change,
                changePct: d.changePct,
                sector: SECTOR_MAP[ticker] || 'Other',
              };
            } catch (e: any) {
              console.warn(`Stock fetch failed for ${ticker}:`, e.message);
              return null;
            }
          })
        );

        if (!mounted) return;

        const validStocks = stockResults
          .filter((r): r is PromiseFulfilledResult<StockData> => r.status === 'fulfilled' && r.value !== null)
          .map(r => r.value);

        setIndices(idxData.map((d: any) => ({
          symbol: d.symbol,
          name: d.name,
          price: d.price,
          change: d.change,
          changePct: d.changePct,
          exchange: d.name.includes('SENSEX') || d.name.includes('BSE') ? 'BSE' : 'NSE',
        })));

        if (validStocks.length > 0) {
          setStocks(validStocks);
        }

        setLoading(false);
      } catch (e: any) {
        console.error('India markets load failed', e);
        if (mounted) {
          setError(e.message || 'Failed to load India market data');
          setLoading(false);
        }
      }
    };
    load();
    const t = setInterval(load, 120000);
    return () => { mounted = false; clearInterval(t); };
  }, [refreshKey, cfg.indiaNseStocks]);

  const sortedStocks = [...stocks].sort((a, b) =>
    sortField === 'changePct' ? Math.abs(b.changePct) - Math.abs(a.changePct) : a.ticker.localeCompare(b.ticker)
  );

  const advances = stocks.filter(s => s.changePct >= 0).length;
  const declines = stocks.length - advances;

  const s: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };

  if (loading && indices.length === 0) {
    return <div style={{ ...s, padding: 16, color: '#444', fontSize: 9 }}>LOADING INDIAN MARKETS...</div>;
  }
  if (error && indices.length === 0) {
    return (
      <div style={{ ...s, padding: 16, color: '#ff3355', fontSize: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={12} /> ERROR: {error}
      </div>
    );
  }

  // Sectors data (grouped from live feed)
  const sectorGroups: Record<string, StockData[]> = {};
  stocks.forEach(stock => {
    if (!sectorGroups[stock.sector]) sectorGroups[stock.sector] = [];
    sectorGroups[stock.sector].push(stock);
  });

  return (
    <div style={{ ...s, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '4px 8px', background: '#0f0f1a', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>🇮🇳</span>
        <div>
          <div style={{ fontSize: 9, color: '#FF9933', letterSpacing: 2 }}>BSE / NSE LIVE</div>
          <div style={{ fontSize: 7, color: '#444' }}>SENSEX · NIFTY · STOCKS</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 7, alignItems: 'center' }}>
          <span style={{ color: '#00ff88' }}>▲ {advances} ADV</span>
          <span style={{ color: '#ff3355' }}>▼ {declines} DEC</span>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', animation: 'pulse-dot 2s infinite' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        {(['INDICES', 'SENSEX30', 'ACTIVITY', 'SECTORS'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: tab === t ? '#1a1a2e' : 'transparent',
            color: tab === t ? '#FF9933' : '#555',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', letterSpacing: 1,
          }}>{t}</button>
        ))}
      </div>

      {/* ── INDICES TAB ── */}
      {tab === 'INDICES' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {indices.map(idx => {
            const up = idx.changePct >= 0;
            const color = up ? '#00ff88' : '#ff3355';
            const exColor = idx.exchange === 'BSE' ? '#FF9933' : '#00ccff';
            return (
              <div key={idx.symbol} style={{ padding: '5px 8px', borderBottom: '1px solid #0f0f18' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                      <span style={{ fontSize: 10, color: '#e8e8e8' }}>{idx.name}</span>
                      <span style={{ fontSize: 7, color: exColor, border: `1px solid ${exColor}33`, padding: '0 3px' }}>{idx.exchange}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
                      {up ? <TrendingUp size={8} color={color} /> : <TrendingDown size={8} color={color} />}
                      <span style={{ fontSize: 8, color }}>{fmtPct(idx.changePct)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 78 }}>
                    <div style={{ fontSize: 12, color: '#e8e8e8' }}>{fmtIN(idx.price)}</div>
                    <div style={{ fontSize: 8, color }}>{idx.change >= 0 ? '+' : ''}{fmtIN(idx.change)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SENSEX 30 TAB ── */}
      {tab === 'SENSEX30' && (
        <>
          <div style={{ display: 'flex', padding: '2px 8px', borderBottom: '1px solid #1a1a2e', fontSize: 7, color: '#333', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setSortField('name')} style={{ background: 'none', border: 'none', color: sortField === 'name' ? '#FF9933' : '#444', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 7 }}>A-Z</button>
            <button onClick={() => setSortField('changePct')} style={{ background: 'none', border: 'none', color: sortField === 'changePct' ? '#FF9933' : '#444', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 7 }}>CHG%</button>
            <span style={{ marginLeft: 'auto' }}>NSE STOCKS — YAHOO FINANCE</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 76px 52px', padding: '2px 8px', borderBottom: '1px solid #0f0f18', fontSize: 7, color: '#333', letterSpacing: 1, flexShrink: 0 }}>
              <span>TICKER</span><span>SECTOR</span><span style={{ textAlign: 'right' }}>PRICE ₹</span><span style={{ textAlign: 'right' }}>CHG%</span>
            </div>
            {sortedStocks.map(stock => {
              const up = stock.changePct >= 0;
              const color = up ? '#00ff88' : '#ff3355';
              const sc = SECTOR_COLORS[stock.sector] || '#666680';
              return (
                <div key={stock.ticker} style={{
                  display: 'grid', gridTemplateColumns: '72px 1fr 76px 52px',
                  alignItems: 'center', padding: '4px 8px',
                  borderBottom: '1px solid #0a0a12',
                  borderLeft: `2px solid ${sc}44`,
                }}>
                  <span style={{ fontSize: 9, color: '#FF9933' }}>{stock.ticker}</span>
                  <span style={{ fontSize: 8, color: sc }}>{stock.sector}</span>
                  <span style={{ fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>₹{fmtIN(stock.price)}</span>
                  <span style={{ fontSize: 9, color, textAlign: 'right' }}>{fmtPct(stock.changePct)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === 'ACTIVITY' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ fontSize: 8, color: '#555', letterSpacing: 2, marginBottom: 8 }}>INTRA-DAY MARKET BREADTH (LIVE)</div>

          {/* FII/DII premium notice */}
          <div style={{ padding: '8px', background: '#0f0f18', border: '1px solid #1a1a2e', marginBottom: 12 }}>
            <div style={{ fontSize: 8, color: '#FF9933', letterSpacing: 1, marginBottom: 4 }}>FII / DII FLOW DATA</div>
            <div style={{ fontSize: 9, color: '#666' }}>
              Institutional flow data (FII/DII buy/sell) requires a premium data feed from NSE/BSE or licensed vendors (Bloomberg, Refinitiv, NSE Data Portal). Configure API key in Settings.
            </div>
          </div>

          {/* Real live breadth */}
          <div style={{ padding: '8px', background: '#0f0f18', border: '1px solid #1a1a2e', marginBottom: 12 }}>
            <div style={{ fontSize: 8, color: '#444', letterSpacing: 1, marginBottom: 6 }}>MARKET BREADTH</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#00ff88' }}>▲ {advances} ADV</span>
              <span style={{ fontSize: 11, color: '#ff3355' }}>▼ {declines} DEC</span>
              <span style={{ fontSize: 9, color: '#555', alignSelf: 'center' }}>of {stocks.length} tracked</span>
            </div>
            <div style={{ height: 6, background: '#1a1a2e', display: 'flex' }}>
              <div style={{ height: '100%', width: `${stocks.length > 0 ? (advances / stocks.length) * 100 : 50}%`, background: '#00ff88' }} />
              <div style={{ height: '100%', flex: 1, background: '#ff3355' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── SECTORS TAB ── */}
      {tab === 'SECTORS' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ fontSize: 8, color: '#555', letterSpacing: 2, marginBottom: 8 }}>SECTORAL BREAKDOWN (LIVE)</div>
          {Object.entries(sectorGroups).map(([sector, sectorStocks]) => {
            const avg = sectorStocks.reduce((sum, s) => sum + s.changePct, 0) / sectorStocks.length;
            const up = avg >= 0;
            const color = SECTOR_COLORS[sector] || '#666680';
            return (
              <div key={sector} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color }}>{sector.toUpperCase()} ({sectorStocks.length})</span>
                  <span style={{ fontSize: 9, color: up ? '#00ff88' : '#ff3355' }}>{fmtPct(avg)}</span>
                </div>
                <div style={{ height: 3, background: '#1a1a2e' }}>
                  <div style={{ height: '100%', width: `${Math.min(Math.abs(avg) * 30, 100)}%`, background: color, opacity: 0.7 }} />
                </div>
                <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>
                  {sectorStocks.map(s => s.ticker).join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333', alignItems: 'center', flexShrink: 0 }}>
        <IndianRupee size={8} color="#FF9933" />
        <span>YAHOO FINANCE / FINNHUB · BSE · NSE</span>
        <span style={{ marginLeft: 'auto', color: '#FF9933' }}>🇮🇳 INDIA MARKETS</span>
      </div>
    </div>
  );
}
